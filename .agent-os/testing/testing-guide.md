# Testing Guide for Vibe Kanban

## Overview
Comprehensive testing strategy covering backend (Rust), frontend (TypeScript/React), and integration testing.

## Backend Testing (Rust)

### Running Tests

```bash
# Run all tests
cargo test --workspace

# Run tests for specific crate
cargo test -p db
cargo test -p server
cargo test -p executors

# Run specific test
cargo test test_create_task

# Run tests with output
cargo test -- --nocapture

# Run tests in parallel
cargo test -- --test-threads=4
```

### Unit Test Structure

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tokio;
    
    #[tokio::test]
    async fn test_create_task() {
        // Arrange
        let pool = create_test_pool().await;
        let project_id = create_test_project(&pool).await;
        
        // Act
        let task = Task::create(
            &pool,
            project_id,
            "Test Task".to_string()
        ).await;
        
        // Assert
        assert!(task.is_ok());
        let task = task.unwrap();
        assert_eq!(task.title, "Test Task");
        assert_eq!(task.status, TaskStatus::Todo);
    }
}
```

### Integration Test Structure

Create in `tests/` directory:

```rust
// tests/api_integration.rs
use vibe_kanban::test_helpers::*;

#[tokio::test]
async fn test_task_workflow() {
    // Setup
    let app = spawn_test_app().await;
    let client = app.client();
    
    // Create project
    let project = client
        .post("/api/projects")
        .json(&json!({
            "name": "Test Project",
            "gitRepoPath": "/tmp/test-repo"
        }))
        .send()
        .await
        .expect("Failed to create project");
    
    assert_eq!(project.status(), 200);
    
    // Create task
    let task = client
        .post("/api/tasks")
        .json(&json!({
            "projectId": project.json::<Project>().await.id,
            "title": "Test Task"
        }))
        .send()
        .await
        .expect("Failed to create task");
    
    assert_eq!(task.status(), 200);
}
```

### Test Helpers

```rust
// test_helpers.rs
pub async fn create_test_pool() -> SqlitePool {
    let pool = SqlitePoolOptions::new()
        .connect("sqlite::memory:")
        .await
        .expect("Failed to create test pool");
    
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");
    
    pool
}

pub async fn create_test_deployment() -> Arc<LocalDeployment> {
    let pool = create_test_pool().await;
    let config = Arc::new(RwLock::new(Config::default()));
    
    Arc::new(LocalDeployment {
        db: DBService::new(pool),
        config,
        // ... other services
    })
}
```

### Mocking External Services

```rust
// Mock GitHub service
pub struct MockGitHubService;

impl GitHubService for MockGitHubService {
    async fn create_pr(&self, _: CreatePRRequest) -> Result<PR> {
        Ok(PR {
            number: 42,
            title: "Mock PR".to_string(),
            url: "https://github.com/mock/pr".to_string(),
        })
    }
}

// Use in tests
#[tokio::test]
async fn test_with_mock_github() {
    let deployment = create_test_deployment().await;
    deployment.github = Arc::new(MockGitHubService);
    
    // Test PR creation
}
```

## Frontend Testing (TypeScript/React)

### Type Checking

```bash
# Check TypeScript types
cd frontend && npx tsc --noEmit

# Watch mode
cd frontend && npx tsc --noEmit --watch
```

### Linting

```bash
# Run ESLint
cd frontend && npm run lint

# Fix auto-fixable issues
cd frontend && npm run lint:fix
```

### Format Checking

```bash
# Check formatting
cd frontend && npm run format:check

# Fix formatting
cd frontend && npm run format
```

### Component Testing Pattern

```typescript
// __tests__/TaskCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskCard } from '../components/TaskCard';
import { Task } from '@/lib/types';

describe('TaskCard', () => {
  const mockTask: Task = {
    id: '123',
    title: 'Test Task',
    status: 'todo',
    createdAt: '2024-01-01T00:00:00Z',
  };
  
  it('renders task title', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
  
  it('handles status change', async () => {
    const onStatusChange = jest.fn();
    render(
      <TaskCard 
        task={mockTask} 
        onStatusChange={onStatusChange}
      />
    );
    
    const statusButton = screen.getByRole('button', { name: /status/i });
    fireEvent.click(statusButton);
    
    const inProgressOption = screen.getByText('In Progress');
    fireEvent.click(inProgressOption);
    
    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith('inprogress');
    });
  });
});
```

### Hook Testing

```typescript
// __tests__/useTaskStream.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useTaskStream } from '../hooks/useTaskStream';

describe('useTaskStream', () => {
  it('connects to event stream', async () => {
    const { result } = renderHook(() => useTaskStream('task-123'));
    
    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });
  });
  
  it('receives and processes messages', async () => {
    const { result } = renderHook(() => useTaskStream('task-123'));
    
    // Simulate SSE message
    const event = new MessageEvent('message', {
      data: JSON.stringify({ type: 'update', task: { id: '123' } })
    });
    
    // Trigger event
    result.current.eventSource?.dispatchEvent(event);
    
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });
  });
});
```

## Integration Testing

### Full Stack Test

```bash
# Start test environment
./test-env.sh

