# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-06-fix-missing-workflow-tables/spec.md

> Created: 2025-08-06
> Version: 1.0.0

## Test Coverage

### Migration Tests

**Migration Runner Tests**
- Verify migration files are executed in correct order
- Test rollback functionality on migration failure
- Ensure migrations are tracked in migrations table
- Validate idempotency (running migrations multiple times is safe)

### Database Schema Tests

**Table Existence Tests**
- Verify workflow_templates table exists with correct columns
- Verify user_workflows table exists with correct columns
- Verify workflow_executions table has new user_workflow_id column
- Check all indexes are created successfully

**Constraint Tests**
- Test foreign key constraints work properly
- Verify workflow_executions source check constraint
- Test cascade delete behavior for user workflows
- Validate nullable template_id in workflow_executions

### Integration Tests

**tRPC Endpoint Tests**
- Test workflows.userWorkflows.list returns empty array (not error)
- Test workflows.userWorkflows.create successfully creates a workflow
- Test workflows.userWorkflows.get retrieves created workflow
- Test workflows.userWorkflows.update modifies workflow data
- Test workflows.userWorkflows.delete removes workflow

**Database Service Tests**
- Test WorkflowDatabaseService.getUserWorkflows() returns results
- Test WorkflowDatabaseService.createUserWorkflow() inserts data
- Test WorkflowDatabaseService.updateUserWorkflow() updates data
- Verify JSON data is properly stored and retrieved

### E2E Tests

**Workflows Page Tests**
- Navigate to /workflows without errors
- Verify page loads with empty state (no workflows)
- Test creating a new workflow through UI
- Verify created workflow appears in list
- Test workflow actions (edit, delete, favorite)

### Error Handling Tests

**Migration Failure Tests**
- Test behavior when migration partially fails
- Verify proper error messages are logged
- Ensure system remains stable after migration errors

**Query Error Tests**
- Verify proper error handling for invalid workflow IDs
- Test authorization checks (users can only see their workflows)
- Validate input validation for workflow creation

## Mocking Requirements

- **Database Connection**: Use test database for migration tests
- **User Context**: Mock authenticated user for tRPC tests
- **Workflow Templates**: Seed test templates for workflow creation tests

## Test Execution Order

1. Migration tests (ensure tables exist)
2. Schema validation tests
3. Database service unit tests
4. tRPC integration tests
5. E2E workflow page tests

## Success Criteria

- All migrations execute without errors
- Database queries return expected results (not 42P01 errors)
- Workflows page loads successfully
- Users can perform CRUD operations on workflows
- No regression in existing functionality