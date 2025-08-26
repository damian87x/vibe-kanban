# Orchestrator Manager Mini MVP Specification

**Version:** 1.0.0  
**Date:** 2025-01-25  
**Timeline:** 2 weeks  
**Scope:** Minimal viable orchestrator for Claude Code CLI

## Problem Statement

Currently, Vibe Kanban executes tasks with a single Claude Code CLI command without proper stages or context passing. AI agents often produce incomplete work because they lack proper specifications and don't test their output. We need an orchestrator that manages task progression through specification, implementation, and QA stages.

## Solution Overview

Build a lightweight **Orchestrator Manager** that sits above Claude Code CLI and:
- Reads tasks from the queue
- Determines which Claude command to run based on task stage
- Passes context between stages
- Manages container allocation
- Handles stage transitions

## Core Requirements

### Functional Requirements

1. **Task Queue Processing**
   - Monitor tasks in "todo" status
   - Limit: 2 concurrent task executions
   - Auto-start next task when one completes

2. **Three-Stage Workflow**
   - **Stage 1: Specification** - Run `/create-spec` command
   - **Stage 2: Implementation** - Standard Claude execution with spec context
   - **Stage 3: Review/QA** - Run review and test commands

3. **Context Management**
   - Store output from each stage
   - Pass previous stage output as context to next stage
   - Maintain context in task database

4. **Container Allocation**
   - 3 Docker containers (ports 8081-8083)
   - Assign container to task for entire workflow
   - Release container when task completes

### Non-Functional Requirements

- Use existing Claude Code CLI (no modifications)
- Minimal database changes
- Complete in 2 weeks
- Single Rust service

## Technical Design

### System Architecture

```
Tasks Table (PostgreSQL/SQLite)
           │
           ▼
┌─────────────────────┐
│  Orchestrator Loop  │ ← Polls every 30 seconds
└─────────────────────┘
           │
    Reads task stage
           │
           ▼
┌─────────────────────┐
│  Command Builder    │ ← Determines Claude command
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Container Pool     │ ← Allocates container (1 of 3)
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Claude Code CLI    │ ← Executes in container
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Context Storage    │ ← Saves output for next stage
└─────────────────────┘
```

### Data Model

```sql
-- Minimal changes to existing schema
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS 
    orchestrator_stage TEXT DEFAULT 'pending'
    CHECK (orchestrator_stage IN ('pending', 'specification', 'implementation', 'review_qa', 'completed'));

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS 
    orchestrator_context JSONB DEFAULT '{}';

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS 
    container_id INTEGER CHECK (container_id IN (1, 2, 3));

-- New table for stage outputs
CREATE TABLE IF NOT EXISTS orchestrator_stage_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id),
    stage TEXT NOT NULL,
    command_used TEXT,
    output TEXT,
    success BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Core Components

#### 1. Orchestrator Service
```rust
pub struct OrchestratorService {
    db_pool: SqlitePool,
    container_pool: ContainerPool,
    claude_executor: ClaudeExecutor,
    max_concurrent: usize, // = 2
}

impl OrchestratorService {
    pub async fn run_loop(&self) {
        loop {
            // Get next task needing processing
            if let Some(task) = self.get_next_task().await {
                tokio::spawn(self.process_task(task));
            }
            tokio::time::sleep(Duration::from_secs(30)).await;
        }
    }
    
    async fn process_task(&self, task: Task) {
        let stage = task.orchestrator_stage;
        let container = self.container_pool.allocate(task.id).await;
        
        let command = self.build_command(&task, stage);
        let result = self.claude_executor.execute(command, container).await;
        
        self.store_output(&task, stage, result).await;
        self.transition_stage(&task).await;
        
        if task.is_complete() {
            self.container_pool.release(container).await;
        }
    }
}
```

#### 2. Command Builder
```rust
impl OrchestratorService {
    fn build_command(&self, task: &Task, stage: Stage) -> ClaudeCommand {
        match stage {
            Stage::Specification => {
                ClaudeCommand {
                    base: "npx -y @anthropic-ai/claude-code@latest",
                    args: vec!["--command", "/create-spec"],
                    prompt: task.description,
                    context: None,
                }
            },
            Stage::Implementation => {
                let spec = self.get_stage_output(task.id, Stage::Specification);
                ClaudeCommand {
                    base: "npx -y @anthropic-ai/claude-code@latest",
                    prompt: "Implement this specification",
                    context: Some(spec),
                }
            },
            Stage::ReviewQA => {
                let code = self.get_stage_output(task.id, Stage::Implementation);
                ClaudeCommand {
                    base: "npx -y @anthropic-ai/claude-code@latest",
                    args: vec!["--command", "/review", "--with-tests"],
                    prompt: "Review and test this implementation",
                    context: Some(code),
                }
            }
        }
    }
}
```

#### 3. Container Pool
```rust
pub struct ContainerPool {
    containers: Vec<Container>,
    allocated: HashMap<Uuid, usize>,
}

impl ContainerPool {
    pub fn new() -> Self {
        Self {
            containers: vec![
                Container { id: 1, port: 8081, worktree: "/worktrees/task-1" },
                Container { id: 2, port: 8082, worktree: "/worktrees/task-2" },
                Container { id: 3, port: 8083, worktree: "/worktrees/task-3" },
            ],
            allocated: HashMap::new(),
        }
    }
    
