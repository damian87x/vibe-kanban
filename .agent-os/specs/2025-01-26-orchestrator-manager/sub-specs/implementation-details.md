# Implementation Details: Orchestrator Manager

## Development Setup
### Prerequisites
```bash
# Required tools
- Rust 1.75+
- Node.js v18+
- Docker 24.0+
- SQLx CLI
- Claude Code CLI (installed and authenticated)
```

### Environment Variables
```env
# Orchestrator settings
ORCHESTRATOR_ENABLED=true
ORCHESTRATOR_MAX_CONCURRENT=2
ORCHESTRATOR_STAGE_TIMEOUT_SPEC=1800  # 30 minutes
ORCHESTRATOR_STAGE_TIMEOUT_IMPL=3600  # 60 minutes  
ORCHESTRATOR_STAGE_TIMEOUT_QA=1800    # 30 minutes

# Container pool settings
CONTAINER_POOL_SIZE=3
CONTAINER_PORT_START=8081
CONTAINER_PORT_END=8083
CONTAINER_IMAGE=vibe-kanban:latest

# Claude CLI settings
CLAUDE_CLI_PATH=/usr/local/bin/claude
CLAUDE_API_KEY=sk-ant-xxxxx
```

## Code Structure
```
crates/
├── orchestrator/
│   ├── src/
│   │   ├── lib.rs
│   │   ├── service.rs         # OrchestratorService implementation
│   │   ├── stages.rs          # Stage management logic
│   │   ├── container_pool.rs  # Container pool management
│   │   ├── claude_executor.rs # Claude CLI integration
│   │   ├── queue.rs           # Task queue implementation
│   │   └── models.rs          # Data structures
│   └── Cargo.toml
├── server/src/
│   └── routes/
│       └── orchestrator.rs    # API endpoints
└── db/
    └── migrations/
        └── 20250126_orchestrator_tables.sql
```

## Implementation Steps

### Step 1: Database Setup
```sql
-- migrations/20250126_orchestrator_tables.sql
CREATE TABLE orchestrator_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    stage_type VARCHAR(20) NOT NULL CHECK (stage_type IN ('specification', 'implementation', 'qa')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    stage_context JSONB DEFAULT '{}',
    command_output TEXT,
    container_id INTEGER,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orchestrator_task_stages ON orchestrator_stages(task_id, stage_type);
CREATE INDEX idx_orchestrator_status ON orchestrator_stages(status);
CREATE INDEX idx_orchestrator_running ON orchestrator_stages(status) WHERE status = 'running';
```

### Step 2: Core Service Implementation
```rust
// crates/orchestrator/src/service.rs
use sqlx::SqlitePool;
use tokio::sync::RwLock;
use std::sync::Arc;

pub struct OrchestratorService {
    db_pool: SqlitePool,
    container_pool: Arc<RwLock<ContainerPool>>,
    claude_executor: ClaudeExecutor,
    max_concurrent: usize,
    stage_timeouts: StageTimeouts,
}

impl OrchestratorService {
    pub async fn new(db_pool: SqlitePool) -> Result<Self> {
        let container_pool = ContainerPool::new(3, 8081..=8083).await?;
        
        Ok(Self {
            db_pool,
            container_pool: Arc::new(RwLock::new(container_pool)),
            claude_executor: ClaudeExecutor::new(),
            max_concurrent: 2,
            stage_timeouts: StageTimeouts::from_env(),
        })
    }
    
    pub async fn start_orchestration(&self, task_id: Uuid) -> Result<()> {
        // Check concurrent limit
        let running_count = self.count_running_orchestrations().await?;
        if running_count >= self.max_concurrent {
            return self.queue_task(task_id).await;
        }
        
        // Start first stage
        self.execute_stage(task_id, StageType::Specification).await?;
        Ok(())
    }
    
    async fn execute_stage(&self, task_id: Uuid, stage_type: StageType) -> Result<()> {
        // Allocate container
        let container = self.container_pool.write().await.allocate().await?;
        
        // Create stage record
        let stage = self.create_stage(task_id, stage_type).await?;
        
        // Get previous context
        let context = self.get_stage_context(task_id, stage_type).await?;
        
        // Execute Claude CLI
        let output = self.claude_executor
            .execute(stage_type, &context, container.port)
            .await?;
        
        // Save output and transition
        self.complete_stage(stage.id, output).await?;
        
        // Release container
        self.container_pool.write().await.release(container.id);
        
        // Start next stage or complete
        self.transition_to_next_stage(task_id, stage_type).await?;
        
        Ok(())
    }
}
```

### Step 3: Claude CLI Integration
```rust
// crates/orchestrator/src/claude_executor.rs
use tokio::process::Command;
use std::time::Duration;

pub struct ClaudeExecutor {
    cli_path: String,
    api_key: String,
}

impl ClaudeExecutor {
    pub async fn execute(
        &self,
        stage: StageType,
        context: &str,
        container_port: u16,
    ) -> Result<String> {
        let mut cmd = Command::new(&self.cli_path);
        
        // Set environment
        cmd.env("CLAUDE_API_KEY", &self.api_key)
           .env("BACKEND_URL", format!("http://localhost:{}", container_port));
        
        // Build command based on stage
        match stage {
            StageType::Specification => {
                cmd.arg("/create-spec").arg(context);
            }
            StageType::Implementation => {
                cmd.arg(context);
            }
            StageType::QualityAssurance => {
                cmd.arg("/review").arg(context);
            }
        }
        
        // Execute with timeout
        let output = tokio::time::timeout(
            Duration::from_secs(self.get_timeout(stage)),
            cmd.output()
        ).await??;
        
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }
}
```

