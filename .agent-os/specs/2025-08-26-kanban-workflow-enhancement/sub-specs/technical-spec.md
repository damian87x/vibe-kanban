# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-26-kanban-workflow-enhancement/spec.md

> Created: 2025-08-26
> Version: 1.0.0

## Technical Requirements

### Batch Refinement System
- Multi-select UI component for ticket selection in kanban board
- Batch processing endpoint that handles multiple ticket IDs
- Agent context aggregation for related tickets
- Atomic updates to ensure consistency across batch operations
- Rollback mechanism for failed batch refinements
- Progress tracking and status updates via SSE

### Environment Isolation
- Extend WorktreeManager to support multiple active worktrees
- Dynamic port allocation for parallel dev servers (3001, 3002, etc.)
- Environment registry tracking active instances
- Resource cleanup scheduler for orphaned environments
- Environment status monitoring (running, testing, idle)
- Integration with existing git worktree management

### Agent Management
- Agent discovery via Claude Code CLI commands
- Dynamic agent loading based on configuration
- Agent capability registration and discovery
- Inter-agent communication protocol
- Agent state persistence between sessions
- Support for custom agent prompts and instructions

### Workflow Engine
- YAML/JSON-based workflow configuration per project
- State machine for workflow transitions
- Agent-to-stage mapping configuration
- Workflow validation and error handling
- Event-driven stage transitions
- Audit trail for workflow executions

### QA Integration
- Independent QA agent with testing capabilities
- Integration with MCP browser automation tools
- Test result aggregation and reporting
- Automatic issue creation from test failures
- Parallel test execution across environments
- Test coverage tracking and metrics

## Approach Options

### Option A: Monolithic Enhancement
- Pros: Simpler implementation, fewer moving parts, easier debugging
- Cons: Less flexible, harder to scale, tight coupling

### Option B: Microservice Architecture
- Pros: Better separation of concerns, scalable, independent deployment
- Cons: Complex orchestration, overhead for local development

### Option C: Plugin-Based System (Selected)
- Pros: Modular, extensible, maintains simplicity for local dev, easy to test
- Cons: Requires well-defined interfaces, plugin discovery overhead

**Rationale:** Plugin-based approach provides the best balance between flexibility and simplicity for local development while allowing future extensibility.

## System Architecture

### Component Design

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
├─────────────────────────────────────────────────────────┤
│  BatchRefinement │ EnvironmentView │ WorkflowConfig     │
│    Component     │    Component    │    Component       │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   API Layer (Axum)                       │
├─────────────────────────────────────────────────────────┤
│  /api/batch/*    │  /api/envs/*    │  /api/workflow/*   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Service Layer                          │
├──────────────┬──────────────┬──────────────┬───────────┤
│   Batch      │ Environment  │   Workflow   │   Agent   │
│   Service    │   Manager    │    Engine    │  Registry │
└──────────────┴──────────────┴──────────────┴───────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     Database (SQLite)                    │
└─────────────────────────────────────────────────────────┘
```

### Agent Communication Flow

```
User → Task Creation → Planning Agent → Development Agent → QA Agent → Review
         ↓                ↓                  ↓                ↓
    Task Record      Refinement          Implementation    Test Results
```

## Implementation Details

### Batch Refinement API
```rust
// POST /api/batch/refine
pub struct BatchRefineRequest {
    task_ids: Vec<String>,
    refinement_prompt: Option<String>,
    agent_id: Option<String>,
}

// Response includes progress updates via SSE
pub struct BatchRefineProgress {
    total: usize,
    completed: usize,
    current_task: String,
    status: BatchStatus,
}
```

### Environment Registry
```rust
pub struct Environment {
    id: String,
    worktree_path: String,
    branch: String,
    port: u16,
    status: EnvironmentStatus,
    created_at: DateTime<Utc>,
    last_accessed: DateTime<Utc>,
}

pub struct EnvironmentManager {
    environments: HashMap<String, Environment>,
    port_allocator: PortAllocator,
    cleanup_scheduler: CleanupScheduler,
}
```

### Workflow Configuration
```yaml
# .vibe/workflow.yml
name: "Custom Development Workflow"
stages:
  - name: refinement
    agent: claude-planning-agent
    auto_transition: true
  - name: development
    agent: claude-code-agent
    parallel: true
  - name: qa
    agent: qa-specialist-agent
    required: true
  - name: review
    agent: tech-lead-agent
    manual_trigger: true
```

### Agent Interface
```rust
#[async_trait]
pub trait Agent {
    async fn initialize(&mut self, config: AgentConfig) -> Result<()>;
    async fn execute(&self, task: Task, context: AgentContext) -> Result<AgentOutput>;
    asyncផget_capabilities(&self) -> Vec<Capability>;
    async fn handoff(&self, next_agent: &str, context: HandoffContext) -> Result<()>;
}
```

## External Dependencies

- **ts-rs** - Already in use for TypeScript type generation
- **tokio** - Already in use for async runtime
- **serde_yaml** - For workflow configuration parsing
- **Justification:** Minimal and necessary for YAML config support

## Performance Considerations

- Batch operations use database transactions for atomicity
- Environment cleanup runs on background thread
- Agent communication uses async message passing
- SSE for real-time updates without polling
- Lazy loading of agent configurations

## Security Considerations  

- Agent permissions scoped per project
- Environment isolation prevents cross-contamination
- Audit logging for all agent actions
- Sanitization of agent prompts and outputs
- Rate limiting on batch operations

## Migration Strategy

1. Existing single-task workflow remains default
2. Batch refinement opt-in via feature flag
3. Environment isolation gradual rollout
4. Agent system backwards compatible with current executors
5. Data migration for workflow configurations