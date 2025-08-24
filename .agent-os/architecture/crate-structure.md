# Crate Structure and Responsibilities

## Overview
Vibe Kanban uses a Rust workspace with specialized crates for different domains. Each crate has clear responsibilities and dependencies.

## Crate Descriptions

### `crates/server/`
**Purpose**: Main HTTP server and API implementation

**Responsibilities:**
- Axum web server setup and configuration
- API route definitions and handlers
- MCP (Model Context Protocol) server implementation
- Static file serving for frontend
- Request/response middleware
- CORS and security headers

**Key Files:**
- `main.rs` - Server entry point and initialization
- `api/` - REST API route handlers
- `mcp/` - MCP server implementation
- `static_files.rs` - Frontend asset serving

**Dependencies:** services, db, executors, utils

---

### `crates/db/`
**Purpose**: Database layer with SQLx integration

**Responsibilities:**
- Database models and schema definitions
- SQLx query implementations
- Migration management
- Type-safe database operations
- Connection pool management

**Key Files:**
- `models/` - Database model structs
- `migrations/` - SQL migration files
- `lib.rs` - Database service implementation

**Key Models:**
- `Project` - Git repository configurations
- `Task` - Work items for AI agents
- `TaskAttempt` - Execution instances
- `ExecutionProcess` - Process tracking
- `ExecutionProcessLog` - Log entries

**Dependencies:** utils

---

### `crates/executors/`
**Purpose**: AI agent executor implementations

**Responsibilities:**
- Implement StandardCodingAgentExecutor trait
- Command building for each AI agent
- Process spawning and management
- Log normalization and parsing
- Conversation tracking and patching
- Profile and variant management

**Supported Executors:**
- `claude.rs` - Claude Code integration
- `gemini.rs` - Gemini CLI integration
- `amp.rs` - Amp assistant integration
- `codex.rs` - OpenAI Codex integration
- `cursor.rs` - Cursor IDE integration
- `opencode.rs` - Open source alternatives

**Key Patterns:**
- Factory pattern for executor creation
- Strategy pattern for command building
- Observer pattern for log streaming

**Dependencies:** utils, services (for config)

---

### `crates/services/`
**Purpose**: Business logic and service layer

**Responsibilities:**
- Git operations and worktree management
- GitHub API integration
- Event streaming coordination
- Authentication and authorization
- Configuration management
- Analytics and telemetry
- Notification system
- PR monitoring

**Key Services:**
- `WorktreeManager` - Git worktree lifecycle
- `GitHubService` - GitHub API client
- `EventService` - SSE event broadcasting
- `AuthService` - OAuth and token management
- `ConfigService` - User configuration
- `AnalyticsService` - PostHog integration

**Service Patterns:**
- Dependency injection
- Async/await throughout
- Error propagation with Result
- Arc<RwLock<T>> for shared state

**Dependencies:** db, utils

---

### `crates/utils/`
**Purpose**: Shared utilities and helpers

**Responsibilities:**
- Path manipulation and validation
- Shell command detection
- Diff generation and processing
- Message store for event streaming
- Port file management for IPC
- Process group management
- ANSI color code handling

**Key Utilities:**
- `path.rs` - Safe path operations
- `shell.rs` - Cross-platform shell detection
- `diff.rs` - Git diff generation
- `msg_store.rs` - Event message buffering
- `process.rs` - Process lifecycle helpers

**No external crate dependencies** (foundation layer)

---

### `crates/local-deployment/`
**Purpose**: Local deployment orchestration

**Responsibilities:**
- Container lifecycle management
- Process orchestration
- Resource cleanup
- Port allocation
- Health checking

**Key Components:**
- `LocalDeployment` - Main deployment coordinator
- `LocalContainerService` - Process container management
- Implements `Deployment` trait

**Dependencies:** services, db, utils, deployment

---

### `crates/deployment/`
**Purpose**: Abstract deployment interface

**Responsibilities:**
- Define Deployment trait
- Shared deployment logic
- Abstract over local/cloud deployments

**Key Interfaces:**
```rust
#[async_trait]
pub trait Deployment {
    async fn start(&mut self) -> Result<()>;
    async fn stop(&mut self) -> Result<()>;
    async fn health_check(&self) -> Result<bool>;
}
```

**Minimal dependencies** (interface crate)

---

## Dependency Graph

```
┌─────────────────────────────────────────┐
│                 server                   │
└────┬──────────┬──────────┬──────────┬───┘
     │          │          │          │
     ▼          ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────────────┐
│services │ │   db    │ │   executors     │
└────┬────┘ └────┬────┘ └────────┬────────┘
     │          │                │
     └──────────┴────────────────┘
                │
                ▼
           ┌─────────┐
           │  utils  │
           └─────────┘
```

## Adding New Crates

When adding a new crate:

1. **Determine Layer**: Is it a service, utility, or new domain?
2. **Define Interface**: Create trait definitions first
3. **Minimize Dependencies**: Only depend on lower layers
4. **Document Purpose**: Clear README in crate root
5. **Add Tests**: Unit tests in `src/`, integration in `tests/`

## Crate Best Practices

### Separation of Concerns
- Each crate has a single, clear purpose
- No circular dependencies between crates
- Interfaces defined via traits

### Error Handling
- Custom error types per crate
- Use `thiserror` for error derivation
- Propagate errors with `?` operator

### Testing Strategy
- Unit tests next to implementation
- Integration tests in `tests/` directory
- Mock traits for testing

### Documentation
- Document public APIs with rustdoc
- Examples in documentation
- README.md in each crate root