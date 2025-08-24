# Rust Development Standards for Vibe Kanban

## Core Principles

1. **Type Safety First**: Leverage Rust's type system for correctness
2. **Error Handling**: Explicit error handling with Result types
3. **Async by Default**: Use async/await for all I/O operations
4. **Zero-Cost Abstractions**: Performance without compromise

## Code Style

### Formatting
- Use `cargo fmt` with default settings
- Run before every commit
- CI enforces formatting

### Linting
- Use `cargo clippy` with strict settings
- Address all warnings
- Command: `cargo clippy --all --all-targets --all-features -- -D warnings`

## Error Handling

### Use Result Types
```rust
// Good
pub async fn create_task(title: String) -> Result<Task, TaskError> {
    // implementation
}

// Bad
pub async fn create_task(title: String) -> Task {
    // panics on error
}
```

### Error Types
- Define custom error types with `thiserror`
- Provide context with error variants
- Use `anyhow` for application-level errors

```rust
#[derive(Debug, thiserror::Error)]
pub enum TaskError {
    #[error("Task not found: {id}")]
    NotFound { id: Uuid },
    
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Invalid status transition: {from} to {to}")]
    InvalidTransition { from: String, to: String },
}
```

## Async Patterns

### Always Use Async for I/O
```rust
// Good
pub async fn fetch_tasks() -> Result<Vec<Task>> {
    let tasks = sqlx::query_as!(Task, "SELECT * FROM tasks")
        .fetch_all(&pool)
        .await?;
    Ok(tasks)
}
```

### Concurrent Operations
```rust
use futures::future::try_join_all;

// Execute multiple async operations concurrently
let results = try_join_all(vec![
    fetch_task(id1),
    fetch_task(id2),
    fetch_task(id3),
]).await?;
```

## Database Patterns

### Use SQLx Query Macros
```rust
// Good - compile-time SQL verification
let task = sqlx::query_as!(
    Task,
    "SELECT * FROM tasks WHERE id = ?",
    task_id
)
.fetch_one(&pool)
.await?;

// Avoid raw queries unless necessary
```

### Prepared Statements
- Use parameterized queries
- Never concatenate SQL strings
- Leverage SQLx's compile-time checking

## Service Architecture

### Dependency Injection Pattern
```rust
pub struct TaskService {
    db: Arc<DBService>,
    events: Arc<EventService>,
    config: Arc<RwLock<Config>>,
}

impl TaskService {
    pub fn new(
        db: Arc<DBService>,
        events: Arc<EventService>,
        config: Arc<RwLock<Config>>,
    ) -> Self {
        Self { db, events, config }
    }
}
```

### Shared State
- Use `Arc<RwLock<T>>` for shared mutable state
- Prefer `Arc<T>` for immutable shared data
- Minimize lock scope

## Testing Standards

### Unit Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_task() {
        // Arrange
        let service = create_test_service();
        
        // Act
        let result = service.create_task("Test").await;
        
        // Assert
        assert!(result.is_ok());
    }
}
```

### Integration Tests
- Place in `tests/` directory
- Test complete workflows
- Use test fixtures and builders

## Type Generation

### Use ts-rs for TypeScript Types
```rust
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Task {
    pub id: Uuid,
    pub title: String,
    pub status: TaskStatus,
}
```

After changes:
```bash
npm run generate-types
```

## Performance Guidelines

### Avoid Unnecessary Allocations
```rust
// Good - borrowed string
pub fn process_title(title: &str) -> String {
    title.trim().to_lowercase()
}

// Bad - unnecessary String
pub fn process_title(title: String) -> String {
    title.trim().to_lowercase()
}
```

### Use Iterators
```rust
// Good - lazy evaluation
let results: Vec<_> = tasks
    .iter()
    .filter(|t| t.status == TaskStatus::Todo)
    .map(|t| t.id)
    .collect();
```

## Logging and Tracing

### Use tracing crate
```rust
use tracing::{info, warn, error, debug};

#[tracing::instrument(skip(db))]
pub async fn create_task(
    db: &DBService,
    title: String
) -> Result<Task> {
    info!("Creating task: {}", title);
    
    let task = db.create_task(title).await
        .map_err(|e| {
            error!("Failed to create task: {}", e);
            e
        })?;
    
    debug!("Task created: {:?}", task);
    Ok(task)
}
```

## Module Organization

### File Structure
```
src/
├── lib.rs          # Public API
├── models/         # Data structures
│   ├── mod.rs
│   └── task.rs
├── services/       # Business logic
│   ├── mod.rs
│   └── task_service.rs
└── errors.rs       # Error types
```

### Visibility
- Minimize public API surface
- Use `pub(crate)` for internal APIs
- Document all public items

## Documentation

### Rustdoc Comments
```rust
/// Creates a new task with the given title.
///
/// # Arguments
/// * `title` - The task title
///
/// # Returns
/// The created task or an error
///
/// # Example
/// ```
/// let task = create_task("Review PR").await?;
/// ```
pub async fn create_task(title: String) -> Result<Task> {
    // implementation
}
```

## Common Patterns

### Builder Pattern
```rust
pub struct TaskBuilder {
    title: String,
    description: Option<String>,
    project_id: Uuid,
}

impl TaskBuilder {
    pub fn new(title: String, project_id: Uuid) -> Self {
        Self {
            title,
            description: None,
            project_id,
        }
    }
    
    pub fn description(mut self, desc: String) -> Self {
        self.description = Some(desc);
        self
    }
    
    pub fn build(self) -> Task {
        // construction logic
    }
}
```

### From/Into Traits
```rust
impl From<TaskRow> for Task {
    fn from(row: TaskRow) -> Self {
        Task {
            id: row.id,
            title: row.title,
            // mapping
        }
    }
}
```

## Security Best Practices

1. **Never log sensitive data** (tokens, passwords)
2. **Validate all inputs** before processing
3. **Use prepared statements** for database queries
4. **Sanitize paths** to prevent traversal attacks
5. **Set appropriate timeouts** on operations