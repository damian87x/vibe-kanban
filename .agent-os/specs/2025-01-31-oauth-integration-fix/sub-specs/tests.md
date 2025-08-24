# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-01-31-oauth-integration-fix/spec.md

> Created: 2025-01-31
> Version: 1.0.0

## Test Coverage

### Unit Tests

**ComposioIntegrationManager**
- `getConnectionStatus()` uses MCP API with correct parameters
- `getConnectionStatus()` handles API timeouts gracefully
- `getConnectedAccount()` uses Connected Accounts API
- `disconnectAccount()` calls correct Composio API
- MCP server creation caches results properly

**OAuthService**
- `initiateOAuth()` stores correct IDs in database
- `handleOAuthCallback()` updates integration status
- `getOAuthStatus()` returns accurate connection state

### Integration Tests

**OAuth Flow End-to-End**
- User can initiate OAuth and complete flow successfully
- Completed OAuth shows as connected immediately
- Failed OAuth shows appropriate error message
- Timeout during OAuth is handled gracefully

**Disconnect Flow**
- Disconnect removes integration from local database
- Disconnect removes account from Composio
- Disconnect works even if Composio API fails
- User sees success message after disconnect

**Status Synchronization**
- List integrations shows accurate status from Composio
- Status updates when connection expires
- Multiple users can have same integration type

### E2E Tests

**Complete User Journey**
```typescript
test('User can connect and disconnect Gmail', async ({ page }) => {
  // 1. Navigate to integrations page
  await page.goto('/integrations');
  
  // 2. Click Connect on Gmail
  await page.click('[data-testid="connect-gmail"]');
  
  // 3. Complete OAuth in popup (mocked)
  await handleOAuthPopup(page);
  
  // 4. Verify Gmail shows as connected
  await expect(page.locator('[data-testid="gmail-status"]')).toHaveText('Connected');
  
  // 5. Click Disconnect
  await page.click('[data-testid="disconnect-gmail"]');
  
  // 6. Confirm disconnect
  await page.click('[data-testid="confirm-disconnect"]');
  
  // 7. Verify Gmail shows as disconnected
  await expect(page.locator('[data-testid="gmail-status"]')).toHaveText('Not connected');
});
```

### Mocking Requirements

**Composio API Mocks**
- `mcp.getUserConnectionStatus()` - Return connected/disconnected states
- `connectedAccounts.initiate()` - Return OAuth URL and account ID
- `connectedAccounts.delete()` - Simulate successful disconnect
- `mcp.create()` - Return MCP server configuration

**OAuth Flow Mocks**
- Popup window behavior for web platform
- Deep linking for mobile platforms
- OAuth callback with success/error states

**Database Mocks**
- Integration CRUD operations
- User authentication state
- OAuth state storage

## Test Scenarios

### Happy Path
1. User connects integration successfully
2. Integration shows as connected
3. User can use integration in workflows
4. User disconnects integration
5. Integration removed completely

### Error Scenarios
1. OAuth popup blocked by browser
2. User cancels OAuth midway
3. Composio API timeout during status check
4. Network failure during disconnect
5. Invalid provider specified

### Edge Cases
1. User has multiple accounts
2. OAuth state expires during flow
3. User refreshes page during OAuth
4. Concurrent OAuth attempts
5. Provider returns error during OAuth

## Performance Tests

- OAuth status check completes in < 2 seconds
- Integration list loads in < 1 second
- Disconnect operation completes in < 3 seconds
- MCP server creation cached after first call