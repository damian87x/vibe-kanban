# Technical Design: Orchestrator Manager

## Architecture Overview
### System Context
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Web Client  │────▶│ Vibe Kanban  │────▶│ Orchestrator │
│              │     │    Server    │     │   Manager    │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                      │
                            │                      ▼
                            │              ┌──────────────┐
                            │              │ Claude Code  │
                            │              │     CLI      │
                            │              └──────────────┘
                            ▼
                    ┌──────────────┐
                    │   Database   │
                    │   (SQLite)   │
                    └──────────────┘
```

### Component Design
```rust
pub struct OrchestratorService {
    db_pool: SqlitePool,
    container_pool: ContainerPool,
    claude_executor: ClaudeExecutor,
    max_concurrent: usize, // = 2
}

pub struct ContainerPool {
    containers: Vec<Container>,
    available: VecDeque<usize>,
    in_use: HashMap<Uuid, usize>,
}

pub enum StageType {
    Specification,
    Implementation,
    QualityAssurance,
}

pub struct OrchestratorStage {
    id: Uuid,
    task_id: Uuid,
    stage_type: StageType,
    status: StageStatus,
    context: serde_json::Value,
    started_at: DateTime<Utc>,
    completed_at: Option<DateTime<Utc>>,
}
```

## Data Flow
### Request Flow
1. User initiates task orchestration
2. OrchestratorService creates first stage (Specification)
3. Container allocated from pool
4. Claude CLI executed with /create-spec command
5. Output captured and stored as context
6. Stage marked complete, next stage initiated
7. Process repeats for Implementation and QA
8. Container released back to pool

### Stage Transitions
```
[Specification] ──context──▶ [Implementation] ──context──▶ [QA]
     │                            │                          │
     ├─ /create-spec             ├─ standard mode           ├─ /review
     ├─ 30 min timeout           ├─ 60 min timeout          ├─ 30 min timeout
     └─ spec.md output           └─ code changes            └─ review report
```

## API Design
### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/orchestrator/start | Start orchestration for task |
| GET | /api/orchestrator/stages/:task_id | Get all stages for task |
| GET | /api/orchestrator/stage/:id | Get specific stage details |
| POST | /api/orchestrator/stage/:id/retry | Retry failed stage |
| DELETE | /api/orchestrator/task/:id | Cancel orchestration |

### Request/Response Schemas
```typescript
// Start orchestration
interface StartRequest {
  task_id: string;
  initial_prompt: string;
}

interface StartResponse {
  orchestration_id: string;
  current_stage: StageType;
  status: 'running' | 'queued';
}

// Stage details
interface StageResponse {
  id: string;
  task_id: string;
  stage_type: 'specification' | 'implementation' | 'qa';
  status: 'pending' | 'running' | 'completed' | 'failed';
  context: Record<string, any>;
  output: string;
  started_at: string;
  completed_at?: string;
}
```

## Database Schema
```sql
CREATE TABLE orchestrator_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id),
    stage_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    stage_context JSONB,
    command_output TEXT,
    container_id INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_task_stages (task_id, stage_type),
    INDEX idx_status (status)
);

CREATE TABLE orchestrator_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id),
    priority INTEGER DEFAULT 0,
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE (task_id)
);
```

## Claude CLI Integration
### Command Mapping
```rust
impl ClaudeExecutor {
    fn get_command_for_stage(stage: StageType, context: &str) -> Vec<String> {
        match stage {
            StageType::Specification => vec![
                "claude".to_string(),
                "/create-spec".to_string(),
                context.to_string(),
            ],
            StageType::Implementation => vec![
                "claude".to_string(),
                context.to_string(),
            ],
            StageType::QualityAssurance => vec![
                "claude".to_string(),
                "/review".to_string(),
                context.to_string(),
            ],
        }
    }
}
```

## Security Considerations
- Container isolation prevents cross-task contamination
- Claude API keys stored securely in environment
- Output sanitization before database storage
- Rate limiting on orchestrator endpoints

## Performance Requirements
- Stage transition: < 5 seconds
- Context passing: < 1 second
- Container allocation: < 2 seconds
- Maximum queue wait: 5 minutes

## Technology Stack
- Backend: Rust with Tokio async runtime
- Container: Docker with resource limits
- Queue: In-memory with database persistence
- IPC: Unix pipes for Claude CLI communication