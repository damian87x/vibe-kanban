# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-18-complete-workspace-restructure/spec.md

> Created: 2025-08-18
> Version: 1.0.0

## Test Coverage

### Unit Tests

**Workspace Configuration Tests**
- Verify npm recognizes both workspaces
- Test that workspace scripts execute correctly
- Ensure dependencies are installed in correct locations
- Validate workspace isolation

**Environment Loading Tests**
- Frontend loads only EXPO_PUBLIC_ variables
- Backend loads all server-side variables
- Missing .env files handled gracefully
- Environment variable precedence works correctly

### Integration Tests

**Development Workflow Tests**
- `npm run dev:frontend` starts only frontend
- `npm run dev:backend` starts only backend
- `npm run dev` starts both services
- Hot reload works in both workspaces

**Build Process Tests**
- Frontend builds successfully with workspace setup
- Backend transpiles correctly
- Production builds work for both workspaces
- Bundle sizes remain reasonable

**Test Execution Tests**
- Frontend tests run from new location
- Backend tests run from new location
- E2E tests still work from root
- Coverage reports generate correctly

### Feature Tests

**Complete Development Cycle**
- Developer can clone, install, and run the project
- Tests pass in CI/CD pipeline
- Deployment scripts work with new structure
- Documentation matches new setup

## Test Migration Strategy

### Phase 1: Inventory Current Tests
- List all test files and their current locations
- Identify which workspace each test belongs to
- Note any shared test utilities

### Phase 2: Create Test Structure
- Create src/frontend/__tests__ directory structure
- Create src/backend/__tests__ directory structure
- Keep e2e/ directory at root

### Phase 3: Move Tests
- Move component tests to frontend workspace
- Move API/service tests to backend workspace
- Update import paths in moved tests
- Verify tests still run from new locations

### Phase 4: Update Test Configuration
- Update Jest configs for new paths
- Configure workspace-specific test scripts
- Update coverage configuration
- Fix any broken test runners

## Test File Mapping

### Frontend Tests (move to src/frontend/__tests__)
```
__tests__/app/ → src/frontend/__tests__/app/
__tests__/components/ → src/frontend/__tests__/components/
__tests__/hooks/ → src/frontend/__tests__/hooks/
__tests__/store/ → src/frontend/__tests__/store/
__tests__/lib/ → src/frontend/__tests__/lib/
__tests__/services/audio-manager.test.ts → src/frontend/__tests__/services/
```

### Backend Tests (move to src/backend/__tests__)
```
__tests__/backend/ → src/backend/__tests__/
backend/__tests__/ → src/backend/__tests__/
__tests__/unit/routes/ → src/backend/__tests__/routes/
__tests__/unit/services/ → src/backend/__tests__/services/
__tests__/integration/s3-real.test.ts → src/backend/__tests__/integration/
```

### Root Level Tests (keep at root)
```
e2e/ → e2e/ (no change)
```

## Mocking Requirements

**Frontend Mocks**
- API calls should be mocked in frontend tests
- AsyncStorage mocked for state tests
- Navigation mocked for component tests

**Backend Mocks**
- Database connections mocked for unit tests
- External API calls mocked
- File system operations mocked where appropriate

**Shared Mocks**
- Create shared mock utilities if needed
- Document mock usage patterns
- Ensure consistent mocking approach

## Test Scripts Configuration

### Root package.json test scripts:
```json
{
  "scripts": {
    "test": "npm run test --workspaces",
    "test:frontend": "npm run test --workspace=@vibe/frontend",
    "test:backend": "npm run test --workspace=@vibe/backend",
    "test:e2e": "playwright test",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### Frontend test script:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Backend test script:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Success Criteria

1. All existing tests pass in their new locations
2. Test coverage remains at or above current levels
3. CI/CD pipeline runs tests successfully
4. Developers can run tests for specific workspaces
5. Test execution time doesn't significantly increase