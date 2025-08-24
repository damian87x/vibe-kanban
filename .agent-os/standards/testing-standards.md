# Testing Standards

> Version: 1.0.0
> Last Updated: 2025-08-23

## Context

This file defines the mandatory testing standards for all Agent OS implementations. These standards ensure consistent quality, prevent regressions, and maintain high code coverage across all features.

## Core Testing Principles

### Test-First Development (TDD)
- **MANDATORY**: Write tests before implementation
- **Red-Green-Refactor**: Tests fail first, then pass, then optimize
- **No Implementation Without Tests**: Block development if tests aren't written

### Comprehensive Coverage
- **Minimum Coverage**: 90% for all new code
- **Coverage Types**: Lines, Branches, Functions, Statements
- **Coverage Enforcement**: CI/CD blocks merge below threshold

### Behavior-Driven Development (BDD)
- **User Journey Focus**: Test from user's perspective
- **Given-When-Then**: Structure all E2E tests
- **Readable Tests**: Tests document expected behavior

## Testing Hierarchy

### 1. Unit Tests
**Purpose**: Test individual components/functions in isolation

**Requirements**:
- Test all public methods
- Test edge cases and error conditions
- Mock external dependencies
- Fast execution (< 100ms per test)

**Location**: `__tests__/` directories next to source files

**Example**:
```typescript
describe('calculateTotal', () => {
  it('should calculate sum correctly', () => {
    expect(calculateTotal([1, 2, 3])).toBe(6);
  });
  
  it('should handle empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });
  
  it('should handle negative numbers', () => {
    expect(calculateTotal([-1, -2])).toBe(-3);
  });
});
```

### 2. Integration Tests
**Purpose**: Test component interactions and API endpoints

**Requirements**:
- Test API request/response cycles
- Test database operations
- Test service integrations
- Use test database

**Location**: `e2e/api/` for API tests

**Example**:
```typescript
describe('POST /api/workflows', () => {
  it('should create workflow with valid data', async () => {
    const response = await request(app)
      .post('/api/workflows')
      .send({ name: 'Test', description: 'Test' })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
  });
});
```

### 3. End-to-End (E2E) Tests
**Purpose**: Test complete user journeys

**Requirements**:
- Test critical user paths
- Use BDD format (Given-When-Then)
- Test in real browser environment
- Include visual regression tests

**Location**: `e2e/integration/journeys/`

**Example**:
```typescript
test('User can complete workflow', async ({ page }) => {
  const bdd = createBDDHelpers(page);
  
  // Given
  await bdd.givenUserIsLoggedIn();
  
  // When
  await bdd.whenUserCreatesWorkflow();
  
  // Then
  await bdd.thenWorkflowShouldBeVisible();
});
```

## Testing Requirements by Feature Type

### New Features
- [ ] Unit tests for all functions/components
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user journeys
- [ ] Performance tests if applicable
- [ ] Accessibility tests for UI components

### Bug Fixes
- [ ] Regression test that reproduces the bug
- [ ] Unit test for the fix
- [ ] E2E test to verify user experience
- [ ] All existing tests still pass

### Refactoring
- [ ] All existing tests pass unchanged
- [ ] No new tests needed (behavior unchanged)
- [ ] Performance benchmarks if optimization

## Coverage Requirements

### Minimum Thresholds
```json
{
  "coverageThreshold": {
    "global": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    }
  }
}
```

### Coverage Exceptions
Only allowed with explicit documentation:
- Generated code (migrations, configs)
- Third-party integrations (with mocks)
- Development-only code

## Test Organization

### File Structure
```
project/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── __tests__/
│   │       └── Button.test.tsx
│   └── services/
│       ├── api.ts
│       └── __tests__/
│           └── api.test.ts
├── e2e/
│   ├── integration/
│   │   ├── journeys/
│   │   │   └── user-flow.spec.ts
│   │   └── helpers/
│   │       └── bdd-helpers.ts
│   └── api/
│       └── endpoints.spec.ts
└── test-utils/
    └── setup.ts
```

### Naming Conventions
- Unit tests: `[component].test.ts(x)`
- E2E tests: `[feature].spec.ts`
- Test utilities: `[name]-helpers.ts`
- Test data: `[entity]-fixtures.ts`

