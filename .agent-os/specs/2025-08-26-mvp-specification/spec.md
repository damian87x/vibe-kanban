# Vibe Kanban MVP Specification (Revised)

**Version:** 2.0.0  
**Date:** 2025-01-25  
**Timeline:** 10 weeks  
**Team Size:** 4-5 engineers  
**Success Probability:** 80%

## Executive Summary

This revised specification focuses on delivering a **Minimum Viable Product** that provides immediate value while establishing a solid foundation for future enhancements. We've reduced scope by 60% and chosen proven technologies to ensure successful delivery.

## MVP Scope

### ✅ What We're Building (Phase 1)

1. **Batch Processing System**
   - Sequential and parallel strategies only
   - Dependency resolution
   - Real-time progress updates

2. **Two-Agent System**
   - Development Agent (Claude Code)
   - QA Agent (automated testing)
   - Basic coordination and conflict resolution

3. **Docker-Based Isolation**
   - Container per agent execution
   - Resource limits and monitoring
   - Automatic cleanup

4. **PostgreSQL Database**
   - Concurrent operation support
   - Connection pooling
   - Basic partitioning

5. **Simple Workflow Engine**
   - Linear workflows (Dev → QA)
   - Basic retry logic
   - Status tracking

### ❌ What We're NOT Building (Deferred)

- Browser-based preview environments → Phase 3
- BDD integration → Separate project
- Design prompt system → Separate project
- Additional agents (Doc, Review) → Phase 2
- Custom workflow DSL → Use existing tools
- WebContainers → Docker only

## Technical Architecture (Simplified)

```
┌─────────────────────────────────────────────┐
│            MVP Architecture                  │
├─────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────┐     │
│  │         REST API (Axum)            │     │
│  │    SSE for real-time updates       │     │
│  └────────────────────────────────────┘     │
│                    │                         │
│  ┌────────────────▼────────────────┐        │
│  │     Batch Processing Engine     │        │
│  │   • Sequential execution        │        │
│  │   • Parallel execution          │        │
│  └────────────────────────────────┘        │
│                    │                         │
│  ┌────────────────▼────────────────┐        │
│  │      Agent Coordinator          │        │
│  │   • Dev Agent                   │        │
│  │   • QA Agent                    │        │
│  └────────────────────────────────┘        │
│                    │                         │
│  ┌────────────────▼────────────────┐        │
│  │     Docker Isolation Layer      │        │
│  │   • Container per task          │        │
│  │   • Resource limits             │        │
│  └────────────────────────────────┘        │
│                    │                         │
│  ┌────────────────▼────────────────┐        │
│  │      PostgreSQL Database        │        │
│  │   • Connection pooling          │        │
│  │   • Optimized indexes           │        │
│  └────────────────────────────────┘        │
└─────────────────────────────────────────────┘
```

## Database Schema (Simplified)

```sql
-- Core tables only for MVP
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batches (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    strategy TEXT CHECK (strategy IN ('sequential', 'parallel')),
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batch_tasks (
    id UUID PRIMARY KEY,
    batch_id UUID REFERENCES batches(id),
    description TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    agent_type TEXT CHECK (agent_type IN ('development', 'qa')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE agent_executions (
    id UUID PRIMARY KEY,
    task_id UUID REFERENCES batch_tasks(id),
    agent_type TEXT NOT NULL,
    container_id TEXT,
    status TEXT NOT NULL,
    logs TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_batch_tasks_batch_id ON batch_tasks(batch_id);
CREATE INDEX idx_batch_tasks_status ON batch_tasks(status);
CREATE INDEX idx_agent_executions_task_id ON agent_executions(task_id);
```

## Implementation Plan (10 Weeks)

### Week 1-2: Foundation
- [ ] PostgreSQL setup and migrations
- [ ] Basic REST API structure
- [ ] Docker integration setup
- [ ] CI/CD pipeline

### Week 3-4: Batch Processing
- [ ] Batch creation and management
- [ ] Sequential execution strategy
- [ ] Parallel execution strategy
- [ ] Progress tracking

### Week 5-6: Agent System
- [ ] Development agent integration
- [ ] QA agent implementation
- [ ] Basic coordination logic
- [ ] Conflict detection

### Week 7-8: Docker Isolation
- [ ] Container management
- [ ] Resource limits
- [ ] Log streaming
- [ ] Cleanup mechanisms

### Week 9: Integration & Testing
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Documentation

### Week 10: Production Readiness
- [ ] Security audit
- [ ] Load testing
- [ ] Monitoring setup
- [ ] Deployment preparation

## API Endpoints (MVP)

```yaml
# Batch Operations
POST   /api/batches          # Create batch
GET    /api/batches          # List batches
GET    /api/batches/{id}     # Get batch details
POST   /api/batches/{id}/execute  # Start execution
DELETE /api/batches/{id}     # Cancel batch

# Task Operations  
GET    /api/tasks            # List tasks
GET    /api/tasks/{id}       # Get task details
GET    /api/tasks/{id}/logs  # Stream logs (SSE)

# Agent Operations
GET    /api/agents           # List available agents
GET    /api/agents/{id}/status  # Agent status
```

## Security Implementation

```rust
// Simplified security for MVP
pub struct Security {
    // Basic JWT authentication
    auth: JwtAuth,
    
    // Simple RBAC
    roles: Vec<Role>,
    
    // Container sandboxing
    docker: DockerSandbox,
    
    // Structured logging
    audit: Logger,
}

impl DockerSandbox {
    pub fn create_container(&self, task_id: Uuid) -> Result<Container> {
        let config = ContainerConfig {
            image: "vibe-kanban-agent:latest",
            memory_limit: "2G",
            cpu_shares: 1024,
            network_mode: "bridge",
            read_only_rootfs: true,
            security_opts: vec!["no-new-privileges"],
        };
        
        self.docker.create(config)
    }
}
```

