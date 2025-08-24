# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-22-test-coverage-fix/spec.md

> Created: 2025-08-22
> Version: 1.0.0

## Technical Requirements

### Import Path Issues to Fix

Currently failing imports using `@backend/` alias:
- `@backend/integration.service` → `../../services/integrations/integration.service`
- `@backend/composio-polling.service` → `../../services/composio/composio-polling.service`
- `@backend/certbot-config` → `../../services/ssl/certbot-config`
- `@backend/certificate-manager` → `../../services/ssl/certificate-manager`
- `@backend/oauth` → `../../config/oauth`
- `@backend/trigger-condition-evaluator` → `../../services/trigger-condition-evaluator`

### Jest Configuration Updates

```javascript
// jest.config.js updates needed
moduleNameMapper: {
  // Remove @backend alias or update to correct paths
  '^@/(.*)$': '<rootDir>/$1',
  '^@backend/(.*)$': '<rootDir>/$1'
}
```

### TypeScript Configuration Updates

```json
// tsconfig.json path mappings
"paths": {
  "@/*": ["./*"],
  "@backend/*": ["./*"]  // Update or remove
}
```

### tRPC Router Testing Strategy

The new lazy-loaded tRPC implementation needs special testing approach:

1. **Mock the dynamic imports** in tests:
```typescript
jest.mock('./trpc/app-router', () => ({
  appRouter: mockRouter
}));
```

2. **Test lazy loading behavior**:
- First request triggers loading
- Subsequent requests use cached handler
- Error handling when loading fails

3. **Integration testing approach**:
- Use supertest for HTTP-level testing
- Mock database and external services
- Test actual request/response flow

## Approach Options

**Option A: Fix imports with find/replace**
- Pros: Quick, straightforward
- Cons: May miss edge cases, no validation

**Option B: Use codemod/AST transformation** 
- Pros: Precise, handles all cases
- Cons: More complex, requires tooling

**Option C: Manual fix with validation** (Selected)
- Pros: Ensures each fix is correct, can improve tests while fixing
- Cons: More time-consuming

**Rationale:** Manual fixing allows us to validate each test still makes sense with the refactored code and improve test quality while fixing imports.

## Implementation Details

### Phase 1: Fix Import Paths (Priority 1)
1. Search for all `@backend/` imports in test files
2. Replace with correct relative paths
3. Verify imports resolve correctly
4. Run each test file individually to confirm

### Phase 2: Fix tRPC Testing (Priority 1)
1. Create proper mocks for tRPC router
2. Fix the `_def` property issue
3. Add tests for lazy loading behavior
4. Ensure all tRPC endpoints testable

### Phase 3: Improve Coverage (Priority 2)
Target files for coverage improvement:
- `app.ts` - Currently 0% → Target 80%
- `server.ts` - Currently 0% → Target 70%
- `trpc/app-router.ts` - Currently 0% → Target 80%
- Service files - Currently low → Target 60%

### Phase 4: Test Infrastructure (Priority 3)
1. Update test utilities for new architecture
2. Create reusable mocks for common patterns
3. Add test helpers for tRPC testing
4. Document testing best practices

## Coverage Targets

Current vs Target:
- **Statements**: 2.92% → 60%
- **Branches**: 2.69% → 50%
- **Functions**: 1.86% → 60%
- **Lines**: 2.81% → 60%

Focus areas:
1. Critical path coverage (auth, workflows, integrations)
2. Error handling paths
3. Edge cases and boundary conditions
4. Integration points

## Testing Tools and Utilities

### Required Test Utilities
```typescript
// test-utils/trpc-test-helper.ts
export function createTestTRPCClient() {
  // Helper for testing tRPC endpoints
}

// test-utils/mock-factories.ts
export function createMockUser() { }
export function createMockWorkflow() { }
// etc.
```

### Mock Strategy
- Use Jest mocks for unit tests
- Use test database for integration tests
- Mock external services (S3, OAuth providers, AI services)
- Use factory patterns for test data generation

## Risk Mitigation

1. **Risk**: Breaking working tests while fixing imports
   - **Mitigation**: Run tests before and after each change
   
2. **Risk**: Tests pass but don't test the right thing
   - **Mitigation**: Review test assertions, not just green tests
   
3. **Risk**: Coverage improves but quality doesn't
   - **Mitigation**: Focus on meaningful tests, not just line coverage

## Success Metrics

- All 26 failing test suites pass
- No reduction in existing passing tests (143 tests)
- Coverage reaches 60% minimum
- Tests run in under 30 seconds
- No flaky tests introduced