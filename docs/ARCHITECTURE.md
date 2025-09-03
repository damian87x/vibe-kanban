# Vibe Kanban Architecture Documentation

## Overview

Vibe Kanban is a sophisticated task orchestration platform for AI coding agents. It provides a central control plane for managing, executing, and reviewing tasks performed by Claude Code, Gemini CLI, Codex, Amp, and other AI assistants.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Rust/Axum)   │◄──►│   (SQLite)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web UI        │    │   MCP Server    │    │   Migrations    │
│   Components    │    │   (AI Agents)   │    │   & Models      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

1. **Frontend (React/TypeScript)**
   - Modern React 18 application with TypeScript
   - Tailwind CSS for styling with shadcn/ui components
   - Real-time updates via Server-Sent Events (SSE)
   - Kanban board interface for task management

2. **Backend (Rust/Axum)**
   - High-performance web server using Axum framework
   - Async/await architecture with Tokio runtime
   - RESTful API endpoints for all operations
   - Built-in MCP (Model Context Protocol) server

3. **Database (SQLite)**
   - Lightweight, embedded database
   - SQLx for type-safe database operations
   - Migration-based schema management
   - ACID compliance for data integrity

## Backend Architecture

### Crate Structure

The backend is organized into several focused crates:

```
crates/
├── server/         # Main HTTP server and API routes
├── db/            # Database models and migrations
├── executors/     # AI coding agent integrations
├── services/      # Business logic services
├── utils/         # Shared utilities
├── local-deployment/  # Local deployment logic
└── deployment/    # Deployment abstractions
```

### Server Crate (`crates/server/`)

**Main Components:**
- `main.rs` - Application entry point and server initialization
- `lib.rs` - Core server implementation and deployment logic
- `routes/` - HTTP route handlers organized by domain
- `mcp/` - Model Context Protocol server implementation
- `middleware/` - Custom middleware for authentication and validation

**Key Features:**
- Axum-based HTTP server with async/await
- Comprehensive error handling with custom error types
- Middleware for request validation and authentication
- Real-time event streaming via Server-Sent Events
- Built-in MCP server for AI agent integration

### Database Crate (`crates/db/`)

**Core Models:**
- `Project` - Git repository projects with configuration
- `Task` - Individual tasks with status tracking
- `TaskAttempt` - Execution attempts with worktree management
- `ExecutionProcess` - Process execution tracking
- `TaskTemplate` - Reusable task templates

**Key Features:**
- Type-safe database operations with SQLx
- Comprehensive migration system
- Foreign key relationships with cascade deletes
- Optimized queries with proper indexing

### Executors Crate (`crates/executors/`)

**Supported AI Agents:**
- Claude Code - Anthropic's coding assistant
- Amp - AI coding agent with advanced capabilities
- Gemini - Google's AI coding assistant
- Codex - OpenAI's code generation model
- Opencode - Open-source coding assistant
- Cursor - AI-powered code editor integration

**Key Features:**
- Pluggable executor architecture
- Standardized interface for all AI agents
- Log normalization and parsing
- Session management and follow-up support
- MCP configuration generation

### Services Crate (`crates/services/`)

**Core Services:**
- Git operations and worktree management
- GitHub integration and PR management
- Authentication and user management
- File system operations
- Process execution and monitoring

## Frontend Architecture

### Component Structure

```
frontend/src/
├── components/     # Reusable UI components
│   ├── ui/        # Base UI components (shadcn/ui)
│   ├── projects/  # Project-specific components
│   ├── tasks/     # Task management components
│   └── layout/    # Layout components
├── pages/         # Route-level components
├── hooks/         # Custom React hooks
├── lib/           # API client and utilities
└── types/         # TypeScript type definitions
```

### Key Features

**Real-time Updates:**
- Server-Sent Events for live task status updates
- Optimistic UI updates for better user experience
- Automatic reconnection and error handling

**State Management:**
- React hooks for local state management
- Context providers for global configuration
- Custom hooks for API interactions

**UI/UX:**
- Responsive design with Tailwind CSS
- Drag-and-drop Kanban board interface
- Keyboard shortcuts for power users
- Dark/light theme support

## Data Flow

### Task Execution Flow

