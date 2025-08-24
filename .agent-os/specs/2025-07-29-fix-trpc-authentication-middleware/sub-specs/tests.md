# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-07-29-fix-trpc-authentication-middleware/spec.md

> Created: 2025-07-29
> Version: 1.0.0

## Test Coverage

### Unit Tests

**AuthService**
- `verifyToken()` with valid token returns correct payload
- `verifyToken()` with expired token throws TOKEN_EXPIRED error
- `verifyToken()` with invalid token throws TOKEN_INVALID error
- `verifyToken()` with malformed token throws error
- `generateTokens()` creates valid access and refresh tokens
- `generateTokens()` sets correct expiration times
- `refreshToken()` validates refresh token type
- `refreshToken()` returns new token pair
- `refreshToken()` rejects expired refresh tokens

**tRPC Context Creation**
- `protectedProcedure` extracts Bearer token correctly
- `protectedProcedure` handles missing authorization header
- `protectedProcedure` handles invalid authorization format
- `protectedProcedure` handles case-insensitive headers
- `protectedProcedure` validates user exists in database
- `protectedProcedure` passes user context to next middleware
- `protectedProcedure` respects bypass auth in development
- `protectedProcedure` respects E2E test mode

### Integration Tests

**Authentication Flow**
- User can register and receive valid tokens
- User can login with credentials and receive tokens
- Protected endpoints reject requests without auth header
- Protected endpoints accept requests with valid token
- Token refresh returns new valid tokens
- Expired access token triggers proper error response
- Invalid refresh token prevents token refresh
- Concurrent requests handle authentication properly

**OAuth Integration**
- OAuth initiation preserves authentication context
- OAuth callback validates JWT from state parameter
- Integration connection associates with authenticated user
- OAuth flow fails gracefully with invalid token

### E2E Tests

**Authentication User Journey**
```typescript
test('User authentication lifecycle', async ({ page }) => {
  const bdd = createBDDHelpers(page);
  
  // Given - User registers
  await bdd.givenUserNavigatesToPage('/auth/register');
  await bdd.whenUserFillsForm({
    email: 'test@example.com',
    password: 'TestPass123!',
    name: 'Test User'
  });
  await bdd.whenUserClicksButton('Register');
  
  // Then - User is authenticated
  await bdd.thenUserShouldBeRedirected('/');
  await bdd.thenUserShouldSeeText('Welcome, Test User');
  
  // When - User accesses protected feature
  await bdd.whenUserNavigatesToPage('/workflows');
  
  // Then - Protected content loads
  await bdd.thenUserShouldSeeText('My Workflows');
  
  // When - User logs out and tries protected route
  await bdd.whenUserClicksButton('Logout');
  await bdd.whenUserNavigatesToPage('/workflows');
  
  // Then - Redirected to login
  await bdd.thenUserShouldBeRedirected('/auth/login');
});
```

**Token Expiration Handling**
```typescript
test('Expired token handling', async ({ page }) => {
  const bdd = createBDDHelpers(page);
  
  // Given - User is logged in with soon-to-expire token
  await bdd.givenUserIsLoggedIn('test@example.com', 'password123');
  await mockTimeAdvance(7 * 24 * 60 * 60 * 1000); // 7 days
  
  // When - User makes API request
  await bdd.whenUserNavigatesToPage('/chat');
  
  // Then - Token is refreshed automatically
  await bdd.thenNoErrorsInConsole();
  await bdd.thenUserShouldSeeText('AI Assistant');
});
```

**Integration OAuth Flow**
```typescript
test('OAuth flow with authentication', async ({ page }) => {
  const bdd = createBDDHelpers(page);
  
  // Given - User is authenticated
  await bdd.givenUserIsLoggedIn('test@example.com', 'password123');
  
  // When - User connects Gmail integration
  await bdd.whenUserNavigatesToPage('/integrations');
  await bdd.whenUserClicksButton('Connect Gmail');
  
  // Then - OAuth flow maintains auth context
  await bdd.thenUserShouldBeRedirected(/oauth\.composio\.dev/);
  // Complete OAuth flow...
  await bdd.thenIntegrationShouldBeConnected('Gmail');
});
```

## Mocking Requirements

**Time-based Testing**
- Mock `Date.now()` for token expiration tests
- Use `jest.useFakeTimers()` for timeout scenarios
- Advance time to test refresh token behavior

**External Services**
- Mock database calls for user lookup
- Mock JWT signing/verification for edge cases
- Mock OAuth provider responses

**Network Conditions**
- Simulate slow network for concurrent auth requests
- Test retry logic with intermittent failures
- Verify timeout handling for auth operations

## Performance Tests

**Token Verification Benchmark**
- Measure average verification time < 10ms
- Test with 1000 concurrent verifications
- Monitor memory usage during peak load

**Database Query Optimization**
- User lookup query < 50ms
- Index on user.id for fast retrieval
- Connection pool handles concurrent auth requests

## Security Tests

**Token Security**
- Tokens cannot be decoded without secret
- Token tampering is detected and rejected
- Rate limiting prevents brute force attacks
- Refresh tokens cannot be used as access tokens

**Header Injection**
- Test various malformed authorization headers
- Verify SQL injection attempts are blocked
- Test header size limits

## Test Utilities

```typescript
// test-utils/auth-helpers.ts
export async function createAuthenticatedUser() {
  const user = await database.createUser({
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: await bcrypt.hash('password123', 10)
  });
  
  const tokens = await authService.generateTokens(user);
  return { user, tokens };
}

export function createExpiredToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '-1h' }
  );
}

export function createInvalidToken(): string {
  return jwt.sign(
    { userId: 'test' },
    'wrong-secret',
    { expiresIn: '1h' }
  );
}
```