# Missing E2E Tests for Composio Integration Rebuild

## Overview

This specification outlines the comprehensive E2E test coverage needed for the rebuilt Composio integration system. Based on the 2025-08-07 rebuild spec analysis, many critical user flows and edge cases are not covered by existing tests.

## Current Test Coverage Analysis

### What's Already Tested
1. **Basic UI Flow** (`e2e/integration/journeys/integration-flow.spec.ts`)
   - Display of available integrations
   - Initial "Not connected" state
   - Connect button click (but not OAuth completion)
   - Basic disconnect flow

2. **BDD Integration Tests** (`e2e/integration/external/integrations-bdd.spec.ts`)
   - Viewing available integrations
   - Initiating connection (OAuth popup)
   - Network error handling
   - Disconnect confirmation
   - Connection persistence
   - Partial data handling

### Critical Gaps Identified

## Required E2E Test Specifications

### 1. OAuth Flow Completion Tests

#### Test: Complete OAuth Flow End-to-End
```typescript
test.describe('OAuth Flow Completion', () => {
  test('should complete full OAuth flow with Composio', async ({ page, context }) => {
    // Test OAuth flow completion including:
    // - OAuth popup handling
    // - State parameter verification
    // - Callback URL handling
    // - Connection status update
    // - Account ID persistence
  });

  test('should handle OAuth state expiration', async ({ page }) => {
    // Test expired OAuth state (>10 minutes)
    // Should show appropriate error message
  });

  test('should handle OAuth cancellation properly', async ({ page, context }) => {
    // User closes OAuth popup without completing
    // Connection status should remain unchanged
  });

  test('should prevent OAuth state reuse', async ({ page }) => {
    // Attempt to use same OAuth state twice
    // Should fail with security error
  });
});
```

#### Test: Multiple Account Prevention
```typescript
test.describe('Multiple Account Prevention', () => {
  test('should prevent multiple accounts for same provider', async ({ page }) => {
    // Connect Gmail once
    // Attempt to connect Gmail again
    // Should reuse existing connection, not create duplicate
  });

  test('should handle provider switching correctly', async ({ page }) => {
    // Connect with one Gmail account
    // Disconnect
    // Connect with different Gmail account
    // Should update existing connection
  });
});
```

### 2. Connection Persistence Tests

#### Test: Connection State Persistence
```typescript
test.describe('Connection State Persistence', () => {
  test('should persist connection after page refresh', async ({ page }) => {
    // Complete OAuth connection
    // Refresh page
    // Connection should still show as active
  });

  test('should persist connection across browser sessions', async ({ browser }) => {
    // Connect in one browser context
    // Close browser
    // Open new browser context
    // Connection should still be active
  });

  test('should sync connection status with Composio', async ({ page }) => {
    // Mock Composio API to return different status
    // Refresh integrations page
    // Should show updated status from Composio
  });
});
```

### 3. Tool Execution Tests

#### Test: Integration Tool Usage
```typescript
test.describe('Tool Execution', () => {
  test('should execute Gmail send email tool', async ({ page }) => {
    // Ensure Gmail is connected
    // Navigate to chat
    // Send message requesting email send
    // Verify tool execution and response
  });

  test('should handle tool execution errors gracefully', async ({ page }) => {
    // Mock tool execution failure
    // Attempt to use tool
    // Should show user-friendly error
  });

  test('should track tool execution history', async ({ page }) => {
    // Execute multiple tools
    // Check execution history/logs
    // Verify all executions are tracked
  });

  test('should respect tool permissions', async ({ page }) => {
    // Attempt to use tool not in allowedTools
    // Should fail with permission error
  });
});
```

### 4. Error Recovery Tests

#### Test: Connection Recovery
```typescript
test.describe('Connection Recovery', () => {
  test('should recover from temporary Composio outage', async ({ page }) => {
    // Mock Composio API failure
    // Attempt connection
    // Restore Composio API
    // Retry should succeed
  });

  test('should handle invalid Composio responses', async ({ page }) => {
    // Mock malformed Composio response
    // Should show error without crashing
  });

  test('should handle revoked OAuth tokens', async ({ page }) => {
    // Mock token revocation
    // Attempt to use integration
    // Should prompt for reconnection
  });
});
```

### 5. Security Tests

#### Test: OAuth Security
```typescript
test.describe('OAuth Security', () => {
  test('should validate OAuth state belongs to current user', async ({ page }) => {
    // Attempt to use OAuth state from different user
    // Should reject with security error
  });

  test('should not expose sensitive tokens in UI', async ({ page }) => {
    // Complete OAuth flow
    // Inspect network requests and DOM
    // No tokens should be visible
  });

  test('should handle CSRF attempts', async ({ page }) => {
    // Attempt OAuth callback without valid state
    // Should reject request
  });
});
```

