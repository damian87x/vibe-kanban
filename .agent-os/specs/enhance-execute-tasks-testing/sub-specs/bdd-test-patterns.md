# BDD Test Patterns Sub-Specification

## Overview
This sub-spec defines the Behavior-Driven Development (BDD) test patterns that must be created for all user-facing features during task execution.

## BDD Test Structure

### File Organization
```
e2e/
├── integration/
│   ├── journeys/           # User journey tests
│   │   ├── auth.spec.ts
│   │   ├── workflow-creation.spec.ts
│   │   └── [feature].spec.ts
│   ├── helpers/
│   │   ├── bdd-helpers.ts  # Given/When/Then helpers
│   │   └── test-data.ts    # Test data factories
│   └── api/                # API integration tests
└── smoke.spec.ts          # Critical path tests
```

### BDD Helper Pattern

```typescript
// e2e/integration/helpers/bdd-helpers.ts
export function createBDDHelpers(page: Page) {
  return {
    // Given - Initial state setup
    async givenUserIsLoggedIn(email = 'admin@test.com', password = 'password123') {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', email);
      await page.fill('[data-testid="password"]', password);
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('/(tabs)');
    },
    
    async givenUserIsOnPage(path: string) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    },
    
    async givenDataExists(type: string, data: any) {
      // Create test data via API or database
    },
    
    // When - User actions
    async whenUserClicksButton(label: string) {
      await page.click(`text="${label}"`);
    },
    
    async whenUserFillsForm(data: Record<string, string>) {
      for (const [field, value] of Object.entries(data)) {
        await page.fill(`[data-testid="${field}"]`, value);
      }
    },
    
    async whenUserNavigatesToTab(tab: string) {
      await page.click(`[role="tab"]:has-text("${tab}")`);
    },
    
    // Then - Assertions
    async thenUserShouldSeeText(text: string) {
      await expect(page.locator(`text="${text}"`)).toBeVisible();
    },
    
    async thenUserShouldBeOnPage(path: string) {
      await expect(page).toHaveURL(new RegExp(path));
    },
    
    async thenDataShouldBeSaved(type: string, expectedData: any) {
      // Verify via API or database
    }
  };
}
```

## BDD Test Templates

### Template 1: Feature Creation Journey

```typescript
test.describe('Feature Creation Journey', () => {
  test('User can create and manage [feature]', async ({ page }) => {
    const bdd = createBDDHelpers(page);
    
    // Given - User is authenticated and on the correct page
    await bdd.givenUserIsLoggedIn();
    await bdd.givenUserIsOnPage('/[feature-page]');
    
    // When - User creates new feature
    await bdd.whenUserClicksButton('Create New');
    await bdd.whenUserFillsForm({
      name: 'Test Feature',
      description: 'Test Description',
      // ... other fields
    });
    await bdd.whenUserClicksButton('Save');
    
    // Then - Feature is created successfully
    await bdd.thenUserShouldSeeText('Successfully created');
    await bdd.thenDataShouldBeSaved('feature', {
      name: 'Test Feature',
      description: 'Test Description'
    });
  });
  
  test('User sees validation errors for invalid input', async ({ page }) => {
    const bdd = createBDDHelpers(page);
    
    // Given
    await bdd.givenUserIsLoggedIn();
    await bdd.givenUserIsOnPage('/[feature-page]');
    
    // When - User submits invalid data
    await bdd.whenUserClicksButton('Create New');
    await bdd.whenUserClicksButton('Save'); // Empty form
    
    // Then - Validation errors appear
    await bdd.thenUserShouldSeeText('Name is required');
    await bdd.thenUserShouldSeeText('Description is required');
  });
});
```

### Template 2: Integration Flow Journey

```typescript
test.describe('OAuth Integration Journey', () => {
  test('User can connect external service', async ({ page }) => {
    const bdd = createBDDHelpers(page);
    
    // Given - User wants to connect service
    await bdd.givenUserIsLoggedIn();
    await bdd.givenUserIsOnPage('/integrations');
    
    // When - User initiates connection
    await bdd.whenUserClicksButton('Connect Gmail');
    await bdd.whenUserCompletesOAuthFlow('gmail');
    
    // Then - Integration is connected
    await bdd.thenUserShouldSeeText('Gmail connected');
    await bdd.thenIntegrationShouldBeActive('gmail');
  });
});
```

### Template 3: Error Recovery Journey