# Run integration tests
npm run test:integration
```

### E2E Test Example

```typescript
// e2e/task-workflow.test.ts
import { test, expect } from '@playwright/test';

test('complete task workflow', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3000');
  
  // Create project
  await page.click('text=New Project');
  await page.fill('input[name="name"]', 'Test Project');
  await page.fill('input[name="gitRepoPath"]', '/tmp/test-repo');
  await page.click('text=Create');
  
  // Verify project created
  await expect(page.locator('text=Test Project')).toBeVisible();
  
  // Create task
  await page.click('text=Test Project');
  await page.click('text=New Task');
  await page.fill('input[name="title"]', 'Implement feature');
  await page.click('text=Create Task');
  
  // Start task execution
  await page.click('text=Implement feature');
  await page.click('text=Start');
  await page.selectOption('select[name="executor"]', 'CLAUDE_CODE');
  await page.fill('textarea[name="prompt"]', 'Build a REST API');
  await page.click('text=Execute');
  
  // Wait for execution
  await expect(page.locator('text=Running')).toBeVisible();
  
  // Check logs appear
  await expect(page.locator('.log-entry')).toBeVisible();
});
```

## CI/CD Testing

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      
      - name: Cache cargo
        uses: actions/cache@v3
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            target
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
      
      - name: Run tests
        run: cargo test --workspace
      
      - name: Check formatting
        run: cargo fmt --all -- --check
      
      - name: Run clippy
        run: cargo clippy --all --all-targets --all-features -- -D warnings
  
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Type check
        run: cd frontend && npx tsc --noEmit
      
      - name: Lint
        run: cd frontend && npm run lint
      
      - name: Format check
        run: cd frontend && npm run format:check
```

## Test Database Setup

### SQLite In-Memory
```rust
// Fast, isolated tests
let pool = SqlitePool::connect("sqlite::memory:").await?;
```

### Test Fixtures
```sql
-- fixtures/test_data.sql
INSERT INTO projects (id, name, git_repo_path, created_at, updated_at)
VALUES 
  (X'550e8400e29b41d4a716446655440000', 'Test Project', '/tmp/test', '2024-01-01', '2024-01-01');

INSERT INTO tasks (id, project_id, title, status, created_at, updated_at)
VALUES
  (X'550e8400e29b41d4a716446655440001', X'550e8400e29b41d4a716446655440000', 'Test Task', 'todo', '2024-01-01', '2024-01-01');
```

Load fixtures:
```rust
sqlx::query(include_str!("../fixtures/test_data.sql"))
    .execute(&pool)
    .await?;
```

## Performance Testing

### Load Testing
```bash
# Using artillery
artillery quick --count 100 --num 10 http://localhost:3000/api/tasks
```

### Benchmark Tests
```rust
#[bench]
fn bench_task_creation(b: &mut Bencher) {
    let runtime = tokio::runtime::Runtime::new().unwrap();
    let pool = runtime.block_on(create_test_pool());
    
    b.iter(|| {
        runtime.block_on(async {
            Task::create(&pool, project_id, "Bench Task".to_string()).await
        })
    });
}
```

## Test Coverage

### Generate Coverage Report
```bash
# Install tarpaulin
cargo install cargo-tarpaulin

# Generate coverage
cargo tarpaulin --out Html --output-dir coverage
```

### Coverage Goals
- Unit tests: 80% coverage
- Integration tests: Core workflows
- E2E tests: Critical user paths

## Testing Best Practices

1. **Test Pyramid**
   - Many unit tests (fast, focused)
   - Some integration tests (component interaction)
   - Few E2E tests (critical paths)

2. **Test Isolation**
   - Each test independent
   - Clean state between tests
   - No shared mutable state

3. **Descriptive Names**
   ```rust
   #[test]
   fn create_task_with_empty_title_returns_error() { }
   ```

4. **Arrange-Act-Assert**
   ```rust
   // Arrange
   let input = prepare_input();
   
   // Act
   let result = function_under_test(input);
   
   // Assert
   assert_eq!(result, expected);
   ```

5. **Test Data Builders**
   ```rust
   TaskBuilder::new()
       .with_title("Test")
       .with_status(TaskStatus::InProgress)
       .build()
   ```

## Debugging Tests

### Rust
```bash
# Run single test with output
RUST_LOG=debug cargo test test_name -- --nocapture

# Use debugger
rust-gdb target/debug/test_binary
```

### TypeScript
```typescript
// Add debugger statement
debugger;

// Run with inspector
node --inspect-brk node_modules/.bin/jest
```