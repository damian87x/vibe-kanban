# Common Development Tasks

## Quick Reference
This document provides copy-paste ready solutions for common development tasks in Vibe Kanban.

## 1. Adding a New API Endpoint

### Backend (Rust)
```rust
// In crates/server/src/api/your_module.rs
pub async fn your_handler(
    State(deployment): State<Arc<LocalDeployment>>,
    Json(req): Json<YourRequest>,
) -> Result<Json<YourResponse>, (StatusCode, String)> {
    // Implementation
    deployment.db.your_method(req)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

// Register in crates/server/src/api/mod.rs
.route("/api/your-endpoint", post(your_module::your_handler))
```

### Frontend (TypeScript)
```typescript
// In frontend/src/lib/api.ts
async yourMethod(data: YourRequest): Promise<YourResponse> {
    return this.request<YourResponse>('/your-endpoint', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}
```

## 2. Creating a Database Migration

```bash
# Create migration files
sqlx migrate add your_migration_name

# Edit the generated files in crates/db/migrations/
# Then apply:
sqlx migrate run
```

## 3. Adding a New Executor

### Step 1: Create Executor
```rust
// crates/executors/src/your_executor.rs
pub struct YourExecutor {
    command: String,
}

#[async_trait]
impl StandardCodingAgentExecutor for YourExecutor {
    async fn spawn(&self, current_dir: &PathBuf, prompt: &str) -> Result<AsyncGroupChild> {
        // Implementation
    }
}
```

### Step 2: Add to Factory
```rust
// crates/executors/src/factory.rs
"YOUR_EXECUTOR" => Box::new(YourExecutor::new()),
```

### Step 3: Update Frontend
```typescript
// frontend/src/components/ExecutorSelector.tsx
{ value: 'YOUR_EXECUTOR', label: 'Your Executor' },
```

## 4. Working with Event Streams

### Backend - Publishing Events
```rust
deployment.events
    .publish_log(process_id, LogEntry::new("Message"))
    .await;
```

### Frontend - Consuming Events
```typescript
const { messages } = useEventSourceManager(
    `/api/events/processes/${processId}/logs`
);
```

## 5. Adding a React Component

```typescript
// frontend/src/components/YourComponent.tsx
import React from 'react';

interface YourComponentProps {
    data: YourType;
    onAction: (id: string) => void;
}

export const YourComponent: React.FC<YourComponentProps> = ({ data, onAction }) => {
    return (
        <div className="p-4 rounded-lg border">
            {/* Component content */}
        </div>
    );
};
```

## 6. Type Generation After Rust Changes

```bash
# After modifying Rust types with #[derive(TS)]
npm run generate-types

# Verify types are correct
npm run generate-types:check
```

## 7. Running Tests

```bash
# Backend tests
cargo test --workspace
cargo test -p specific_crate
cargo test specific_test_name

# Frontend checks
cd frontend && npm run lint
cd frontend && npx tsc --noEmit
cd frontend && npm run format:check

# All checks
npm run check
```

## 8. Debugging SSE Connections

### Frontend Debug
```typescript
eventSource.addEventListener('open', () => console.log('Connected'));
eventSource.addEventListener('error', (e) => console.error('Error:', e));
eventSource.addEventListener('message', (e) => console.log('Data:', e.data));
```

### Backend Debug
```rust
tracing::debug!("Publishing event to {} subscribers", count);
```

## 9. Working with Git Worktrees

```rust
// Create worktree
let worktree = deployment.worktree_manager
    .create_worktree(task_id, base_branch)
    .await?;

// Clean up
deployment.worktree_manager
    .cleanup_worktree(task_id)
    .await?;
```

## 10. Database Query Patterns

### Using SQLx Query Macros
```rust
let result = sqlx::query_as!(
    Task,
    "SELECT * FROM tasks WHERE project_id = ? AND status = ?",
    project_id,
    status
)
.fetch_all(&pool)
.await?;
```

### Transaction Pattern
```rust
let mut tx = pool.begin().await?;

sqlx::query!("INSERT INTO tasks ...")
    .execute(&mut tx)
    .await?;

sqlx::query!("UPDATE projects ...")
    .execute(&mut tx)
    .await?;

tx.commit().await?;
```

## 11. Error Handling Patterns

### Rust
```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum TaskError {
    #[error("Task not found: {0}")]
    NotFound(Uuid),
    
    #[error("Database error")]
    Database(#[from] sqlx::Error),
}
```

### TypeScript
```typescript
try {
    const result = await api.createTask(data);
} catch (error) {
    if (error instanceof ApiError && error.status === 404) {
        // Handle not found
    }
    console.error('Error:', error);
}
```

## 12. Common Git Commands for Development

```bash
# Create feature branch
git checkout -b vibe-kanban/feature-name

# Stage and commit
git add -A
git commit -m "feat: description"

# Push and create PR
git push -u origin vibe-kanban/feature-name
gh pr create --title "Feature: Description" --body "Details..."
```

## 13. Local Development Setup

```bash
# Fresh start
rm -rf node_modules target
pnpm install
pnpm run dev

# Reset database
rm vibe-kanban.db
sqlx database create
sqlx migrate run
```

## 14. Performance Profiling

```bash
# CPU profiling (Rust)
cargo build --release
perf record --call-graph=dwarf ./target/release/vibe-kanban
perf report

# Memory profiling
valgrind --leak-check=full ./target/release/vibe-kanban
```

## 15. Updating Dependencies

```bash
# Rust dependencies
cargo update
cargo outdated

# Node dependencies
pnpm update
pnpm outdated
```

## Quick Debugging Tips

1. **Port already in use**: Kill process using the port
   ```bash
   lsof -i :3000
   kill -9 <PID>
   ```

2. **Database locked**: Close other connections
   ```bash
   fuser vibe-kanban.db
   ```

3. **Type generation fails**: Clean and rebuild
   ```bash
   cargo clean
   cargo build
   npm run generate-types
   ```

4. **SSE not connecting**: Check CORS and proxy settings in `vite.config.ts`

5. **Executor not found**: Verify it's added to factory and profile config