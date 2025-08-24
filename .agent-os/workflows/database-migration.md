# Workflow: Database Migration

## Overview
Complete workflow for making database schema changes in Vibe Kanban using SQLx.

## Prerequisites
- SQLx CLI installed: `cargo install sqlx-cli`
- Database exists: `sqlx database create`

## Steps

### 1. Create Migration Files

```bash
# Create a new migration
sqlx migrate add <description>

# Example
sqlx migrate add add_priority_to_tasks
```

This creates two files:
- `migrations/{timestamp}_{description}.up.sql`
- `migrations/{timestamp}_{description}.down.sql`

### 2. Write Migration SQL

#### Up Migration (apply changes)
```sql
-- migrations/xxx_add_priority_to_tasks.up.sql
ALTER TABLE tasks 
ADD COLUMN priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add default value for existing rows
UPDATE tasks SET priority = 'medium' WHERE priority IS NULL;

-- Make it NOT NULL after setting defaults
ALTER TABLE tasks 
ALTER COLUMN priority SET NOT NULL;

-- Add index for performance
CREATE INDEX idx_tasks_priority ON tasks(priority);
```

#### Down Migration (rollback changes)
```sql
-- migrations/xxx_add_priority_to_tasks.down.sql
DROP INDEX IF EXISTS idx_tasks_priority;
ALTER TABLE tasks DROP COLUMN priority;
```

### 3. Test Migration Locally

```bash
# Apply migration
sqlx migrate run

# Verify changes
sqlite3 vibe-kanban.db ".schema tasks"

# Test rollback
sqlx migrate revert

# Re-apply
sqlx migrate run
```

### 4. Update Rust Models

Update the model in `crates/db/src/models/task.rs`:

```rust
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, TS)]
#[ts(export)]
pub struct Task {
    pub id: Uuid,
    pub project_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: TaskPriority, // New field
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "lowercase")]
pub enum TaskPriority {
    Low,
    Medium,
    High,
    Urgent,
}

// Implement SQLx type mapping
impl sqlx::Type<sqlx::Sqlite> for TaskPriority {
    fn type_info() -> sqlx::sqlite::SqliteTypeInfo {
        <&str as sqlx::Type<sqlx::Sqlite>>::type_info()
    }
}

impl<'r> sqlx::Decode<'r, sqlx::Sqlite> for TaskPriority {
    fn decode(value: sqlx::sqlite::SqliteValueRef<'r>) -> Result<Self, sqlx::error::BoxDynError> {
        let text: &str = <&str as sqlx::Decode<sqlx::Sqlite>>::decode(value)?;
        match text {
            "low" => Ok(TaskPriority::Low),
            "medium" => Ok(TaskPriority::Medium),
            "high" => Ok(TaskPriority::High),
            "urgent" => Ok(TaskPriority::Urgent),
            _ => Err("Invalid priority value".into()),
        }
    }
}
```

### 5. Update Database Queries

Update queries to include new field:

```rust
impl Task {
    pub async fn create(
        pool: &SqlitePool,
        project_id: Uuid,
        title: String,
        priority: TaskPriority,
    ) -> Result<Self> {
        let id = Uuid::new_v4();
        let now = Utc::now().to_rfc3339();
        let priority_str = match priority {
            TaskPriority::Low => "low",
            TaskPriority::Medium => "medium",
            TaskPriority::High => "high",
            TaskPriority::Urgent => "urgent",
        };
        
        let task = sqlx::query_as!(
            Task,
            r#"
            INSERT INTO tasks (id, project_id, title, priority, status, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, 'todo', ?5, ?6)
            RETURNING *
            "#,
            id,
            project_id,
            title,
            priority_str,
            now,
            now
        )
        .fetch_one(pool)
        .await?;
        
        Ok(task)
    }
}
```

### 6. Generate TypeScript Types

```bash
npm run generate-types
```

This updates `shared/types.ts`:

```typescript
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority; // New field
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = "low" | "medium" | "high" | "urgent";
```

### 7. Update API Handlers

Update request/response types:

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTaskRequest {
    pub project_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub priority: Option<TaskPriority>, // Optional with default
}