1. **Task Creation**
   ```
   User → Frontend → API → Database
   ```

2. **Task Execution**
   ```
   User → Start Task → Create Worktree → Execute AI Agent → Stream Logs → Update Status
   ```

3. **Real-time Updates**
   ```
   Backend Process → SSE Stream → Frontend Hook → UI Update
   ```

### MCP Integration Flow

1. **AI Agent Connection**
   ```
   AI Agent → MCP Client → Vibe Kanban MCP Server → Database
   ```

2. **Tool Execution**
   ```
   AI Agent → MCP Tool Call → Backend Handler → Database Update → Response
   ```

## Key Architectural Patterns

### 1. Event-Driven Architecture

- **Server-Sent Events (SSE)** for real-time communication
- **Event streaming** for process logs and task updates
- **Asynchronous processing** for long-running operations

### 2. Repository Pattern

- **Database models** encapsulate data access logic
- **Service layer** provides business logic abstraction
- **Type-safe queries** with SQLx compile-time checking

### 3. Plugin Architecture

- **Executor system** allows easy addition of new AI agents
- **MCP server** provides standardized AI agent integration
- **Configurable profiles** for different AI agent setups

### 4. Worktree Management

- **Git worktrees** provide isolated execution environments
- **Automatic cleanup** of orphaned worktrees
- **Branch management** for task isolation

## Security Considerations

### Authentication
- GitHub OAuth integration for user authentication
- Device flow for secure token exchange
- Configurable OAuth app support for self-hosting

### Data Protection
- Local SQLite database (no external data transmission)
- Secure token storage and management
- Input validation and sanitization

### Process Isolation
- Git worktrees provide execution isolation
- Process monitoring and termination capabilities
- Resource limits and cleanup mechanisms

## Performance Optimizations

### Backend
- **Async/await** throughout for non-blocking operations
- **Connection pooling** for database operations
- **Efficient queries** with proper indexing
- **Streaming responses** for large data sets

### Frontend
- **Virtual scrolling** for large task lists
- **Optimistic updates** for responsive UI
- **Code splitting** for faster initial loads
- **Memoization** to prevent unnecessary re-renders

### Database
- **Proper indexing** on frequently queried columns
- **Foreign key constraints** for data integrity
- **Migration system** for schema evolution
- **Connection pooling** for concurrent access

## Scalability Considerations

### Current Limitations
- Single-instance deployment (SQLite database)
- Local file system dependencies
- Process-based execution model

### Future Scalability
- **Database migration** to PostgreSQL for multi-instance support
- **Container orchestration** for distributed execution
- **Message queue** for async task processing
- **Load balancing** for high availability

## Development Workflow

### Local Development
1. **Backend-first development** - Start with Rust backend changes
2. **Type generation** - Run `npm run generate-types` after Rust changes
3. **Database migrations** - Create and apply schema changes
4. **Frontend integration** - Update TypeScript types and components

### Testing Strategy
- **Unit tests** in each crate for isolated functionality
- **Integration tests** for API endpoints and database operations
- **Frontend testing** with TypeScript compilation and linting
- **End-to-end testing** for critical user workflows

## Deployment Architecture

### Local Deployment
- **Single binary** with embedded frontend assets
- **SQLite database** for local data storage
- **Automatic browser opening** for user convenience
- **Port auto-assignment** for conflict avoidance

### Production Considerations
- **Environment variables** for configuration
- **Asset embedding** for single-file deployment
- **Error tracking** with Sentry integration
- **Analytics** with PostHog (optional)

## Monitoring and Observability

### Logging
- **Structured logging** with tracing crate
- **Configurable log levels** via environment variables
- **Request/response logging** for debugging
- **Process execution logging** for task monitoring

### Metrics
- **Task execution metrics** for performance monitoring
- **Error tracking** with Sentry integration
- **User analytics** with PostHog (optional)
- **Health checks** for service monitoring

### Error Handling
- **Comprehensive error types** with proper error propagation
- **User-friendly error messages** in the frontend
- **Automatic error reporting** to external services
- **Graceful degradation** for non-critical failures

This architecture provides a solid foundation for a sophisticated AI coding agent orchestration platform while maintaining simplicity and ease of development.