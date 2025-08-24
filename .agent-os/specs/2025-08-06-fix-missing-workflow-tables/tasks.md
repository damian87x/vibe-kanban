# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-08-06-fix-missing-workflow-tables/spec.md

> Created: 2025-08-06
> Status: Ready for Implementation

## Tasks

- [ ] 1. Verify and prepare migration infrastructure
  - [ ] 1.1 Write tests to verify migration runner functionality
  - [ ] 1.2 Check if migrations table exists in database
  - [ ] 1.3 Review migration files for correct SQL syntax
  - [ ] 1.4 Ensure DATABASE_URL environment variable is set
  - [ ] 1.5 Test database connection and permissions
  - [ ] 1.6 Verify all migration tests pass

- [ ] 2. Execute database migrations
  - [ ] 2.1 Write tests for table creation verification
  - [ ] 2.2 Run migration 000_create_migrations_table.sql
  - [ ] 2.3 Run migration 009_agent_templates_v2.sql (creates workflow_templates)
  - [ ] 2.4 Run migration 004_create_user_workflows_table.sql
  - [ ] 2.5 Verify all tables exist with correct schema
  - [ ] 2.6 Verify all migration tests pass

- [ ] 3. Test tRPC endpoints functionality
  - [ ] 3.1 Write integration tests for workflow endpoints
  - [ ] 3.2 Test workflows.userWorkflows.list returns empty array
  - [ ] 3.3 Test creating a new workflow
  - [ ] 3.4 Test retrieving created workflow
  - [ ] 3.5 Test updating and deleting workflows
  - [ ] 3.6 Verify all integration tests pass

- [ ] 4. Verify workflows page functionality
  - [ ] 4.1 Write E2E tests for workflows page
  - [ ] 4.2 Start the application and navigate to /workflows
  - [ ] 4.3 Verify page loads without database errors
  - [ ] 4.4 Test workflow UI interactions
  - [ ] 4.5 Take screenshots to document working state
  - [ ] 4.6 Verify all E2E tests pass