pub async fn create_task(
    State(deployment): State<Arc<LocalDeployment>>,
    Json(req): Json<CreateTaskRequest>,
) -> Result<Json<Task>, (StatusCode, String)> {
    let priority = req.priority.unwrap_or(TaskPriority::Medium);
    
    let task = deployment
        .db
        .create_task(req.project_id, req.title, priority)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    Ok(Json(task))
}
```

### 8. Update Frontend

Add priority to components:

```typescript
// components/TaskForm.tsx
interface TaskFormData {
  title: string;
  description?: string;
  priority: TaskPriority;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    priority: 'medium',
  });
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        name="title"
        value={formData.title}
        onChange={handleChange}
      />
      
      <Select
        name="priority"
        value={formData.priority}
        onChange={handleChange}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </Select>
      
      <Button type="submit">Create Task</Button>
    </form>
  );
};
```

### 9. Handle Migration in Production

For production deployments:

```rust
// In main.rs or startup code
pub async fn run_migrations(pool: &SqlitePool) -> Result<()> {
    sqlx::migrate!("./migrations")
        .run(pool)
        .await?;
    Ok(())
}

// Call during startup
async fn main() {
    let pool = create_pool().await?;
    run_migrations(&pool).await?;
    // Start server
}
```

### 10. Test Everything

#### Database Tests
```rust
#[tokio::test]
async fn test_task_with_priority() {
    let pool = create_test_pool().await;
    
    let task = Task::create(
        &pool,
        project_id,
        "Test Task".to_string(),
        TaskPriority::High,
    ).await.unwrap();
    
    assert_eq!(task.priority, TaskPriority::High);
}
```

#### API Tests
```bash
# Test creating task with priority
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"projectId": "...", "title": "Urgent Task", "priority": "urgent"}'
```

## Migration Best Practices

### 1. Always Include Rollback
- Every up migration needs a down migration
- Test rollback before committing

### 2. Handle Existing Data
```sql
-- Set defaults for existing rows
UPDATE tasks SET priority = 'medium' WHERE priority IS NULL;
```

### 3. Break Complex Migrations
- Split into multiple smaller migrations
- Easier to debug and rollback

### 4. Add Indexes After Data
```sql
-- First add column and populate
ALTER TABLE tasks ADD COLUMN priority TEXT;
UPDATE tasks SET priority = 'medium';

-- Then add constraints and indexes
ALTER TABLE tasks ALTER COLUMN priority SET NOT NULL;
CREATE INDEX idx_tasks_priority ON tasks(priority);
```

### 5. Version Control
- Commit migration files immediately
- Never modify committed migrations
- Create new migrations for fixes

## Common Issues

### SQLx Compile-time Verification
If SQLx queries fail to compile:

```bash
# Regenerate SQLx metadata
cargo sqlx prepare

# Or run in offline mode
DATABASE_URL=sqlite:vibe-kanban.db cargo build
```

### Migration Conflicts
If migrations conflict in team development:

1. Pull latest changes
2. Revert your migration: `sqlx migrate revert`
3. Delete your migration files
4. Pull and apply team migrations
5. Recreate your migration with new timestamp

### Data Migration
For complex data transformations:

```sql
-- Create temporary table
CREATE TABLE tasks_new AS SELECT * FROM tasks;

-- Add new column with computed value
ALTER TABLE tasks_new ADD COLUMN priority TEXT;
UPDATE tasks_new SET priority = 
  CASE 
    WHEN title LIKE '%URGENT%' THEN 'urgent'
    WHEN title LIKE '%HIGH%' THEN 'high'
    ELSE 'medium'
  END;

-- Swap tables
DROP TABLE tasks;
ALTER TABLE tasks_new RENAME TO tasks;
```

## Verification Checklist

- [ ] Migration files created
- [ ] Up migration tested
- [ ] Down migration tested
- [ ] Rust models updated
- [ ] SQLx queries updated
- [ ] TypeScript types generated
- [ ] API handlers updated
- [ ] Frontend components updated
- [ ] Tests passing
- [ ] Migration runs in CI
- [ ] Documentation updated