```typescript
test.describe('Error Recovery Journey', () => {
  test('User can recover from network errors', async ({ page }) => {
    const bdd = createBDDHelpers(page);
    
    // Given - Network will fail
    await bdd.givenNetworkWillFail('/api/save');
    await bdd.givenUserIsLoggedIn();
    
    // When - User tries action that fails
    await bdd.whenUserClicksButton('Save');
    
    // Then - Error is handled gracefully
    await bdd.thenUserShouldSeeText('Network error. Please try again.');
    await bdd.thenUserCanRetryAction();
  });
});
```

## BDD Scenarios to Cover

### Core User Journeys
1. **Authentication Flow**
   - Login with valid credentials
   - Login with invalid credentials
   - Password reset flow
   - Session timeout handling

2. **CRUD Operations**
   - Create new entity
   - Read/View entity details
   - Update entity information
   - Delete entity with confirmation

3. **Search and Filter**
   - Search by text
   - Apply filters
   - Clear filters
   - No results handling

4. **Data Validation**
   - Required field validation
   - Format validation (email, phone)
   - Business rule validation
   - Server-side validation

5. **Error Scenarios**
   - Network failures
   - Server errors (500)
   - Not found (404)
   - Unauthorized (401)

6. **Performance Scenarios**
   - Large data sets
   - Slow network conditions
   - Concurrent updates
   - Real-time updates

## BDD Test Checklist

For each user-facing feature, ensure:

- [ ] **Happy Path Test**: Primary success scenario
- [ ] **Validation Test**: Invalid input handling
- [ ] **Error Test**: Failure scenario handling
- [ ] **Edge Case Test**: Boundary conditions
- [ ] **Performance Test**: Load/speed considerations
- [ ] **Accessibility Test**: Keyboard navigation, screen readers
- [ ] **Mobile Test**: Responsive behavior (if applicable)

## BDD Best Practices

### 1. Test Naming
```typescript
// Good: Describes user goal and outcome
test('User can create workflow and see it in the list', async ({ page }) => {});

// Bad: Technical description
test('POST /api/workflows returns 201', async ({ page }) => {});
```

### 2. Test Independence
```typescript
test.beforeEach(async ({ page }) => {
  // Reset to clean state
  await resetDatabase();
  await seedTestData();
});
```

### 3. Test Data Management
```typescript
const testData = {
  validUser: {
    email: 'test@example.com',
    password: 'TestPassword123!'
  },
  invalidUser: {
    email: 'invalid',
    password: '123'
  }
};
```

### 4. Assertion Patterns
```typescript
// Visual assertions
await expect(page.locator('.success-message')).toBeVisible();
await expect(page.locator('.error')).not.toBeVisible();

// Data assertions
const response = await page.request.get('/api/workflows');
expect(response.status()).toBe(200);
expect(await response.json()).toMatchObject({ /* expected */ });

// Accessibility assertions
await expect(page.locator('button')).toHaveAttribute('aria-label');
```

## BDD Anti-Patterns to Avoid

### 1. Implementation Details in Tests
```typescript
// Bad: Tests implementation
test('useState hook updates correctly', async () => {});

// Good: Tests behavior
test('User sees updated count after clicking increment', async () => {});
```

### 2. Brittle Selectors
```typescript
// Bad: Relies on DOM structure
await page.click('.container > div:nth-child(2) > button');

// Good: Uses semantic selectors
await page.click('[data-testid="submit-button"]');
await page.click('button:has-text("Submit")');
```

### 3. Missing Error Scenarios
```typescript
// Incomplete: Only happy path
test('User can save data', async () => { /* ... */ });

// Complete: Includes error handling
test('User can save data', async () => { /* ... */ });
test('User sees error when save fails', async () => { /* ... */ });
```

## Automated BDD Test Generation

When implementing a new feature, the agent should automatically:

1. **Analyze the feature** to identify user journeys
2. **Generate test scenarios** covering all paths
3. **Create test files** using templates
4. **Implement helpers** for new interactions
5. **Run tests** to verify they fail initially
6. **Implement feature** to make tests pass

## Integration with CI/CD

BDD tests must:
- Run on every pull request
- Block merge if failing
- Generate coverage reports
- Capture screenshots on failure
- Run in parallel for speed

## Conclusion

BDD tests are mandatory for all user-facing features. They ensure that the application behaves correctly from the user's perspective and catch regressions before they reach production. By following these patterns and templates, every feature will have comprehensive behavioral test coverage.