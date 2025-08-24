# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-07-26-fix-oauth-hardcoded-urls/spec.md

> Created: 2025-07-26
> Version: 1.0.0

## Test Coverage

### Unit Tests

**OAuth Configuration Module**
- Test getOAuthRedirectUrl() with various environment configurations
- Test URL construction with different service names
- Test fallback behavior when environment variables are missing
- Test parameter encoding and security

**Environment Validation**
- Test startup validation with missing FRONTEND_URL
- Test validation with invalid URL formats
- Test warning messages for optional variables
- Test successful validation with all variables present

### Integration Tests

**OAuth Flow End-to-End**
- Test Gmail OAuth flow with production URLs
- Test Calendar OAuth flow with staging URLs
- Test Slack OAuth flow with development URLs
- Test error redirect handling
- Test state parameter preservation

**Provider Factory Integration**
- Test Klavis provider receives correct redirect URLs
- Test Composio provider receives correct redirect URLs
- Test provider switching maintains correct URLs
- Test error handling for misconfigured providers

### Feature Tests

**Production Deployment Verification**
- Navigate to production URL and initiate OAuth flow
- Verify redirect goes to production domain, not localhost
- Complete OAuth authorization and verify successful redirect
- Test integration connection after OAuth completion

**Multi-Environment Support**
- Deploy to staging with staging URLs
- Deploy to production with production URLs
- Verify each environment uses correct redirect URLs
- Test OAuth flows work in each environment

### Mocking Requirements

- **Environment Variables:** Mock different configurations for each test
- **HTTP Requests:** Mock OAuth provider responses
- **Provider Factory:** Mock provider initialization for unit tests

## Test Implementation Examples

### Unit Test Example

```typescript
describe('OAuth Configuration', () => {
  it('should use FRONTEND_URL for redirect when available', () => {
    process.env.FRONTEND_URL = 'https://production.example.com';
    const url = getOAuthRedirectUrl('gmail', 'success');
    expect(url).toBe('https://production.example.com/integrations?oauth=success&service=gmail');
  });

  it('should fall back to localhost when no environment variable set', () => {
    delete process.env.FRONTEND_URL;
    delete process.env.OAUTH_REDIRECT_BASE_URL;
    const url = getOAuthRedirectUrl('slack', 'error');
    expect(url).toBe('http://localhost:8081/integrations?oauth=error&service=slack');
  });
});
```

### E2E Test Example

```typescript
test('OAuth redirect uses production URL in production environment', async ({ page }) => {
  // Set production environment
  process.env.NODE_ENV = 'production';
  process.env.FRONTEND_URL = 'https://takspilot-728214876651.europe-west1.run.app';
  
  // Navigate to integrations page
  await page.goto('/integrations');
  
  // Click Gmail integration
  await page.click('[data-testid="connect-gmail"]');
  
  // Verify OAuth redirect URL
  await page.waitForURL(/google\.com.*redirect_uri=/);
  const url = page.url();
  expect(url).toContain('redirect_uri=https%3A%2F%2Ftakspilot-728214876651.europe-west1.run.app');
});
```

## Coverage Requirements

- Unit test coverage: 100% for new OAuth configuration code
- Integration test coverage: All OAuth providers and redirect scenarios
- E2E test coverage: Critical user flows in production environment
- No untested code paths in OAuth redirect logic