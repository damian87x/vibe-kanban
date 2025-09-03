# Orchestrator E2E Tests

This directory contains end-to-end tests for the Vibe Kanban Orchestrator feature.

## Prerequisites

1. **Install Playwright browsers** (first time only):
```bash
pnpm run test:install
```

2. **Ensure Rust is updated** to version 1.85+ to fix dependency issues:
```bash
rustup update stable
```

3. **Install development dependencies**:
```bash
pnpm install
```

## Running Tests

### Run all E2E tests
```bash
pnpm run test:e2e
```

### Run orchestrator tests only
```bash
pnpm run test:e2e:orchestrator
```

### Run database integrity tests
```bash
pnpm run test:e2e:db
```

### Run tests in UI mode (recommended for development)
```bash
pnpm run test:e2e:ui
```

### Debug tests interactively
```bash
pnpm run test:e2e:debug
```

### Run specific test
```bash
npx playwright test -g "should process task through all orchestration stages"
```

## Test Coverage

### Orchestrator Core Tests (`orchestrator.spec.ts`)
- ✅ Dashboard display with container status
- ✅ Task processing through all stages (specification → implementation → review → completed)
- ✅ Container allocation and release
- ✅ Task retry from specific stages
- ✅ Task queueing when containers are busy
- ✅ Context persistence between stages
- ✅ Task status updates
- ✅ Parallel task execution
- ✅ Progress indicators

### Database Integrity Tests (`orchestrator-database.spec.ts`)
- ✅ Orchestrator fields storage (orchestrator_stage, orchestrator_context, container_id)
- ✅ Stage outputs storage in separate table
- ✅ Referential integrity
- ✅ Concurrent updates handling
- ✅ Stage transition tracking

## Test Architecture

### Helper Utilities (`helpers/test-helpers.ts`)
- `TestHelpers` class provides common operations:
  - Project and task creation
  - Navigation helpers
  - Orchestrator status checking
  - Stage waiting and verification
  - Container status monitoring

### Test Environment
- Tests run against the development server (`pnpm run dev`)
- Server is automatically started before tests
- Uses SQLite database in `dev_assets/` directory
- Simulates real Claude Code CLI execution

## Important Notes

1. **Timing**: Tests wait for the orchestrator's 30-second polling cycle
2. **Containers**: Tests verify allocation of 3 containers (ports 8081-8083)
3. **Concurrency**: Maximum 2 tasks can run concurrently
4. **Stages**: Each task goes through 4 stages with different Claude commands

## Troubleshooting

### Tests fail with "No container was allocated"
- Ensure the dev server is running properly
- Check that migrations have been applied
- Verify no orphaned processes using the containers

### Database tests fail
- Ensure SQLite database exists in `dev_assets/db.sqlite`
- Run migrations: `DATABASE_URL=sqlite:dev_assets/db.sqlite sqlx migrate run`

### Timeout errors
- Increase timeout in test configuration
- Check that Claude Code CLI is properly configured
- Ensure orchestrator service is running (check logs)

### Port conflicts
- Clear saved ports: `node scripts/setup-dev-environment.js clear`
- Kill any processes using ports 3000-3005

## CI/CD Integration

To run in CI environment:
```bash
# Install browsers
npx playwright install --with-deps

# Run tests
CI=true pnpm run test:e2e

# Generate report
npx playwright show-report
```

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

Reports are saved in `playwright-report/` directory.