### 6. Multi-Provider Tests

#### Test: Multiple Provider Management
```typescript
test.describe('Multiple Provider Management', () => {
  test('should handle multiple providers simultaneously', async ({ page }) => {
    // Connect Gmail
    // Connect Slack
    // Connect Calendar
    // All should work independently
  });

  test('should disconnect providers independently', async ({ page }) => {
    // Connect multiple providers
    // Disconnect one
    // Others should remain connected
  });

  test('should handle provider-specific errors', async ({ page }) => {
    // Gmail fails but Slack works
    // Should show provider-specific status
  });
});
```

### 7. Performance Tests

#### Test: Load Performance
```typescript
test.describe('Integration Performance', () => {
  test('should load integrations page quickly', async ({ page }) => {
    // Measure page load time
    // Should be < 2 seconds
  });

  test('should handle many connections efficiently', async ({ page }) => {
    // Mock 20+ connections
    // Page should remain responsive
  });

  test('should debounce status checks', async ({ page }) => {
    // Rapid navigation between pages
    // Should not spam Composio API
  });
});
```

### 8. Mobile-Specific Tests

#### Test: Mobile OAuth Flow
```typescript
test.describe('Mobile OAuth Flow', () => {
  test('should handle OAuth on mobile browsers', async ({ page }) => {
    // Set mobile viewport
    // Test OAuth flow
    // Should work with in-app browsers
  });

  test('should handle app deep linking', async ({ page }) => {
    // Test OAuth callback to app
    // Should return to correct screen
  });
});
```

### 9. Data Migration Tests

#### Test: Legacy Connection Migration
```typescript
test.describe('Data Migration', () => {
  test('should migrate existing Klavis connections', async ({ page }) => {
    // Create legacy connection
    // Run migration
    // Should convert to Composio format
  });

  test('should handle partial migration failures', async ({ page }) => {
    // Some connections migrate, others fail
    // Should show migration report
  });
});
```

### 10. Webhook Tests

#### Test: Composio Webhooks
```typescript
test.describe('Composio Webhooks', () => {
  test('should handle connection status webhooks', async ({ page }) => {
    // Simulate webhook for disconnection
    // UI should update automatically
  });

  test('should validate webhook signatures', async ({ request }) => {
    // Send webhook without valid signature
    // Should reject request
  });
});
```

## Test Implementation Strategy

### Phase 1: Critical Path Tests (Week 1)
1. Complete OAuth flow
2. Connection persistence
3. Basic tool execution
4. Security validation

### Phase 2: Error Handling (Week 2)
1. Network failures
2. OAuth errors
3. Invalid states
4. Recovery flows

### Phase 3: Advanced Features (Week 3)
1. Multi-provider scenarios
2. Performance testing
3. Mobile compatibility
4. Webhook handling

### Phase 4: Edge Cases (Week 4)
1. Data migration
2. Concurrent connections
3. Rate limiting
4. Exotic error conditions

## Test Environment Setup

### Required Mock Services
```typescript
// Mock Composio API endpoints
const mockComposioEndpoints = {
  '/api/v1/connectedAccounts': mockConnectedAccounts,
  '/api/v1/actions/execute': mockActionExecute,
  '/api/v2/apps/{appName}/oauth-url': mockOAuthUrl,
  '/api/v1/client/auth/oauth_callback': mockOAuthCallback
};
```

### Test Data Requirements
- Pre-seeded test users with various connection states
- Mock OAuth providers for testing
- Sample tool execution payloads
- Error response scenarios

## Success Metrics

### Coverage Goals
- **Line Coverage**: 95%+ for integration code
- **Branch Coverage**: 90%+ for error paths
- **E2E Scenario Coverage**: 100% of user flows

### Performance Targets
- OAuth flow completion: < 5 seconds
- Page load with connections: < 2 seconds
- Tool execution response: < 3 seconds

### Reliability Targets
- Test flakiness: < 1%
- False positives: 0%
- Environment setup time: < 30 seconds

## Integration with CI/CD

### Test Execution Strategy
```yaml
# Run on every PR
integration-e2e-tests:
  - smoke tests (5 min)
  - critical path tests (15 min)
  - full suite on merge (45 min)
```

### Monitoring Integration
- Test results dashboard
- Failure notifications
- Performance tracking
- Coverage reports

## Maintenance Considerations

### Test Data Management
- Automated cleanup after each test
- Isolated test environments
- Version-controlled test fixtures

### Test Evolution
- Regular review of test effectiveness
- Update tests with new features
- Remove obsolete scenarios
- Performance optimization

## Conclusion

This comprehensive E2E test specification ensures the Composio integration rebuild is thoroughly tested across all user scenarios, error conditions, and edge cases. Implementation of these tests will provide confidence in the stability and reliability of the integration system.