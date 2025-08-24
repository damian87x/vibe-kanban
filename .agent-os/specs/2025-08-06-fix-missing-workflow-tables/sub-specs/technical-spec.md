# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-06-fix-missing-workflow-tables/spec.md

> Created: 2025-08-06
> Version: 1.0.0

## Technical Requirements

- Execute PostgreSQL migration files to create missing database tables
- Ensure proper execution order of migration files (workflow_templates before user_workflows)
- Verify database connection and permissions for table creation
- Implement rollback capability in case of migration failures
- Validate table creation with proper indexes and constraints

## Approach Options

**Option A:** Manual SQL Execution
- Pros: Direct control, immediate feedback, can fix issues on the fly
- Cons: No tracking of executed migrations, prone to human error, not repeatable

**Option B:** Use Existing Migration Runner (Selected)
- Pros: Automated process, tracks executed migrations, repeatable, follows established patterns
- Cons: May need to fix migration runner if it has issues

**Rationale:** Using the existing migration runner ensures consistency with the project's database management approach and provides proper tracking of executed migrations.

## Implementation Details

### Migration Execution Order
1. `000_create_migrations_table.sql` - Creates migration tracking table
2. `009_agent_templates_v2.sql` - Creates workflow_templates table
3. `004_create_user_workflows_table.sql` - Creates user_workflows table and updates workflow_executions

### Error Analysis
- **Error Code:** 42P01 (undefined_table)
- **Error Location:** parse_relation.c:1384
- **Root Cause:** The `user_workflows` table doesn't exist in the database
- **Query Path:** `workflows.userWorkflows.list`

### Database Service Integration
- Service: `WorkflowDatabaseService` in `backend/services/workflows/workflow-database-service.ts`
- Pool Connection: Uses PostgreSQL connection pool from `backend/services/database`
- Query Methods: `getUserWorkflows()`, `createUserWorkflow()`, `updateUserWorkflow()`

## External Dependencies

No new external dependencies are required. The project already has:
- **pg** - PostgreSQL client for Node.js
- **dotenv** - Environment variable management
- Existing migration infrastructure