### Step 4: Container Pool Management
```rust
// crates/orchestrator/src/container_pool.rs
use bollard::Docker;
use std::collections::{VecDeque, HashMap};

pub struct ContainerPool {
    docker: Docker,
    containers: Vec<Container>,
    available: VecDeque<usize>,
    in_use: HashMap<Uuid, usize>,
}

impl ContainerPool {
    pub async fn new(size: usize, port_range: RangeInclusive<u16>) -> Result<Self> {
        let docker = Docker::connect_with_local_defaults()?;
        let mut containers = Vec::with_capacity(size);
        let mut available = VecDeque::with_capacity(size);
        
        for (i, port) in port_range.enumerate().take(size) {
            let container = Self::start_container(&docker, port).await?;
            containers.push(container);
            available.push_back(i);
        }
        
        Ok(Self {
            docker,
            containers,
            available,
            in_use: HashMap::new(),
        })
    }
    
    pub async fn allocate(&mut self) -> Result<Container> {
        match self.available.pop_front() {
            Some(idx) => {
                let container = self.containers[idx].clone();
                self.in_use.insert(container.id, idx);
                Ok(container)
            }
            None => Err(Error::NoAvailableContainers)
        }
    }
    
    pub fn release(&mut self, container_id: Uuid) {
        if let Some(idx) = self.in_use.remove(&container_id) {
            self.available.push_back(idx);
        }
    }
}
```

### Step 5: API Endpoints
```rust
// crates/server/src/routes/orchestrator.rs
use axum::{Router, Json, extract::{Path, State}};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/orchestrator/start", post(start_orchestration))
        .route("/api/orchestrator/stages/:task_id", get(get_stages))
        .route("/api/orchestrator/stage/:id", get(get_stage))
        .route("/api/orchestrator/stage/:id/retry", post(retry_stage))
}

async fn start_orchestration(
    State(state): State<AppState>,
    Json(req): Json<StartRequest>,
) -> Result<Json<StartResponse>> {
    let orchestrator = &state.orchestrator;
    orchestrator.start_orchestration(req.task_id).await?;
    
    Ok(Json(StartResponse {
        orchestration_id: Uuid::new_v4(),
        current_stage: StageType::Specification,
        status: "running".to_string(),
    }))
}
```

### Step 6: Frontend Integration
```typescript
// frontend/src/components/OrchestratorProgress.tsx
import React, { useEffect, useState } from 'react';
import { useEventSource } from '../hooks/useEventSource';

interface Stage {
  type: 'specification' | 'implementation' | 'qa';
  status: 'pending' | 'running' | 'completed' | 'failed';
  context?: Record<string, any>;
}

export const OrchestratorProgress: React.FC<{ taskId: string }> = ({ taskId }) => {
  const [stages, setStages] = useState<Stage[]>([]);
  const { events } = useEventSource(`/api/events/orchestrator/${taskId}`);
  
  useEffect(() => {
    if (events) {
      events.addEventListener('stage-update', (e) => {
        const data = JSON.parse(e.data);
        setStages(prev => [...prev, data]);
      });
    }
  }, [events]);
  
  return (
    <div className="orchestrator-progress">
      {stages.map((stage, idx) => (
        <StageCard key={idx} stage={stage} />
      ))}
    </div>
  );
};
```

## Configuration
### Docker Compose for Development
```yaml
version: '3.8'
services:
  orchestrator-container-1:
    build: .
    ports:
      - "8081:3000"
    environment:
      - NODE_ENV=development
      
  orchestrator-container-2:
    build: .
    ports:
      - "8082:3000"
    environment:
      - NODE_ENV=development
      
  orchestrator-container-3:
    build: .
    ports:
      - "8083:3000"
    environment:
      - NODE_ENV=development
```

## Deployment Instructions
### Build Process
```bash
# Build orchestrator crate
cargo build --release -p orchestrator

# Run migrations
sqlx migrate run

# Build Docker containers
docker-compose build

# Start container pool
docker-compose up -d
```

### Verification Steps
1. Check container pool is running:
   ```bash
   docker ps | grep orchestrator-container
   ```
2. Test Claude CLI integration:
   ```bash
   claude --version
   ```
3. Verify database tables:
   ```bash
   sqlx query "SELECT * FROM orchestrator_stages LIMIT 1"
   ```

## Monitoring & Logging
### Key Metrics
- Active orchestrations count
- Stage completion rate
- Average stage duration
- Container utilization
- Queue depth

### Log Patterns
```rust
info!("Starting orchestration for task {}", task_id);
warn!("Container allocation failed, queuing task {}", task_id);
error!("Stage {} failed for task {}: {}", stage_type, task_id, error);
debug!("Context passed to stage: {:?}", context);
```

## Rollback Plan
1. Disable orchestrator feature flag:
   ```env
   ORCHESTRATOR_ENABLED=false
   ```
2. Stop container pool:
   ```bash
   docker-compose down
   ```
3. Revert to manual task execution
4. Investigate issues in staging environment

## Troubleshooting Guide
| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Stages stuck in 'running' | Claude CLI timeout | Check logs, increase timeout |
| No available containers | Pool exhausted | Increase pool size or wait |
| Context not passing | Serialization error | Check JSON validity |
| High queue depth | Too many concurrent tasks | Scale container pool |