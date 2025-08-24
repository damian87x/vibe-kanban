# Vibe Kanban System Architecture

## Architecture Overview

Vibe Kanban follows a modular, event-driven architecture with clear separation of concerns between frontend, backend, and execution layers.

## Core Architectural Patterns

### 1. Executor Pattern
All AI agents implement the `StandardCodingAgentExecutor` trait:
```rust
#[async_trait]
pub trait StandardCodingAgentExecutor {
    async fn spawn(&self, current_dir: &PathBuf, prompt: &str) -> Result<AsyncGroupChild>;
    async fn spawn_follow_up(&self, current_dir: &PathBuf, prompt: &str, session_id: &str) -> Result<AsyncGroupChild>;
    async fn normalize_conversation(...) -> Vec<NormalizedEntry>;
}
```

**Benefits:**
- Uniform interface across different AI agents
- Easy addition of new executors
- Consistent error handling

### 2. Service Dependency Injection
Services are composed using dependency injection:
```rust
pub struct LocalDeployment {
    config: Arc<RwLock<Config>>,
    db: DBService,
    events: EventService,
    // ... other services
}
```

**Benefits:**
- Testable components
- Clear service boundaries
- Easy mocking for tests

### 3. Event Streaming Architecture
Real-time updates via Server-Sent Events (SSE):
- Process logs stream to frontend
- Task diffs update incrementally
- Database changes broadcast to clients

**Why SSE over WebSockets:**
- Simpler client implementation
- Automatic reconnection
- HTTP/2 multiplexing
- Better proxy compatibility

### 4. Git Worktree Isolation
Each task execution gets an isolated git worktree:
```
main branch → feature branch → worktree
```

**Benefits:**
- No conflicts between concurrent tasks
- Clean working directory per task
- Easy cleanup after completion
- Parallel execution support

## Crate Architecture

### Workspace Structure
```
crates/
├── server/         # HTTP server, API routes, MCP server
├── db/            # Database models, migrations, queries
├── executors/     # AI agent integrations
├── services/      # Business logic layer
├── utils/         # Shared utilities
└── local-deployment/  # Deployment orchestration
```

### Crate Dependencies
```
server → services → db
       → executors → utils
       → local-deployment
```

## Data Flow Architecture

### Task Execution Flow
1. User creates task via frontend
2. Backend creates task in database
3. Task attempt spawned with executor
4. Executor runs in isolated worktree
5. Logs stream to frontend via SSE
6. Changes tracked and diffed
7. User reviews and merges changes

### Event Flow
```
Database Change → Trigger → EventService → SSE → Frontend
Process Output → Normalize → MsgStore → SSE → Frontend
```

## API Architecture

### RESTful Design
- Resource-based URLs (`/api/projects`, `/api/tasks`)
- Standard HTTP methods (GET, POST, PUT, DELETE)
- JSON request/response bodies
- Consistent error responses

### Endpoint Categories
1. **CRUD Operations**: Projects, Tasks, Task Attempts
2. **Actions**: Start task, merge changes, create PR
3. **Streaming**: Event sources for real-time updates
4. **Configuration**: User settings, profiles, MCP config

## Database Architecture

### Schema Design Principles
- UUID primary keys for distributed systems readiness
- Timestamps on all tables for audit trail
- Foreign key constraints for referential integrity
- Generated columns for computed values

### Key Relationships
```
projects (1) → (∞) tasks
tasks (1) → (∞) task_attempts
task_attempts (1) → (∞) execution_processes
execution_processes (1) → (∞) execution_process_logs
```

## Frontend Architecture

### Component Hierarchy
```
App
├── Layout
│   ├── Header
│   └── Navigation
├── Pages
│   ├── Projects
│   ├── Tasks
│   └── TaskDetails
└── Components
    ├── TaskCard
    ├── LogViewer
    └── DiffViewer
```

### State Management Strategy
- Local state for component-specific data
- React Context for cross-component state
- URL state for navigation and deep linking
- Server state via API calls and SSE

## Security Architecture

### Authentication
- GitHub OAuth device flow
- Token-based authentication
- Secure token storage

### Process Isolation
- Separate process groups
- Resource limits
- Automatic cleanup

### File System Safety
- Path traversal prevention
- Permission checks
- Sandboxed operations

## Performance Architecture

### Backend Optimizations
- Connection pooling for database
- Async/await throughout
- Stream processing for large data
- Prepared statements for queries

### Frontend Optimizations
- Code splitting by route
- Lazy loading components
- Virtual scrolling for lists
- Memoization of expensive computations

## Scalability Considerations

### Horizontal Scaling Ready
- Stateless backend design
- Database as single source of truth
- Event streaming for real-time updates

### Future Cloud Architecture
```
Load Balancer
    ↓
API Servers (N instances)
    ↓
Database (Primary + Replicas)
    ↓
Object Storage (logs, diffs)
```

## Error Handling Architecture

### Rust Error Strategy
- Result<T, E> for fallible operations
- Custom error types with thiserror
- Error context with anyhow
- Proper error propagation

### Frontend Error Boundaries
- React error boundaries for component failures
- Global error handler for unhandled promises
- User-friendly error messages
- Retry mechanisms for transient failures