    pub async fn allocate(&mut self, task_id: Uuid) -> Container {
        // Find free container or wait
        for container in &self.containers {
            if !self.allocated.values().any(|&id| id == container.id) {
                self.allocated.insert(task_id, container.id);
                return container.clone();
            }
        }
        // If all allocated, wait and retry
        tokio::time::sleep(Duration::from_secs(60)).await;
        self.allocate(task_id).await
    }
}
```

### Stage Transitions

```
pending → specification → implementation → review_qa → completed
                ↓               ↓              ↓
             (failed)       (failed)       (failed)
                ↓               ↓              ↓
             (retry)      implementation   implementation
```

## Implementation Plan

### Week 1: Core Orchestrator

#### Day 1-2: Database & Models
- [ ] Add orchestrator columns to tasks table
- [ ] Create stage_outputs table
- [ ] Update Task model in Rust

#### Day 3-4: Orchestrator Service
- [ ] Create OrchestratorService struct
- [ ] Implement task queue polling
- [ ] Build command construction logic
- [ ] Add stage transition logic

#### Day 5: Container Pool
- [ ] Create ContainerPool struct
- [ ] Implement allocation/release
- [ ] Add Docker container setup

### Week 2: Integration & UI

#### Day 6-7: Claude Executor Integration
- [ ] Wire up Claude Code CLI execution
- [ ] Capture and store outputs
- [ ] Handle errors and retries

#### Day 8-9: API Endpoints
- [ ] GET /api/orchestrator/status
- [ ] GET /api/orchestrator/tasks
- [ ] POST /api/orchestrator/retry/{task_id}

#### Day 10: Basic UI
- [ ] Add Orchestrator tab to UI
- [ ] Show tasks in each stage
- [ ] Display stage outputs
- [ ] Add retry button

## Docker Setup

```yaml
# docker-compose.yml
version: '3.8'
services:
  orchestrator:
    build: .
    environment:
      DATABASE_URL: ${DATABASE_URL}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    
  task-container-1:
    image: vibe-kanban-executor
    ports:
      - "8081:8080"
    volumes:
      - ./worktrees/task-1:/workspace
  
  task-container-2:
    image: vibe-kanban-executor
    ports:
      - "8082:8080"
    volumes:
      - ./worktrees/task-2:/workspace
  
  task-container-3:
    image: vibe-kanban-executor
    ports:
      - "8083:8080"
    volumes:
      - ./worktrees/task-3:/workspace
```

## API Endpoints

```yaml
/api/orchestrator/status:
  get:
    response:
      active_tasks: [
        { task_id, stage, container_id, started_at }
      ]
      queued_tasks: []
      containers: [
        { id, allocated_to, status }
      ]

/api/orchestrator/tasks:
  get:
    response:
      tasks: [
        { id, title, stage, outputs: { specification, implementation, review } }
      ]

/api/orchestrator/retry/{task_id}:
  post:
    description: Retry task from current or previous stage
```

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Task completion rate | >90% | Tasks reaching 'completed' |
| Test coverage | 100% | All tasks have tests in review stage |
| Concurrent execution | 2 tasks | Active containers at any time |
| Stage success rate | >80% | Successful stage transitions |

## Testing Strategy

### Unit Tests
```rust
#[test]
fn test_command_builder() {
    let task = Task { 
        orchestrator_stage: Stage::Specification,
        description: "Build a REST API"
    };
    let command = orchestrator.build_command(&task, Stage::Specification);
    assert!(command.args.contains("--command"));
    assert!(command.args.contains("/create-spec"));
}
```

### Integration Test
```rust
#[tokio::test]
async fn test_full_workflow() {
    let orchestrator = OrchestratorService::new();
    let task = create_test_task();
    
    orchestrator.process_task(task).await;
    
    // Verify all stages completed
    let outputs = get_stage_outputs(task.id);
    assert!(outputs.specification.is_some());
    assert!(outputs.implementation.is_some());
    assert!(outputs.review_qa.is_some());
}
```

## Out of Scope (Not in Mini MVP)

- Complex workflow customization
- Multiple executor types beyond Claude
- Browser-based preview
- Parallel stage execution
- Custom retry strategies
- Workflow visualization beyond basic UI

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Claude CLI failures | Retry logic with exponential backoff |
| Container allocation deadlock | Timeout and force-release after 1 hour |
| Large context between stages | Truncate to last 10KB if needed |
| Database performance | Index on orchestrator_stage column |

## Definition of Done

- [ ] Orchestrator processes tasks through 3 stages
- [ ] Context passes correctly between stages
- [ ] 2 concurrent tasks run successfully
- [ ] UI shows task progression
- [ ] All unit tests pass
- [ ] Integration test demonstrates full workflow
- [ ] Basic documentation written

## Future Enhancements (Post-MVP)

1. **Dynamic command configuration** - UI to modify commands per stage
2. **Parallel stages** - Run review while starting next task
3. **Custom workflows** - Define different stage sequences
4. **More executors** - Add Gemini, OpenCode support
5. **Metrics dashboard** - Success rates, timing, bottlenecks

---

**This Mini MVP focuses on the essential**: An orchestrator that moves tasks through spec → implementation → QA stages using Claude Code CLI with different commands, maintaining context, and managing simple container allocation. Nothing more, nothing less.