## Resource Management

```yaml
# Docker resource limits per agent
resources:
  limits:
    memory: 2Gi
    cpu: "1"
    ephemeral-storage: 5Gi
  requests:
    memory: 1Gi
    cpu: "0.5"
    ephemeral-storage: 2Gi

# PostgreSQL configuration
postgresql:
  max_connections: 100
  shared_buffers: 256MB
  work_mem: 4MB
  maintenance_work_mem: 64MB
```

## Error Handling

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("Docker error: {0}")]
    Docker(#[from] bollard::errors::Error),
    
    #[error("Agent error: {0}")]
    Agent(String),
    
    #[error("Resource exhausted")]
    ResourceExhausted,
    
    #[error("Task timeout")]
    Timeout,
}

// Consistent error responses
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
            AppError::Docker(_) => (StatusCode::SERVICE_UNAVAILABLE, "Container error"),
            AppError::Agent(msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            AppError::ResourceExhausted => (StatusCode::TOO_MANY_REQUESTS, "Resources exhausted"),
            AppError::Timeout => (StatusCode::REQUEST_TIMEOUT, "Operation timeout"),
        };
        
        (status, Json(json!({ "error": message }))).into_response()
    }
}
```

## Testing Strategy

### Unit Tests (Week 8)
```rust
#[cfg(test)]
mod tests {
    #[tokio::test]
    async fn test_batch_creation() {
        let pool = create_test_pool().await;
        let batch = create_batch(&pool, "test").await.unwrap();
        assert_eq!(batch.status, "pending");
    }
    
    #[tokio::test]
    async fn test_parallel_execution() {
        let executor = ParallelExecutor::new();
        let tasks = vec![task1(), task2()];
        let results = executor.execute(tasks).await;
        assert_eq!(results.len(), 2);
    }
}
```

### Integration Tests (Week 9)
```rust
#[tokio::test]
async fn test_end_to_end_flow() {
    let app = spawn_app().await;
    
    // Create batch
    let batch = app.create_batch(vec!["task1", "task2"]).await;
    
    // Execute
    app.execute_batch(batch.id).await;
    
    // Verify completion
    wait_for_completion(&app, batch.id).await;
    
    assert_eq!(batch.status, "completed");
}
```

## Monitoring & Observability

```rust
// Prometheus metrics
lazy_static! {
    static ref BATCH_DURATION: Histogram = register_histogram!(
        "batch_processing_duration_seconds",
        "Time to process batch"
    ).unwrap();
    
    static ref AGENT_TASKS: Counter = register_counter!(
        "agent_tasks_total",
        "Total tasks processed by agents"
    ).unwrap();
    
    static ref CONTAINER_COUNT: Gauge = register_gauge!(
        "active_containers",
        "Number of active Docker containers"
    ).unwrap();
}

// Structured logging
#[instrument(skip(pool))]
pub async fn execute_batch(
    pool: &PgPool,
    batch_id: Uuid,
) -> Result<(), AppError> {
    info!("Starting batch execution");
    // Implementation
    info!("Batch execution completed");
    Ok(())
}
```

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Batch Processing Speed | 50% faster | Benchmark |
| Concurrent Agents | 2 working | Integration test |
| System Uptime | 95% | Monitoring |
| API Response Time | <200ms p95 | Metrics |
| Test Coverage | 80% | Coverage tool |

## Deployment Configuration

```yaml
# docker-compose.yml for local development
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: vibe_kanban
      POSTGRES_USER: vibe
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    environment:
      DATABASE_URL: postgresql://vibe:secure_password@postgres/vibe_kanban
      RUST_LOG: info
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:8080

volumes:
  postgres_data:
```

## Team Responsibilities

| Role | Responsibilities | Time Allocation |
|------|-----------------|-----------------|
| **Rust Developer** | Backend API, batch processing, agent coordination | 100% |
| **Frontend Developer** | React UI, real-time updates, progress visualization | 100% |
| **DevOps Engineer** | Docker setup, PostgreSQL, CI/CD, monitoring | 100% |
| **QA Engineer** | Test strategy, integration tests, performance testing | 100% |
| **Tech Lead** | Architecture decisions, code reviews, coordination | 50% |

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|-------------------|
| Docker complexity | Use docker-compose for simplicity |
| PostgreSQL performance | Proper indexing and connection pooling |
| Agent coordination | Simple locking mechanism initially |
| Timeline pressure | Weekly demos, adjust scope if needed |
| Security vulnerabilities | Security review in week 9 |

## Future Phases (Post-MVP)

### Phase 2 (8 weeks)
- Additional agents (Documentation, Review)
- Advanced workflows
- Performance optimization
- Enhanced monitoring

### Phase 3 (12 weeks)
- Browser-based preview (if needed)
- BDD integration (separate project)
- Design system (separate project)
- Multi-tenancy

## Conclusion

This MVP specification represents a **pragmatic, achievable** plan that:
- Delivers core value in 10 weeks
- Uses proven technologies
- Minimizes technical risk
- Provides solid foundation for future enhancements
- Has 80% success probability

**Next Steps:**
1. Review and approve MVP specification
2. Assemble team (4-5 engineers)
3. Set up development environment
4. Begin Week 1 tasks

---

**Document Status:** Ready for implementation  
**Approval Required:** Stakeholder sign-off on reduced scope