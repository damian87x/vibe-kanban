# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-22-test-coverage-fix/spec.md

> Created: 2025-08-22
> Version: 1.0.0

## Test Coverage Plan

### Files Requiring Import Path Fixes

**SSL Service Tests**
- `services/ssl/__tests__/certificate-manager.test.ts`
- `services/ssl/__tests__/certbot-config.test.ts`

**Integration Service Tests**
- `services/integrations/__tests__/integration.service.test.ts`
- `services/composio/__tests__/composio-polling.service.test.ts`

**OAuth and Auth Tests**
- `services/__tests__/auth-service.test.ts`
- `services/__tests__/oauth-session.service.test.ts`
- `config/__tests__/oauth.test.ts`
- `config/__tests__/oauth-integration.test.ts`

**Other Service Tests**
- `services/__tests__/trigger-condition-evaluator.test.ts`
- `services/__tests__/agent-template-version-manager.test.ts`
- `__tests__/integration-health-service.test.ts`

**Utility and Migration Tests**
- `utils/__tests__/environment.test.ts`
- `__tests__/utils/logger.test.ts`
- `__tests__/utils/template-converter.test.ts`
- `__tests__/utils/oauth-state.test.ts`
- `__tests__/migrations/008_knowledge_base_vector.test.ts`

### New Tests to Add

**app.ts Tests**
```typescript
describe('app.ts', () => {
  describe('Health endpoints', () => {
    test('GET /api/health returns healthy status');
    test('GET /api/test returns backend status');
    test('GET / returns API running message');
  });
  
  describe('tRPC lazy loading', () => {
    test('First request loads tRPC handler');
    test('Subsequent requests use cached handler');
    test('Handles tRPC loading errors gracefully');
    test('Returns 500 on tRPC initialization failure');
  });
  
  describe('Webhook endpoint', () => {
    test('Processes valid webhook triggers');
    test('Validates webhook secret');
    test('Evaluates trigger conditions');
    test('Handles missing triggers');
  });
});
```

**server.ts Tests**
```typescript
describe('server.ts', () => {
  describe('Server initialization', () => {
    test('Validates environment variables');
    test('Initializes database with Prisma');
    test('Runs migrations in development');
    test('Starts server on configured port');
    test('Handles port already in use');
  });
  
  describe('Health monitoring', () => {
    test('Initializes health monitoring');
    test('Handles disabled health monitoring');
  });
});
```

**trpc/app-router.ts Tests**
```typescript
describe('appRouter', () => {
  describe('Router structure', () => {
    test('Exports valid tRPC router');
    test('Contains all expected procedures');
    test('Router has _def property');
  });
  
  describe('Test procedure', () => {
    test('Returns hello world message');
  });
  
  describe('Sub-routers', () => {
    test('Health router is properly mounted');
    test('Auth router is properly mounted');
    test('Agents router is properly mounted');
    // etc for each router
  });
});
```

### Integration Tests

**tRPC Integration Tests**
```typescript
describe('tRPC Integration', () => {
  test('Can call procedures through HTTP');
  test('Authentication works via tRPC');
  test('Error handling returns proper format');
  test('Batch requests work correctly');
});
```

**Database Integration Tests**
```typescript
describe('Database Integration', () => {
  test('Can connect to test database');
  test('Migrations run successfully');
  test('Transactions work correctly');
  test('Connection pooling works');
});
```

### Test Data Factories

```typescript
// test-utils/factories.ts
export const factories = {
  user: () => ({
    id: faker.datatype.uuid(),
    email: faker.internet.email(),
    // ...
  }),
  
  workflow: () => ({
    id: faker.datatype.uuid(),
    name: faker.commerce.productName(),
    // ...
  }),
  
  integration: () => ({
    id: faker.datatype.uuid(),
    service: faker.helpers.arrayElement(['gmail', 'calendar', 'slack']),
    // ...
  })
};
```

### Mock Implementations

**tRPC Mocks**
```typescript
// __mocks__/trpc.ts
export const mockTRPCRouter = {
  _def: {
    procedures: {},
    // ...
  },
  createCaller: jest.fn(),
};
```

**Database Mocks**
```typescript
// __mocks__/prisma.ts
export const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    // ...
  },
  // ...
};
```

### Testing Best Practices

1. **Test Naming Convention**
   - Use descriptive test names
   - Follow "should... when..." pattern
   - Group related tests in describe blocks

2. **Test Isolation**
   - Each test should be independent
   - Clean up after tests
   - Use beforeEach/afterEach for setup/teardown

3. **Assertion Quality**
   - Test behavior, not implementation
   - Use specific assertions
   - Test error cases

4. **Performance**
   - Mock heavy operations
   - Use test database transactions
   - Parallelize where possible

## Coverage Requirements by File Type

### Critical Files (80% coverage target)
- `app.ts`
- `server.ts`
- `trpc/app-router.ts`
- Authentication routes
- Integration routes

### Service Files (60% coverage target)
- AI service clients
- OAuth providers
- Database services
- Workflow services

### Utility Files (50% coverage target)
- Helper functions
- Configuration loaders
- Validators

### Generated/External (No coverage required)
- Prisma client
- Node modules
- Build artifacts

## Test Execution Strategy

1. **Phase 1**: Fix all import paths (Day 1)
   - Fix one test file at a time
   - Verify it runs without import errors
   - Commit after each fix

2. **Phase 2**: Add missing unit tests (Day 2)
   - Focus on app.ts, server.ts, app-router.ts
   - Write tests for uncovered functions
   - Aim for 60% coverage

3. **Phase 3**: Integration tests (Day 3)
   - Test full request flows
   - Test database operations
   - Test external service mocks

4. **Phase 4**: Polish and optimize (Day 4)
   - Remove redundant tests
   - Improve test speed
   - Document testing approach