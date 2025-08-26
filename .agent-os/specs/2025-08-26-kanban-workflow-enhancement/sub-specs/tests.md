# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-26-kanban-workflow-enhancement/spec.md

> Created: 2025-08-26
> Version: 1.0.0

## Test Coverage

### Unit Tests

**BatchRefinementService**
- Test batch creation with valid task IDs
- Test batch creation with invalid/missing task IDs  
- Test atomic transaction rollback on failure
- Test progress tracking updates via SSE
- Test concurrent batch operations handling
- Test batch cancellation mid-process

**EnvironmentManager**
- Test environment creation with unique ports
- Test parallel environment initialization
- Test cleanup scheduler for idle environments
- Test port allocation and deallocation
- Test environment status transitions
- Test orphaned environment detection

**WorkflowEngine**
- Test workflow configuration loading from YAML
- Test stage transition logic with auto-transition
- Test parallel stage execution
- Test manual trigger requirements
- Test workflow validation and error handling
- Test workflow state persistence

**AgentRegistry**
- Test agent discovery via CLI commands
- Test agent capability registration
- Test agent loading and initialization
- Test agent version compatibility checks
- Test fallback to default agents
- Test custom agent validation

**PortAllocator**
- Test sequential port allocation
- Test port recycling after environment cleanup
- Test port conflict resolution
- Test maximum port limit handling

### Integration Tests

**Batch Refinement Flow**
- Test end-to-end batch refinement with 10 tickets
- Test partial batch failure recovery
- Test batch refinement with custom agent
- Test concurrent batches for different projects
- Test batch status updates via SSE stream
- Test batch results persistence

**Multi-Environment Testing**
- Test spinning up 3 parallel environments
- Test independent testing in each environment
- Test environment isolation (no cross-contamination)
- Test automatic cleanup after idle timeout
- Test resource limits and throttling

**Agent Orchestration**
- Test complete workflow: planning → development → QA → review
- Test agent handoff with context preservation
- Test parallel agent execution
- Test agent failure and retry logic
- Test custom agent integration
- Test agent execution audit trail

**Workflow Customization**
- Test loading project-specific workflow
- Test workflow validation on configuration change
- Test stage skipping based on conditions
- Test workflow rollback on critical failure

### E2E Tests

**Batch Refinement User Flow**
- User selects 5 unrefined tickets
- Initiates batch refinement
- Monitors progress in real-time
- Reviews refined tickets
- Applies or rejects changes
- Verifies database consistency

**Parallel Environment Workflow**
- Create task requiring environment
- Spawn development environment
- Start QA testing in parallel environment
- Monitor both environments simultaneously
- Clean up after testing completion
- Verify no resource leaks

**Multi-Agent Development Cycle**
- Create new task
- Planning agent refines requirements
- Development agent implements feature
- QA agent runs automated tests
- Review agent provides feedback
- Task moves through workflow stages
- Verify complete audit trail

### Mocking Requirements

**External Services**
- **GitHub API:** Mock PR creation, status updates
- **Claude Code CLI:** Mock agent discovery responses
- **MCP Browser Tools:** Mock for QA testing simulation
- **File System:** Mock for worktree operations in tests

**Time-Based Tests**
- **Environment Idle Timeout:** Mock time progression
- **Cleanup Scheduler:** Mock scheduled job execution
- **Rate Limiting:** Mock time-based request throttling

**Agent Communication**
- **Agent Responses:** Mock LLM responses for deterministic testing
- **Agent Capabilities:** Mock capability discovery
- **Inter-Agent Messages:** Mock message passing between agents

## Test Data

### Fixtures

```rust
// Test fixture for batch refinement
pub fn create_test_batch() -> BatchRefinement {
    BatchRefinement {
        id: "test-batch-001".to_string(),
        project_id: "test-project".to_string(),
        task_ids: vec!["task-1", "task-2", "task-3"],
        status: BatchStatus::Pending,
        // ...
    }
}

// Test fixture for environment
pub fn create_test_environment() -> Environment {
    Environment {
        id: "test-env-001".to_string(),
        worktree_path: "/tmp/test-worktree",
        port: 3001,
        status: EnvironmentStatus::Running,
        // ...
    }
}

// Test fixture for workflow
pub fn create_test_workflow() -> WorkflowConfiguration {
    WorkflowConfiguration {
        id: "test-workflow-001".to_string(),
        stages: vec![
            WorkflowStage { name: "planning", agent_id: Some("claude-planning") },
            WorkflowStage { name: "development", agent_id: Some("claude-code") },
            WorkflowStage { name: "qa", agent_id: Some("qa-specialist") },
        ],
        // ...
    }
}
```

## Performance Tests

### Load Testing
- Batch refinement with 100 tickets
- 10 parallel environments running simultaneously
- 50 concurrent agent executions
- Workflow processing under high load

### Stress Testing
- Maximum batch size limits
- Port exhaustion scenarios
- Agent timeout handling
- Database connection pool limits

## Test Execution Strategy

### CI/CD Pipeline
```yaml
test:
  - cargo test --workspace           # All unit tests
  - cargo test --test integration    # Integration tests
  - npm run test:e2e                # E2E tests with Playwright
  - cargo test --release -- --ignored # Performance tests
```

### Test Categories
- **Fast Tests:** Run on every commit (< 1 second each)
- **Integration Tests:** Run on PR creation (< 10 seconds each)
- **E2E Tests:** Run before merge (< 30 seconds each)
- **Performance Tests:** Run nightly or on-demand

## Test Coverage Requirements

- Unit test coverage: > 80%
- Integration test coverage: > 70%
- Critical paths: 100% coverage
- New code: 90% coverage minimum

## Test Documentation

Each test should include:
1. Clear test name describing what is being tested
2. Given-When-Then structure for complex scenarios
3. Assertion messages explaining expected behavior
4. Cleanup verification for resource management tests