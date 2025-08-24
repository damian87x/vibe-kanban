# Workflow: Creating a New API Endpoint

## Overview
Step-by-step guide for adding a new REST API endpoint to Vibe Kanban.

## Steps

### 1. Define the Route Handler

Create or update handler in `crates/server/src/api/`:

```rust
// crates/server/src/api/widgets.rs
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateWidgetRequest {
    pub name: String,
    pub config: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Widget {
    pub id: Uuid,
    pub name: String,
    pub config: serde_json::Value,
    pub created_at: String,
}

pub async fn create_widget(
    State(deployment): State<Arc<LocalDeployment>>,
    Json(req): Json<CreateWidgetRequest>,
) -> Result<Json<Widget>, (StatusCode, String)> {
    // Implementation
    let widget = deployment
        .db
        .create_widget(req.name, req.config)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    
    Ok(Json(widget))
}

pub async fn get_widget(
    State(deployment): State<Arc<LocalDeployment>>,
    Path(widget_id): Path<Uuid>,
) -> Result<Json<Widget>, (StatusCode, String)> {
    // Implementation
}

pub async fn list_widgets(
    State(deployment): State<Arc<LocalDeployment>>,
) -> Result<Json<Vec<Widget>>, (StatusCode, String)> {
    // Implementation
}
```

### 2. Add Database Models

Create model in `crates/db/src/models/`:

```rust
// crates/db/src/models/widget.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Widget {
    pub id: Uuid,
    pub name: String,
    pub config: serde_json::Value,
    pub created_at: String,
    pub updated_at: String,
}

impl Widget {
    pub async fn create(
        pool: &SqlitePool,
        name: String,
        config: serde_json::Value,
    ) -> Result<Self> {
        let id = Uuid::new_v4();
        let now = Utc::now().to_rfc3339();
        
        let widget = sqlx::query_as!(
            Widget,
            r#"
            INSERT INTO widgets (id, name, config, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5)
            RETURNING *
            "#,
            id,
            name,
            config,
            now,
            now
        )
        .fetch_one(pool)
        .await?;
        
        Ok(widget)
    }
    
    pub async fn find_by_id(
        pool: &SqlitePool,
        id: Uuid,
    ) -> Result<Option<Self>> {
        let widget = sqlx::query_as!(
            Widget,
            "SELECT * FROM widgets WHERE id = ?",
            id
        )
        .fetch_optional(pool)
        .await?;
        
        Ok(widget)
    }
}
```

### 3. Create Database Migration

```bash
sqlx migrate add create_widgets_table
```

Edit the migration file:

```sql
-- migrations/xxx_create_widgets_table.sql
CREATE TABLE widgets (
    id BLOB PRIMARY KEY,
    name TEXT NOT NULL,
    config TEXT NOT NULL, -- JSON stored as TEXT
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_widgets_name ON widgets(name);
```

Apply migration:
```bash
sqlx migrate run
```

### 4. Register Routes

Update `crates/server/src/api/mod.rs`:

```rust
use axum::{
    routing::{get, post},
    Router,
};

pub fn api_routes() -> Router<Arc<LocalDeployment>> {
    Router::new()
        // Existing routes...
        .route("/api/widgets", post(widgets::create_widget))
        .route("/api/widgets", get(widgets::list_widgets))
        .route("/api/widgets/:id", get(widgets::get_widget))
}
```

### 5. Generate TypeScript Types

Add ts-rs derives to Rust structs:

```rust
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Widget {
    pub id: String, // Uuid as string for TypeScript
    pub name: String,
    pub config: serde_json::Value,
    pub created_at: String,
}
```

Generate types:
```bash
npm run generate-types
```

### 6. Create Frontend API Client

Update `frontend/src/lib/api.ts`:

```typescript
export interface CreateWidgetRequest {
  name: string;
  config: Record<string, any>;
}

export interface Widget {
  id: string;
  name: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

class ApiClient {
  // Existing methods...
  
  async createWidget(data: CreateWidgetRequest): Promise<Widget> {
    return this.request<Widget>('/widgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async getWidget(id: string): Promise<Widget> {
    return this.request<Widget>(`/widgets/${id}`);
  }
  
  async listWidgets(): Promise<Widget[]> {
    return this.request<Widget[]>('/widgets');
  }
}
```

### 7. Create React Hook

```typescript
// frontend/src/hooks/useWidgets.ts
export const useWidgets = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchWidgets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.listWidgets();
      setWidgets(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const createWidget = useCallback(async (data: CreateWidgetRequest) => {
    const widget = await api.createWidget(data);
    setWidgets(prev => [...prev, widget]);
    return widget;
  }, []);
  
  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);
  
  return { widgets, loading, error, createWidget, refetch: fetchWidgets };
};
```

### 8. Add Frontend Component

```typescript
// frontend/src/components/WidgetList.tsx
export const WidgetList: React.FC = () => {
  const { widgets, loading, error, createWidget } = useWidgets();
  
  if (loading) return <Spinner />;
  if (error) return <ErrorAlert error={error} />;
  
  return (
    <div className="space-y-4">
      {widgets.map(widget => (
        <WidgetCard key={widget.id} widget={widget} />
      ))}
    </div>
  );
};
```

### 9. Test the Endpoint

#### Unit Test
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_create_widget() {
        let deployment = create_test_deployment().await;
        let req = CreateWidgetRequest {
            name: "Test Widget".to_string(),
            config: json!({"key": "value"}),
        };
        
        let result = create_widget(State(deployment), Json(req)).await;
        assert!(result.is_ok());
    }
}
```

#### Manual Testing
```bash
# Create widget
curl -X POST http://localhost:3000/api/widgets \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "config": {}}'

# List widgets
curl http://localhost:3000/api/widgets

# Get specific widget
curl http://localhost:3000/api/widgets/{id}
```

### 10. Update Documentation

Add to API documentation:

```markdown
## Widget Endpoints

### Create Widget
`POST /api/widgets`

Request:
```json
{
  "name": "Widget Name",
  "config": {}
}
```

Response:
```json
{
  "id": "uuid",
  "name": "Widget Name",
  "config": {},
  "createdAt": "2024-01-01T00:00:00Z"
}
```
```

## Verification Checklist

- [ ] Route handler implemented
- [ ] Database model created
- [ ] Migration created and applied
- [ ] Routes registered
- [ ] TypeScript types generated
- [ ] API client methods added
- [ ] React hook created
- [ ] Frontend component working
- [ ] Unit tests passing
- [ ] Manual testing successful
- [ ] Documentation updated
- [ ] Error handling comprehensive

## Common Patterns

### Error Handling
```rust
.map_err(|e| match e {
    sqlx::Error::RowNotFound => (StatusCode::NOT_FOUND, "Widget not found".to_string()),
    _ => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
})?
```

### Validation
```rust
if req.name.is_empty() {
    return Err((StatusCode::BAD_REQUEST, "Name is required".to_string()));
}
```

### Pagination
```rust
pub async fn list_widgets(
    State(deployment): State<Arc<LocalDeployment>>,
    Query(params): Query<PaginationParams>,
) -> Result<Json<PaginatedResponse<Widget>>, (StatusCode, String)> {
    // Implementation with limit/offset
}
```