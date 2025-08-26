# Test Plan: Orchestrator Manager

## Test Strategy
### Scope
- Orchestrator service core logic
- Stage transition mechanisms
- Container pool management
- Claude CLI integration
- API endpoints
- Real-time event streaming

### What Will Not Be Tested
- Claude CLI internal behavior (external dependency)
- Docker daemon functionality
- Database engine internals

### Test Environments
- Unit tests: In-memory mocks
- Integration tests: Test containers
- E2E tests: Full stack with test database

## Test Cases

### Unit Tests
| Test ID | Description | Input | Expected Output |
|---------|-------------|-------|-----------------|
| UT-001 | Create orchestrator stage | Task ID, stage type | New stage record created |
| UT-002 | Transition stage status | Stage ID, new status | Status updated, timestamp set |
| UT-003 | Parse Claude output | Raw CLI output | Structured context object |
| UT-004 | Allocate container | Request for container | Container ID or queued |
| UT-005 | Release container | Container ID | Container marked available |
| UT-006 | Queue task when full | Task when pool exhausted | Task added to queue |
| UT-007 | Process queue on release | Release with queued tasks | Next task starts |
| UT-008 | Context passing | Stage context | Context available to next stage |
| UT-009 | Stage timeout handling | Long-running stage | Stage marked failed after timeout |
| UT-010 | Concurrent task limit | 3rd task request | Task queued, not started |

### Integration Tests
| Test ID | Description | Components | Expected Result |
|---------|-------------|------------|-----------------|
| IT-001 | Full stage progression | Orchestrator + DB | All 3 stages complete |
| IT-002 | Claude CLI execution | Orchestrator + Claude | Command output captured |
| IT-003 | Container lifecycle | Pool + Docker | Container allocated and released |
| IT-004 | Database persistence | Service + SQLite | Stages persisted correctly |
| IT-005 | API endpoint integration | HTTP + Orchestrator | Endpoints return valid data |
| IT-006 | SSE event streaming | Events + WebSocket | Real-time updates delivered |
| IT-007 | Error recovery | Service + Retry logic | Failed stages can be retried |
| IT-008 | Queue processing | Queue + Scheduler | Tasks processed in order |

### End-to-End Tests
| Test ID | User Story | Steps | Expected Result |
|---------|------------|-------|-----------------|
| E2E-001 | Start orchestration | 1. POST /api/orchestrator/start<br>2. Monitor SSE events<br>3. Check final status | All stages complete, events received |
| E2E-002 | View stage progress | 1. Start orchestration<br>2. GET /api/orchestrator/stages/:id<br>3. Verify stage data | Current stage and context visible |
| E2E-003 | Handle stage failure | 1. Start with failing command<br>2. Stage fails<br>3. POST retry endpoint | Stage retried successfully |
| E2E-004 | Concurrent execution | 1. Start 2 tasks<br>2. Start 3rd task<br>3. Complete 1 task | 3rd task starts when slot available |
| E2E-005 | Cancel orchestration | 1. Start long task<br>2. DELETE /api/orchestrator/task/:id<br>3. Check cleanup | Task cancelled, container released |

## Test Data
### Required Test Data
```json
{
  "test_task": {
    "id": "test-task-001",
    "name": "Test Feature",
    "description": "Test task for orchestrator"
  },
  "test_context": {
    "specification": "Create a test feature",
    "implementation": "Build the test feature",
    "qa": "Review the test feature"
  }
}
```

### Edge Cases
- Empty context
- Very large context (>1MB)
- Special characters in prompts
- Simultaneous requests
- Network interruptions

## Performance Testing
### Load Tests
- 10 concurrent orchestrations
- 100 stage transitions per minute
- 1000 context read/writes

### Stress Tests
- Container pool exhaustion
- Database connection limits
- Memory usage under load

## Mock Strategy
### Claude CLI Mock
```rust
pub struct MockClaudeExecutor {
    responses: HashMap<String, String>,
    delay: Duration,
}
```

### Container Pool Mock
```rust
pub struct MockContainerPool {
    available_count: usize,
    failure_rate: f32,
}
```

## Success Criteria
- All unit tests pass (100%)
- Integration tests pass (>95%)
- E2E tests pass (>90%)
- Code coverage > 80%
- No memory leaks detected
- Response time < 200ms for API calls
- Stage transition < 5 seconds

## Test Execution Schedule
| Phase | Duration | Focus |
|-------|----------|-------|
| Unit Testing | 1 day | Core logic validation |
| Integration Testing | 1 day | Component interaction |
| E2E Testing | 1 day | Full workflow validation |
| Performance Testing | 1 day | Load and stress testing |
| Bug Fixes | 1 day | Address found issues |

## Risk Areas
- Claude CLI integration (external dependency)
- Container resource management
- Concurrent execution edge cases
- Context data serialization
- Stage transition race conditions