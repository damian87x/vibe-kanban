# Vibe Kanban - Comprehensive Technical Documentation

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Core Components](#core-components)
4. [Technology Stack](#technology-stack)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Database Schema](#database-schema)
8. [API Architecture](#api-architecture)
9. [Real-time Features](#real-time-features)
10. [AI Integration](#ai-integration)
11. [MCP Server Implementation](#mcp-server-implementation)
12. [Git Integration](#git-integration)
13. [Authentication & Security](#authentication--security)
14. [Build & Deployment](#build--deployment)
15. [Development Workflow](#development-workflow)
16. [Testing Strategy](#testing-strategy)
17. [Configuration Management](#configuration-management)

## Executive Summary

**Vibe Kanban** is a sophisticated task orchestration platform designed to maximize productivity when working with AI coding agents like Claude Code, Gemini CLI, Codex, Amp, and others. It acts as a central control plane that enables engineers to efficiently manage, execute, and review tasks performed by various AI coding assistants.

### Key Value Propositions
- **Universal AI Agent Integration**: Seamlessly switch between different coding agents without losing context
- **Parallel Task Orchestration**: Execute multiple AI agents concurrently or sequentially
- **Streamlined Review Process**: Quickly review AI-generated code changes with built-in diff visualization
- **Task Status Tracking**: Monitor progress of AI-assisted development in real-time
- **Centralized MCP Configuration**: Manage Model Context Protocol configurations across all agents
- **Git Worktree Isolation**: Each task runs in an isolated git worktree to prevent conflicts

## Architecture Overview

Vibe Kanban follows a modern client-server architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React/TypeScript)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Projects   │  │    Tasks     │  │   Task       │         │
│  │   Management │  │   Kanban     │  │   Details    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP/SSE
┌─────────────────────────────▼───────────────────────────────────┐
│                         Backend (Rust/Axum)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   API        │  │   Event      │  │     MCP      │         │
│  │   Routes     │  │   Streaming  │  │    Server    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────────────────────────────────────────┐          │
│  │              Service Layer                        │          │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│          │
│  │  │Worktree │ │ GitHub  │ │ Events  │ │  Auth  ││          │
│  │  │ Manager │ │ Service │ │ Service │ │Service ││          │
│  │  └─────────┘ └─────────┘ └─────────┘ └────────┘│          │
│  └──────────────────────────────────────────────────┘          │
│  ┌──────────────────────────────────────────────────┐          │
│  │              Executor Layer                       │          │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │          │
│  │  │Claude│ │Gemini│ │ Amp  │ │Codex │ │Cursor│ │          │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    Database (SQLite + SQLx)                      │
└──────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. **Projects**
- Represent git repositories where development work occurs
- Store configuration for setup scripts, dev scripts, and cleanup scripts
- Support file copying patterns for project initialization
- Track the git repository path and current branch

### 2. **Tasks**
- Individual units of work to be completed by AI agents
- Support hierarchical structure with parent tasks
- Track status through lifecycle: todo → inprogress → inreview → done
- Can be created from templates for repetitive workflows

### 3. **Task Attempts**
- Concrete executions of tasks by AI agents
- Each attempt runs in an isolated git worktree
- Track the executor used, branch created, and merge status
- Store conversation history with the AI agent

### 4. **Execution Processes**
- Individual process runs within a task attempt
- Support multiple types: setup scripts, AI agent execution, dev servers
- Stream logs in real-time via Server-Sent Events
- Track exit status and execution duration

### 5. **Profiles & Variants**
- Configurable AI agent profiles with custom commands
- Support variants for specialized behaviors (plan mode, review mode)
- Allow profile-specific MCP configurations
- Enable command customization per profile

## Technology Stack

### Backend
- **Language**: Rust (stable)
- **Web Framework**: Axum 0.8.4
- **Async Runtime**: Tokio 1.0 (full features)
- **Database**: SQLite with SQLx
- **Type Generation**: ts-rs (generates TypeScript types from Rust)
- **Serialization**: Serde 1.0
- **Error Handling**: thiserror, anyhow
- **Logging**: tracing, tracing-subscriber
- **Git Operations**: git2, command-line git

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Routing**: React Router v6
- **State Management**: React hooks and context
- **Real-time Updates**: EventSource API for SSE
- **Code Highlighting**: Syntax highlighting for diffs
- **Analytics**: PostHog (optional)
- **Error Tracking**: Sentry

### Development Tools
- **Package Manager**: pnpm (workspace)
- **File Watching**: cargo-watch
- **Database Migrations**: sqlx-cli
- **Process Management**: concurrently
- **Cross-platform Shell**: Automatic detection (bash/zsh on Unix, PowerShell on Windows)

## Backend Architecture

### Crate Structure

The backend is organized as a Rust workspace with specialized crates:

#### `crates/server/`
- Main HTTP server implementation using Axum
- API route definitions and handlers
- MCP server implementation
- Frontend static file serving
- Middleware for request processing

#### `crates/db/`
- Database models and schema definitions
- SQLx query implementations
- Migration management
- Type-safe database operations

#### `crates/executors/`
- AI agent executor implementations (Claude, Gemini, Amp, etc.)
- Command building and process spawning
- Log normalization and processing
- Conversation tracking and patching
- Profile and variant management

#### `crates/services/`
- Business logic layer
- Git operations and worktree management
- GitHub API integration
- Event streaming service
- Authentication service
- Configuration management
- Analytics and telemetry
- Notification system

#### `crates/utils/`
- Shared utilities across crates
- Path manipulation helpers
- Shell command detection
- Diff generation and processing
- Message store for event streaming
- Port file management for IPC

#### `crates/local-deployment/`
- Local deployment implementation
- Container lifecycle management
- Process orchestration
- Resource cleanup

#### `crates/deployment/`
- Deployment trait definition
- Abstract deployment interface
- Shared deployment logic

### Service Architecture

Services follow a dependency injection pattern:

```rust
pub struct LocalDeployment {
    user_id: String,
    config: Arc<RwLock<Config>>,
    sentry: SentryService,
    db: DBService,
    analytics: Option<AnalyticsService>,
    container: LocalContainerService,
    auth: AuthService,
    git: GitService,
    filesystem: FilesystemService,
    events: EventService,
    msg_stores: Arc<RwLock<HashMap<Uuid, Arc<MsgStore>>>>,
    pr_monitor: Option<PrMonitorService>,
}
```

## Frontend Architecture

### Component Structure

```
frontend/src/
├── components/          # Reusable UI components
│   ├── tasks/          # Task-related components
│   │   ├── TaskCard.tsx
│   │   ├── TaskKanbanBoard.tsx
│   │   ├── TaskDetailsPanel.tsx
│   │   └── TaskFormDialog.tsx
│   ├── projects/       # Project management
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectForm.tsx
│   │   └── ProjectList.tsx
│   ├── logs/           # Log visualization
│   │   ├── LogEntryRow.tsx
│   │   ├── StdoutEntry.tsx
│   │   └── StderrEntry.tsx
│   └── NormalizedConversation/  # AI conversation display
│       ├── DisplayConversationEntry.tsx
│       ├── EditDiffRenderer.tsx
│       └── FileChangeRenderer.tsx
├── hooks/              # Custom React hooks
│   ├── useEventSourceManager.ts  # SSE management
│   ├── useLogStream.ts           # Log streaming
│   ├── useDiffStream.ts          # Diff streaming
│   └── useProcessConversation.ts # Conversation tracking
├── lib/                # Core libraries
│   ├── api.ts          # API client
│   ├── types.ts        # Type definitions
│   └── utils.ts        # Utility functions
└── pages/              # Route components
    ├── projects.tsx
    ├── project-tasks.tsx
    └── task-details.tsx
```

### State Management

The application uses React Context for global state:

1. **ConfigProvider**: Manages user configuration
2. **ThemeProvider**: Handles theme switching
3. **TaskDetailsContext**: Shares task details state

### Real-time Updates

The frontend maintains persistent SSE connections for:
- Process log streaming
- Task diff updates
- Database change notifications
- Execution status updates

## Database Schema

### Core Tables

#### `projects`
```sql
CREATE TABLE projects (
    id            BLOB PRIMARY KEY,
    name          TEXT NOT NULL,
    git_repo_path TEXT NOT NULL UNIQUE,
    setup_script  TEXT,
    dev_script    TEXT,
    cleanup_script TEXT,
    copy_files    TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);
```

#### `tasks`
```sql
CREATE TABLE tasks (
    id                 BLOB PRIMARY KEY,
    project_id         BLOB NOT NULL REFERENCES projects(id),
    title              TEXT NOT NULL,
    description        TEXT,
    status             TEXT CHECK (status IN ('todo','inprogress','inreview','done','cancelled')),
    parent_task_attempt BLOB REFERENCES task_attempts(id),
    created_at         TEXT NOT NULL,
    updated_at         TEXT NOT NULL
);
```

#### `task_attempts`
```sql
CREATE TABLE task_attempts (
    id                    BLOB PRIMARY KEY,
    task_id               BLOB NOT NULL REFERENCES tasks(id),
    container_ref         TEXT NOT NULL,
    branch                TEXT,
    base_branch           TEXT,
    merge_commit          TEXT,
    pr_number             INTEGER,
    pr_merged             BOOLEAN,
    pr_created_at         TEXT,
    executor              TEXT,
    executor_session_id   TEXT,
    executor_action_type  TEXT GENERATED ALWAYS AS (...),
    worktree_deleted      BOOLEAN DEFAULT FALSE,
    created_at            TEXT NOT NULL,
    updated_at            TEXT NOT NULL
);
```

#### `execution_processes`
```sql
CREATE TABLE execution_processes (
    id              BLOB PRIMARY KEY,
    task_attempt_id BLOB NOT NULL REFERENCES task_attempts(id),
    run_reason      TEXT CHECK (run_reason IN (...)),
    executor_action TEXT,
    exit_code       INTEGER,
    status          TEXT CHECK (status IN ('running','completed','failed','killed')),
    started_at      TEXT NOT NULL,
    completed_at    TEXT
);
```

#### `execution_process_logs`
```sql
CREATE TABLE execution_process_logs (
    id                   BLOB PRIMARY KEY,
    execution_process_id BLOB NOT NULL REFERENCES execution_processes(id),
    is_stdout            BOOLEAN NOT NULL,
    content              TEXT NOT NULL,
    created_at           TEXT NOT NULL
);
```

## API Architecture

### REST Endpoints

#### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/tasks` - Get project tasks
- `GET /api/projects/:id/branches` - List git branches

#### Tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/start` - Start task execution

#### Task Attempts
- `GET /api/task-attempts/:id` - Get attempt details
- `POST /api/task-attempts` - Create attempt
- `POST /api/task-attempts/:id/follow-up` - Send follow-up
- `GET /api/task-attempts/:id/diff` - Get code diff
- `POST /api/task-attempts/:id/merge` - Merge changes
- `POST /api/task-attempts/:id/pr` - Create pull request

#### Authentication
- `POST /api/auth/device-flow/start` - Start GitHub device flow
- `POST /api/auth/device-flow/poll` - Poll for auth completion
- `GET /api/auth/check-token` - Validate auth token

#### Configuration
- `GET /api/config` - Get user configuration
- `PUT /api/config` - Update configuration
- `GET /api/config/profiles` - Get AI agent profiles
- `GET /api/config/mcp-servers` - Get MCP configuration

### Server-Sent Events

#### Event Streams
- `/api/events/` - Global event stream
- `/api/events/processes/:id/logs` - Process log stream
- `/api/events/task-attempts/:id/diff` - Diff update stream

Event format:
```typescript
interface EventPatch {
  op: 'add' | 'replace' | 'remove';
  path: string;
  value: any;
}
```

## Real-time Features

### Event Streaming Architecture

1. **Message Store Pattern**
   - Each stream maintains a `MsgStore` for buffering
   - Supports both historical replay and live updates
   - Implements backpressure handling

2. **Database Hooks**
   - SQLite triggers on INSERT/UPDATE/DELETE
   - Captured by EventService
   - Broadcast to connected clients

3. **Log Streaming**
   - Process stdout/stderr captured in real-time
   - Normalized into structured entries
   - Supports ANSI color codes and formatting

4. **Diff Streaming**
   - Git diff generation on file changes
   - Incremental updates via JSON patches
   - Syntax highlighting support

### WebSocket Alternative

The system uses SSE instead of WebSockets for:
- Simpler client implementation
- Automatic reconnection
- HTTP/2 multiplexing support
- Better proxy compatibility

## AI Integration

### Executor System

Each AI agent has a dedicated executor implementing the `StandardCodingAgentExecutor` trait:

```rust
#[async_trait]
pub trait StandardCodingAgentExecutor {
    async fn spawn(
        &self,
        current_dir: &PathBuf,
        prompt: &str,
    ) -> Result<AsyncGroupChild, ExecutorError>;
    
    async fn spawn_follow_up(
        &self,
        current_dir: &PathBuf,
        prompt: &str,
        session_id: &str,
    ) -> Result<AsyncGroupChild, ExecutorError>;
    
    async fn normalize_conversation(...) -> Vec<NormalizedEntry>;
}
```

### Supported AI Agents

1. **Claude Code**
   - Full command customization
   - Plan mode support
   - Session resumption
   - MCP tool integration

2. **Gemini CLI**
   - Google's AI coding assistant
   - Custom prompt templates
   - File context management

3. **Amp**
   - High-performance coding agent
   - Parallel execution support
   - Advanced context handling

4. **Codex**
   - OpenAI-powered assistant
   - Code completion focus
   - API key configuration

5. **Cursor**
   - IDE-integrated AI
   - Direct file editing
   - Context-aware suggestions

6. **OpenCode**
   - Open-source AI assistant
   - Customizable models
   - Local execution option

### Conversation Normalization

AI responses are normalized into structured entries:

```typescript
type NormalizedEntry = 
  | { type: 'TEXT', content: string }
  | { type: 'TOOL_USE', content: ToolUse }
  | { type: 'FILE_CHANGE', content: FileChange }
  | { type: 'TODO', content: TodoItem }
  | { type: 'PROCESS_START', content: ProcessStartPayload };
```

## MCP Server Implementation

### Overview

Vibe Kanban acts as an MCP (Model Context Protocol) server, allowing AI agents to interact with the task management system programmatically.

### Available Tools

```typescript
interface McpTools {
  list_projects(): ProjectSummary[];
  list_tasks(project_id: string): TaskSummary[];
  create_task(project_id: string, title: string): Task;
  update_task(task_id: string, updates: UpdateTask): Task;
  get_task_details(task_id: string): TaskDetails;
  start_task_attempt(task_id: string): TaskAttempt;
}
```

### MCP Configuration

The system supports multiple MCP configuration formats:
- JSON configuration files
- TOML configuration files
- Profile-specific overrides
- Variant-specific configurations

Configuration search paths:
1. Profile-specific path
2. `~/.config/claude-code/mcp.json`
3. `~/Library/Application Support/Claude/mcp.json`
4. `~/.config/gemini/mcp.json`

## Git Integration

### Worktree Management

Each task attempt runs in an isolated git worktree:

1. **Creation Process**
   ```
   main branch → create feature branch → create worktree
   ```

2. **Isolation Benefits**
   - No conflicts between concurrent tasks
   - Clean working directory per task
   - Easy cleanup after completion
   - Parallel execution support

3. **Lifecycle Management**
   - Automatic creation on task start
   - Preservation during execution
   - Optional cleanup after merge
   - Orphan detection and removal

### Branch Management

- Automatic branch naming: `vibe-kanban/<task-id>`
- Support for custom base branches
- Remote tracking setup
- Merge conflict detection

### GitHub Integration

1. **Authentication**
   - OAuth device flow
   - Personal Access Token support
   - Scope: `user:email,repo`

2. **Pull Request Creation**
   - Automatic PR generation
   - Template-based descriptions
   - Review status tracking
   - Auto-merge support

3. **Repository Discovery**
   - List user repositories
   - Search functionality
   - Permission validation

## Authentication & Security

### GitHub OAuth

1. **Device Flow Implementation**
   - No redirect URI needed
   - Works in CLI environments
   - Secure token storage

2. **Token Management**
   - Encrypted storage in config
   - Automatic refresh
   - Revocation support

### Security Features

1. **Process Isolation**
   - Separate process groups
   - Resource limits
   - Automatic cleanup

2. **File System Safety**
   - Path traversal prevention
   - Permission checks
   - Sandboxed operations

3. **Configuration Security**
   - Sensitive data encryption
   - Secure defaults
   - Environment variable support

## Build & Deployment

### Build Process

1. **Development Build**
   ```bash
   pnpm run dev
   ```
   - Starts frontend on port 3000
   - Backend on auto-assigned port
   - Hot reload enabled

2. **Production Build**
   ```bash
   ./local-build.sh
   ```
   - Optimized Rust compilation
   - Frontend bundling with Vite
   - Binary stripping
   - Asset embedding

3. **NPM Package Build**
   ```bash
   npm run build:npx
   npm pack
   ```

### Deployment Options

1. **NPX Distribution**
   - Published to npm registry
   - Single command installation
   - Auto-update support

2. **Binary Distribution**
   - Platform-specific binaries
   - GitHub releases
   - Homebrew formula (macOS)

3. **Docker Container**
   - Multi-stage build
   - Alpine Linux base
   - Volume mounting for data

### Environment Variables

#### Build-time
- `GITHUB_CLIENT_ID` - OAuth app ID
- `POSTHOG_API_KEY` - Analytics key
- `POSTHOG_API_ENDPOINT` - Analytics endpoint

#### Runtime
- `BACKEND_PORT` - Server port
- `FRONTEND_PORT` - Dev server port
- `HOST` - Bind address
- `DISABLE_WORKTREE_ORPHAN_CLEANUP` - Debug flag

## Development Workflow

### Setup

1. **Prerequisites**
   ```bash
   # Install Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # Install Node.js 18+
   # Install pnpm
   npm install -g pnpm
   
   # Install development tools
   cargo install cargo-watch
   cargo install sqlx-cli
   ```

2. **Clone and Install**
   ```bash
   git clone https://github.com/BloopAI/vibe-kanban.git
   cd vibe-kanban
   pnpm install
   ```

3. **Run Development Server**
   ```bash
   pnpm run dev
   ```

### Code Guidelines

1. **Type Safety**
   - Generate TypeScript types after Rust changes
   - Use strict TypeScript configuration
   - Validate at compile time

2. **Error Handling**
   - Use Result types in Rust
   - Implement proper error boundaries in React
   - Log errors with context

3. **Performance**
   - Lazy load React components
   - Use virtual scrolling for lists
   - Implement request debouncing

### Database Migrations

1. **Create Migration**
   ```bash
   sqlx migrate add <description>
   ```

2. **Apply Migration**
   ```bash
   sqlx migrate run
   ```

3. **Migration Guidelines**
   - Always include rollback logic
   - Test with existing data
   - Version control migrations

## Testing Strategy

### Backend Testing

1. **Unit Tests**
   ```bash
   cargo test --lib
   ```
   - Test individual functions
   - Mock external dependencies
   - Cover edge cases

2. **Integration Tests**
   ```bash
   cargo test --test '*'
   ```
   - Test API endpoints
   - Database operations
   - Service interactions

### Frontend Testing

1. **Type Checking**
   ```bash
   cd frontend && npx tsc --noEmit
   ```

2. **Linting**
   ```bash
   cd frontend && npm run lint
   ```

3. **Format Checking**
   ```bash
   cd frontend && npm run format:check
   ```

### CI/CD Pipeline

GitHub Actions workflow:
1. Run on push to main and PRs
2. Matrix testing across OS (Linux, macOS, Windows)
3. Parallel frontend and backend checks
4. Automated release on tag

## Configuration Management

### Configuration Structure

```typescript
interface Config {
  // System
  config_version: string;
  workspace_dir: string | null;
  
  // UI
  theme: ThemeMode;
  
  // Profiles
  profile: ProfileVariantLabel;
  
  // Acknowledgments
  disclaimer_acknowledged: boolean;
  onboarding_acknowledged: boolean;
  github_login_acknowledged: boolean;
  telemetry_acknowledged: boolean;
  
  // Features
  notifications: NotificationConfig;
  editor: EditorConfig;
  github: GitHubConfig;
  analytics_enabled: boolean | null;
}
```

### Profile Configuration

Profiles are defined in JSON format:

```json
{
  "profiles": [
    {
      "label": "MyClaudeCode",
      "CLAUDE_CODE": {
        "command": {
          "base": "npx @anthropic-ai/claude-code",
          "params": ["--mcp"]
        },
        "plan": false
      },
      "mcp_config_path": "~/.config/claude-code/mcp.json",
      "variants": []
    }
  ]
}
```

### MCP Server Configuration

```json
{
  "servers": {
    "vibe-kanban": {
      "command": "npx",
      "args": ["vibe-kanban", "mcp"],
      "schema": {}
    }
  }
}
```

## Performance Optimizations

1. **Database**
   - Connection pooling
   - Prepared statements
   - Index optimization
   - Query batching

2. **Frontend**
   - Code splitting
   - Lazy loading
   - Memoization
   - Virtual scrolling

3. **Backend**
   - Async/await throughout
   - Stream processing
   - Resource pooling
   - Caching strategies

4. **Network**
   - HTTP/2 support
   - Compression
   - CDN for assets
   - Request coalescing

## Future Enhancements

1. **Cloud Deployment**
   - Multi-tenant support
   - Distributed execution
   - Cloud storage integration
   - Team collaboration

2. **Advanced AI Features**
   - Multi-agent coordination
   - Learning from feedback
   - Custom model training
   - Context persistence

3. **Enterprise Features**
   - SAML/SSO authentication
   - Audit logging
   - Role-based access control
   - Compliance reporting

4. **Developer Experience**
   - Plugin system
   - Custom executors
   - Workflow automation
   - IDE integrations

## Conclusion

Vibe Kanban represents a sophisticated orchestration platform that bridges the gap between human developers and AI coding assistants. Its architecture emphasizes:

- **Modularity**: Clear separation between components
- **Extensibility**: Easy addition of new AI agents
- **Reliability**: Robust error handling and recovery
- **Performance**: Optimized for real-time operations
- **Security**: Safe execution environment
- **Developer Experience**: Intuitive interface and workflows

The system successfully addresses the challenges of managing multiple AI coding agents while maintaining code quality, version control integrity, and development workflow efficiency.