## Testing Commands

### Essential Commands
```bash
# Unit tests
npm test                    # Run all unit tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # With coverage report

# E2E tests
npm run test:e2e           # Run all E2E tests
npm run test:e2e:headed    # Run in headed mode
npm run test:e2e:debug     # Debug mode

# Coverage
npm run test:coverage      # Generate coverage report
npm run test:coverage:90   # Enforce 90% threshold

# Specific tests
npm test -- Button.test    # Run specific test file
npm run test:e2e -- -g "login"  # Run tests matching pattern
```

## Test Data Management

### Test Database
- Separate test database
- Reset before each test run
- Seed with consistent data
- Never use production data

### Test Credentials
```typescript
const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'password123'
  },
  regular: {
    email: 'test@example.com',
    password: 'TestPassword123!'
  }
};
```

### Mock Data
```typescript
const mockWorkflow = {
  id: 'test-id',
  name: 'Test Workflow',
  status: 'active',
  createdAt: new Date('2024-01-01')
};
```

## Testing Best Practices

### DO:
- ✅ Write descriptive test names
- ✅ Test one thing per test
- ✅ Use AAA pattern (Arrange-Act-Assert)
- ✅ Mock external dependencies
- ✅ Clean up after tests
- ✅ Use data-testid for E2E selectors
- ✅ Test error scenarios
- ✅ Test edge cases

### DON'T:
- ❌ Test implementation details
- ❌ Use random/time-based data
- ❌ Share state between tests
- ❌ Skip tests (use .skip sparingly)
- ❌ Test third-party libraries
- ❌ Use production credentials
- ❌ Ignore flaky tests
- ❌ Comment out failing tests

## Continuous Integration

### CI Pipeline Requirements
```yaml
test:
  - npm run lint
  - npm run typecheck
  - npm test -- --coverage
  - npm run test:e2e
  - npm run test:coverage:90
```

### Merge Blocking Criteria
- All tests must pass
- Coverage >= 90%
- No linting errors
- No TypeScript errors
- E2E tests pass

## Performance Testing

### Load Testing
For features handling significant data:
```typescript
test('handles 1000 items efficiently', async () => {
  const items = generateLargeDataset(1000);
  const startTime = Date.now();
  
  await processItems(items);
  
  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(5000); // 5 seconds
});
```

### Response Time Testing
```typescript
test('API responds within 200ms', async () => {
  const start = performance.now();
  await fetch('/api/data');
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(200);
});
```

## Accessibility Testing

### Required Checks
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus management
- ARIA attributes

### Tools
```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

## Test Debugging

### Debug Commands
```bash
# Unit tests
npm test -- --verbose       # Verbose output
npm test -- --detectOpenHandles  # Find hanging processes

# E2E tests
PWDEBUG=1 npm run test:e2e  # Playwright inspector
npm run test:e2e:debug      # Step through tests
```

### Common Issues and Solutions

**Issue**: Tests pass locally but fail in CI
- Check environment variables
- Verify database state
- Check for timing issues
- Review timezone differences

**Issue**: Flaky tests
- Add proper waits
- Mock time-dependent code
- Increase timeouts appropriately
- Use retry mechanisms

**Issue**: Slow test suite
- Parallelize tests
- Reduce database operations
- Use test data builders
- Mock expensive operations

## Test Review Checklist

Before submitting code:
- [ ] All new code has tests
- [ ] Coverage is >= 90%
- [ ] Tests are descriptive
- [ ] No console.log in tests
- [ ] Tests run in < 5 minutes
- [ ] E2E tests included for features
- [ ] No skipped tests
- [ ] Test data is cleaned up

## Enforcement

### Automated Enforcement
- Pre-commit hooks run tests
- CI/CD blocks merge on failure
- Coverage reports in PR comments
- Test metrics dashboard

### Manual Review
- Code review includes test review
- Test quality assessed
- Coverage exceptions documented
- Performance benchmarks verified

## Conclusion

Testing is not optional. Every feature, fix, and refactor must include appropriate tests. Following these standards ensures our code is reliable, maintainable, and bug-free. When in doubt, write more tests rather than fewer.

---

*These standards are mandatory for all Agent OS implementations. Violations block deployment.*