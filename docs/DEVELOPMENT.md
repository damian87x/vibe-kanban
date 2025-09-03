# Vibe Kanban Development Guide

## Prerequisites

### Required Software

- **Rust** (latest stable) - [Installation Guide](https://rustup.rs/)
- **Node.js** (>=18) - [Download](https://nodejs.org/)
- **pnpm** (>=8) - [Installation Guide](https://pnpm.io/)

### Additional Development Tools

```bash
# Install Rust development tools
cargo install cargo-watch
cargo install sqlx-cli

# Install Node.js development tools (optional)
npm install -g typescript
npm install -g eslint
npm install -g prettier
```

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/BloopAI/vibe-kanban.git
cd vibe-kanban
```

### 2. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the project root (optional):

```bash
# Backend configuration
BACKEND_PORT=8080
FRONTEND_PORT=3000
HOST=127.0.0.1
RUST_LOG=debug

# GitHub OAuth (optional - uses default if not set)
GITHUB_CLIENT_ID=your_client_id_here

# Analytics (optional)
POSTHOG_API_KEY=your_posthog_key_here
POSTHOG_API_ENDPOINT=https://app.posthog.com
```

## Development Workflow

### Running the Development Server

```bash
# Start both frontend and backend with hot reload
pnpm run dev
```

This command will:
- Start the Rust backend server with auto-reload on file changes
- Start the Vite frontend development server
- Automatically assign ports if not specified
- Copy a blank database from `dev_assets_seed/`

### Individual Development Servers

```bash
# Backend only
npm run backend:dev

# Frontend only
npm run frontend:dev
```

### Development Commands

```bash
# Run all checks (frontend + backend)
npm run check

# Frontend specific
cd frontend && npm run lint          # Lint TypeScript/React code
cd frontend && npm run format:check  # Check formatting
cd frontend && npx tsc --noEmit     # TypeScript type checking

# Backend specific
cargo test --workspace               # Run all Rust tests
cargo test -p <crate_name>          # Test specific crate
cargo test test_name                # Run specific test
cargo fmt --all -- --check          # Check Rust formatting
cargo clippy --all --all-targets --all-features -- -D warnings  # Linting

# Type generation (after modifying Rust types)
npm run generate-types               # Regenerate TypeScript types from Rust
npm run generate-types:check        # Verify types are up to date
```

## Project Structure

### Backend Structure

```
crates/
├── server/                 # Main HTTP server
│   ├── src/
│   │   ├── main.rs        # Application entry point
│   │   ├── lib.rs         # Core server implementation
│   │   ├── routes/        # HTTP route handlers
│   │   ├── mcp/           # MCP server implementation
│   │   └── middleware/    # Custom middleware
│   └── Cargo.toml
├── db/                    # Database layer
│   ├── src/
│   │   ├── lib.rs         # Database service
│   │   └── models/        # Database models
│   ├── migrations/        # SQL migrations
│   └── Cargo.toml
├── executors/             # AI agent integrations
│   ├── src/
│   │   ├── executors/     # Individual executor implementations
│   │   ├── logs/          # Log processing
│   │   └── profile.rs     # Profile management
│   └── Cargo.toml
├── services/              # Business logic
│   ├── src/
│   │   └── services/      # Service implementations
│   └── Cargo.toml
├── utils/                 # Shared utilities
│   ├── src/
│   │   ├── assets/        # Asset management
│   │   ├── browser/       # Browser utilities
│   │   ├── diff/          # Diff utilities
│   │   └── sentry/        # Error tracking
│   └── Cargo.toml
└── local-deployment/      # Local deployment logic
    ├── src/
    └── Cargo.toml
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Base UI components (shadcn/ui)
│   │   ├── projects/     # Project-specific components
│   │   ├── tasks/        # Task management components
│   │   └── layout/       # Layout components
│   ├── pages/            # Route-level components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # API client and utilities
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Frontend utilities
├── public/               # Static assets
├── package.json
└── vite.config.ts        # Vite configuration
```

## Database Development

### Migrations

Vibe Kanban uses SQLx migrations for database schema management.

#### Creating a New Migration

```bash
# Create a new migration
sqlx migrate add migration_name

# This creates a file in crates/db/migrations/
# Format: YYYYMMDDHHMMSS_migration_name.sql
```

#### Migration Example

```sql
-- crates/db/migrations/20241201120000_add_user_preferences.sql
CREATE TABLE user_preferences (
    id BLOB PRIMARY KEY,
    user_id BLOB NOT NULL,
    theme TEXT NOT NULL DEFAULT 'system',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

#### Running Migrations

```bash
# Apply all pending migrations
sqlx migrate run

# Create a new database
sqlx database create
```

### Database Models

Database models are defined in `crates/db/src/models/`. Each model should:

1. **Define the struct** with proper SQLx attributes
2. **Implement CRUD operations** as associated functions
3. **Include proper error handling** with custom error types
4. **Use TypeScript generation** with `ts-rs` for frontend types

#### Model Example

```rust
// crates/db/src/models/user.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl User {
    pub async fn find_all(pool: &SqlitePool) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            User,
            r#"SELECT id as "id!: Uuid", name, email, created_at as "created_at!: DateTime<Utc>", updated_at as "updated_at!: DateTime<Utc>" FROM users ORDER BY created_at DESC"#
        )
        .fetch_all(pool)
        .await
    }

    pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as!(
            User,
            r#"SELECT id as "id!: Uuid", name, email, created_at as "created_at!: DateTime<Utc>", updated_at as "updated_at!: DateTime<Utc>" FROM users WHERE id = $1"#,
            id
        )
        .fetch_optional(pool)
        .await
    }
}
```

## API Development

### Adding New Routes

1. **Create route handler** in `crates/server/src/routes/`
2. **Add to router** in `crates/server/src/routes/mod.rs`
3. **Update API documentation** in `docs/API.md`

#### Route Handler Example

```rust
// crates/server/src/routes/users.rs
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json as ResponseJson,
    routing::get,
    Router,
};
use db::models::user::User;
use utils::response::ApiResponse;
use uuid::Uuid;

use crate::{error::ApiError, DeploymentImpl};

pub async fn get_users(
    State(deployment): State<DeploymentImpl>,
) -> Result<ResponseJson<ApiResponse<Vec<User>>>, ApiError> {
    let users = User::find_all(&deployment.db().pool).await?;
    Ok(ResponseJson(ApiResponse::success(users)))
}

pub async fn get_user(
    Path(id): Path<Uuid>,
    State(deployment): State<DeploymentImpl>,
) -> Result<ResponseJson<ApiResponse<User>>, ApiError> {
    let user = User::find_by_id(&deployment.db().pool, id)
        .await?
        .ok_or(ApiError::NotFound("User not found".to_string()))?;
    Ok(ResponseJson(ApiResponse::success(user)))
}

pub fn router(deployment: &DeploymentImpl) -> Router<DeploymentImpl> {
    Router::new()
        .route("/", get(get_users))
        .route("/{id}", get(get_user))
}
```

### Error Handling

Use the centralized error handling system:

```rust
use crate::error::ApiError;

// Convert database errors
let user = User::find_by_id(&pool, id)
    .await
    .map_err(ApiError::from)?;

// Return custom errors
if user.is_none() {
    return Err(ApiError::NotFound("User not found".to_string()));
}
```

## Frontend Development

### Component Development

Components should follow these patterns:

1. **Use TypeScript** for type safety
2. **Follow React best practices** (hooks, functional components)
3. **Use shadcn/ui components** for consistent styling
4. **Implement proper error handling** and loading states

#### Component Example

```typescript
// frontend/src/components/users/UserList.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { usersApi } from '@/lib/api';
import type { User } from 'shared/types';

interface UserListProps {
  onUserSelect?: (user: User) => void;
}

export function UserList({ onUserSelect }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const result = await usersApi.getAll();
        setUsers(result);
      } catch (err) {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <Loader message="Loading users..." size={32} />;
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id} className="cursor-pointer hover:shadow-md">
          <CardHeader>
            <CardTitle>{user.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{user.email}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Custom Hooks

Create reusable hooks for common patterns:

```typescript
// frontend/src/hooks/useUsers.ts
import { useState, useEffect } from 'react';
import { usersApi } from '@/lib/api';
import type { User } from 'shared/types';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await usersApi.getAll();
      setUsers(result);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, refetch: fetchUsers };
}
```

### API Client

The API client is located in `frontend/src/lib/api.ts`:

```typescript
// frontend/src/lib/api.ts
import { apiClient } from './api-client';
import type { User, CreateUser, UpdateUser } from 'shared/types';

export const usersApi = {
  getAll: (): Promise<User[]> => 
    apiClient.get('/users').then(res => res.data),
  
  getById: (id: string): Promise<User> => 
    apiClient.get(`/users/${id}`).then(res => res.data),
  
  create: (data: CreateUser): Promise<User> => 
    apiClient.post('/users', data).then(res => res.data),
  
  update: (id: string, data: UpdateUser): Promise<User> => 
    apiClient.put(`/users/${id}`, data).then(res => res.data),
  
  delete: (id: string): Promise<void> => 
    apiClient.delete(`/users/${id}`),
};
```

## Type Generation

Vibe Kanban uses `ts-rs` to generate TypeScript types from Rust structs.

### Adding Type Generation

1. **Add `ts-rs` derive** to your Rust struct:

```rust
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
}
```

2. **Regenerate types** after changes:

```bash
npm run generate-types
```

3. **Import in TypeScript**:

```typescript
import type { User } from 'shared/types';
```

### Type Generation Best Practices

- **Always use `#[ts(export)]`** for types used in the frontend
- **Run type generation** after any Rust model changes
- **Check types are up to date** with `npm run generate-types:check`
- **Use proper TypeScript types** for dates and UUIDs

## Testing

### Backend Testing

#### Unit Tests

```rust
// In your test module
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_user_creation() {
        let pool = create_test_pool().await;
        let user_data = CreateUser {
            name: "Test User".to_string(),
            email: "test@example.com".to_string(),
        };

        let user = User::create(&pool, &user_data, Uuid::new_v4()).await.unwrap();
        assert_eq!(user.name, "Test User");
        assert_eq!(user.email, "test@example.com");
    }
}
```

#### Integration Tests

```rust
// tests/api_tests.rs
use axum::http::StatusCode;
use axum_test::TestServer;

#[tokio::test]
async fn test_get_users() {
    let app = create_test_app().await;
    let server = TestServer::new(app).unwrap();

    let response = server.get("/api/users").await;
    assert_eq!(response.status_code(), StatusCode::OK);
}
```

### Frontend Testing

#### Component Testing

```typescript
// frontend/src/components/__tests__/UserList.test.tsx
import { render, screen } from '@testing-library/react';
import { UserList } from '../UserList';

describe('UserList', () => {
  it('renders loading state', () => {
    render(<UserList />);
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  it('renders users when loaded', async () => {
    // Mock API response
    jest.spyOn(usersApi, 'getAll').mockResolvedValue([
      { id: '1', name: 'John Doe', email: 'john@example.com' }
    ]);

    render(<UserList />);
    
    await screen.findByText('John Doe');
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

## Debugging

### Backend Debugging

#### Logging

```rust
use tracing::{info, warn, error, debug};

// Use appropriate log levels
info!("User created: {}", user.id);
warn!("Deprecated API endpoint used");
error!("Failed to create user: {}", err);
debug!("Processing request: {:?}", request);
```

#### Environment Variables

```bash
# Enable debug logging
RUST_LOG=debug

# Enable specific crate logging
RUST_LOG=server=debug,db=info

# Enable all logging
RUST_LOG=trace
```

### Frontend Debugging

#### React Developer Tools

Install the React Developer Tools browser extension for component inspection.

#### Console Logging

```typescript
// Use appropriate log levels
console.log('User data:', user);
console.warn('Deprecated component used');
console.error('API error:', error);
```

#### Network Debugging

Use browser DevTools Network tab to inspect API requests and responses.

## Performance Optimization

### Backend Optimization

1. **Database queries** - Use proper indexing and efficient queries
2. **Connection pooling** - SQLx handles this automatically
3. **Async operations** - Use `async/await` throughout
4. **Memory management** - Avoid unnecessary allocations

### Frontend Optimization

1. **React.memo** - Memoize expensive components
2. **useMemo/useCallback** - Memoize expensive calculations
3. **Code splitting** - Use dynamic imports for large components
4. **Virtual scrolling** - For large lists

## Deployment

### Local Build

```bash
# Build the entire application
./local-build.sh

# Test the built package
npm run test:npm
```

### Production Considerations

1. **Environment variables** - Set all required environment variables
2. **Database migrations** - Run migrations before starting the server
3. **Asset optimization** - Frontend assets are embedded in the binary
4. **Error tracking** - Configure Sentry for production error tracking

## Contributing

### Code Style

#### Rust

- Use `cargo fmt` for formatting
- Use `cargo clippy` for linting
- Follow Rust naming conventions
- Add documentation for public APIs

#### TypeScript/React

- Use `prettier` for formatting
- Use `eslint` for linting
- Follow React best practices
- Use TypeScript strict mode

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests** for new functionality
5. **Update documentation** if needed
6. **Run all checks** (`npm run check`)
7. **Submit a pull request**

### Commit Messages

Use conventional commit format:

```
feat: add user management API
fix: resolve database connection issue
docs: update API documentation
test: add unit tests for user model
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check if database file exists
ls -la ~/.local/share/vibe-kanban/db.sqlite

# Reset database
rm ~/.local/share/vibe-kanban/db.sqlite
pnpm run dev
```

#### Port Conflicts

```bash
# Check what's using the port
lsof -i :8080

# Use different ports
BACKEND_PORT=8081 FRONTEND_PORT=3001 pnpm run dev
```

#### Type Generation Issues

```bash
# Clean and regenerate types
rm -rf shared/types.ts
npm run generate-types
```

#### Build Issues

```bash
# Clean build artifacts
cargo clean
rm -rf node_modules
pnpm install
```

### Getting Help

1. **Check the logs** - Look at console output for error messages
2. **Search issues** - Check existing GitHub issues
3. **Create an issue** - Provide detailed information about the problem
4. **Join discussions** - Use GitHub Discussions for questions

This development guide should help you get started with contributing to Vibe Kanban. For more specific information, refer to the individual component documentation and the main README.