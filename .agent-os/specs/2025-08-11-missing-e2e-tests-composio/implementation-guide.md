# E2E Test Implementation Guide - Composio Integration

## Quick Start Implementation

### Priority 1: OAuth Flow Completion Test

Create `e2e/integration/composio-oauth-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Composio OAuth Flow', () => {
  test('complete OAuth flow with state verification', async ({ page, context }) => {
    // Enable bypass auth
    await page.addInitScript(() => {
      (window as any).EXPO_PUBLIC_BYPASS_AUTH = 'true';
    });
    
    await page.goto('http://localhost:8081/integrations');
    
    // Find Gmail integration
    const gmailCard = page.locator('text="Gmail"').locator('xpath=ancestor::div[contains(@style, "backgroundColor")]');
    const connectButton = gmailCard.locator('button:has-text("Connect")');
    
    // Listen for popup
    const popupPromise = context.waitForEvent('page');
    await connectButton.click();
    
    // Handle OAuth popup
    const popup = await popupPromise;
    
    // Verify OAuth URL contains required parameters
    const url = new URL(popup.url());
    expect(url.hostname).toContain('composio');
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(url.searchParams.get('redirect_uri')).toBeTruthy();
    
    // Store state for verification
    const oauthState = url.searchParams.get('state');
    
    // Simulate successful OAuth (in real test, complete OAuth flow)
    await popup.close();
    
    // Mock the callback
    await page.route('**/api/trpc/integrations.oauth.callback', async route => {
      await route.fulfill({
        json: {
          result: {
            data: {
              json: {
                success: true,
                provider: 'gmail'
              }
            }
          }
        }
      });
    });
    
    // Simulate callback with same state
    await page.evaluate((state) => {
      window.history.pushState({}, '', `/oauth/callback?state=${state}&code=test-code`);
    }, oauthState);
    
    // Wait for connection to be established
    await page.waitForTimeout(2000);
    
    // Refresh to verify persistence
    await page.reload();
    
    // Gmail should now show as connected
    await expect(gmailCard.locator('text="Connected"')).toBeVisible();
    await expect(gmailCard.locator('button:has-text("Disconnect")')).toBeVisible();
  });
});
```

### Priority 2: Connection Persistence Test

Create `e2e/integration/connection-persistence.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Connection Persistence', () => {
  test('connections persist across page refreshes', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).EXPO_PUBLIC_BYPASS_AUTH = 'true';
    });
    
    // Mock connected state
    await page.route('**/api/trpc/integrations.available', async route => {
      const response = await route.fetch();
      const json = await response.json();
      
      // Override first integration to be connected
      if (json.result?.data?.json?.[0]) {
        json.result.data.json[0] = {
          ...json.result.data.json[0],
          connected: true,
          connectionId: 'test-connection-123',
          connectedAt: new Date().toISOString()
        };
      }
      
      await route.fulfill({ json });
    });
    
    await page.goto('http://localhost:8081/integrations');
    
    // Verify connected state
    const firstIntegration = page.locator('[data-testid^="integration-card-"]').first();
    await expect(firstIntegration.locator('text="Connected"')).toBeVisible();
    
    // Refresh page multiple times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await expect(firstIntegration.locator('text="Connected"')).toBeVisible();
    }
    
    // Navigate away and back
    await page.goto('http://localhost:8081/chat');
    await page.goto('http://localhost:8081/integrations');
    
    // Should still be connected
    await expect(firstIntegration.locator('text="Connected"')).toBeVisible();
  });
});
```

### Priority 3: Tool Execution Test

Create `e2e/integration/tool-execution.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Integration Tool Execution', () => {
  test('execute Gmail tool through chat', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).EXPO_PUBLIC_BYPASS_AUTH = 'true';
    });
    
    // Mock Gmail as connected
    await page.route('**/api/trpc/integrations.list', async route => {
      await route.fulfill({
        json: {
          result: {
            data: {
              json: {
                connections: [{
                  id: 'gmail-connection',
                  provider: 'gmail',
                  status: 'ACTIVE',
                  connectedAt: new Date().toISOString()
                }]
              }
            }
          }
        }
      });
    });
    
    // Mock tool execution
    await page.route('**/api/trpc/integrations.executeTool', async route => {
      const request = await route.request();
      const postData = request.postDataJSON();
      
      if (postData.json.toolName === 'GMAIL_SEND_EMAIL') {
        await route.fulfill({
          json: {
            result: {
              data: {
                json: {
                  success: true,
                  result: {
                    messageId: 'test-message-123',
                    status: 'sent'
                  }
                }
              }
            }
          }
        });
      } else {
        await route.abort('failed');
      }
    });
    
    // Navigate to chat
    await page.goto('http://localhost:8081/chat');
    
    // Send message requesting email
    const chatInput = page.locator('textarea[placeholder*="Type"], input[placeholder*="Type"]').first();
    await chatInput.fill('Send an email to test@example.com saying "Hello from E2E test"');
    await chatInput.press('Enter');
    
    // Wait for response
    await expect(page.locator('text=/email.*sent|successfully.*sent/i')).toBeVisible({ timeout: 10000 });
  });
});
```

### Priority 4: Security Test

Create `e2e/integration/oauth-security.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('OAuth Security', () => {
  test('reject invalid OAuth state', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).EXPO_PUBLIC_BYPASS_AUTH = 'true';
    });
    
    // Mock OAuth callback to reject invalid state
    await page.route('**/api/trpc/integrations.complete', async route => {
      const request = await route.request();
      const postData = request.postDataJSON();
      
      if (postData.json.state === 'invalid-state') {
        await route.fulfill({
          status: 400,
          json: {
            error: {
              message: 'Invalid or expired OAuth state',
              code: 'BAD_REQUEST'
            }
          }
        });
      }
    });
    
    await page.goto('http://localhost:8081/integrations');
    
    // Attempt to complete OAuth with invalid state
    await page.evaluate(() => {
      window.history.pushState({}, '', '/oauth/callback?state=invalid-state&code=test-code');
    });
    
    // Should show error
    await expect(page.locator('text=/Invalid.*OAuth.*state/i')).toBeVisible({ timeout: 5000 });
  });
  
  test('prevent cross-user OAuth state usage', async ({ browser }) => {
    // Create two browser contexts (different users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // User 1 initiates OAuth
    await page1.goto('http://localhost:8081/integrations');
    
    // Capture OAuth state from user 1
    let user1State: string | null = null;
    await page1.route('**/api/trpc/integrations.initiate', async route => {
      await route.fulfill({
        json: {
          result: {
            data: {
              json: {
                authUrl: 'https://composio.dev/oauth?state=user1-state-123',
                state: 'user1-state-123',
                needsAuth: true
              }
            }
          }
        }
      });
    });
    
    const gmailButton = page1.locator('text="Gmail"').locator('xpath=ancestor::div').locator('button:has-text("Connect")');
    await gmailButton.click();
    
    // User 2 tries to use User 1's state
    await page2.goto('http://localhost:8081/oauth/callback?state=user1-state-123&code=test-code');
    
    // Should be rejected
    await expect(page2.locator('text=/unauthorized|forbidden|invalid.*state/i')).toBeVisible();
    
    await context1.close();
    await context2.close();
  });
});
```

## Running the Tests

### Individual Test Suites
```bash
# OAuth flow tests
npm run test:e2e -- e2e/integration/composio-oauth-flow.spec.ts

# Persistence tests
npm run test:e2e -- e2e/integration/connection-persistence.spec.ts

# Tool execution tests
npm run test:e2e -- e2e/integration/tool-execution.spec.ts

# Security tests
npm run test:e2e -- e2e/integration/oauth-security.spec.ts
```

### All Integration Tests
```bash
npm run test:e2e -- e2e/integration/
```

### With Visual Debugging
```bash
npm run test:e2e:headed -- e2e/integration/composio-oauth-flow.spec.ts
```

## Mock Helpers

Create `e2e/integration/helpers/composio-mocks.ts`:

```typescript
export const mockConnectedIntegration = (provider: string, connected = true) => {
  return {
    provider,
    displayName: provider.charAt(0).toUpperCase() + provider.slice(1),
    icon: '📧',
    description: `Connect your ${provider} account`,
    connected,
    connectionId: connected ? `${provider}-connection-123` : undefined,
    connectedAt: connected ? new Date().toISOString() : undefined,
    status: connected ? 'ACTIVE' : 'INACTIVE'
  };
};

export const mockOAuthInitResponse = (provider: string) => {
  const state = `${provider}-state-${Date.now()}`;
  return {
    authUrl: `https://composio.dev/oauth/authorize?client_id=test&state=${state}&provider=${provider}`,
    state,
    needsAuth: true
  };
};

export const mockToolExecutionResponse = (toolName: string, success = true) => {
  if (!success) {
    return {
      success: false,
      error: 'Tool execution failed'
    };
  }
  
  const responses: Record<string, any> = {
    'GMAIL_SEND_EMAIL': {
      messageId: 'msg-123',
      status: 'sent'
    },
    'GMAIL_FETCH_EMAILS': {
      emails: [
        { id: '1', subject: 'Test Email', from: 'test@example.com' }
      ]
    },
    'SLACK_SEND_MESSAGE': {
      ts: '1234567890.123456',
      channel: 'C1234567890'
    }
  };
  
  return {
    success: true,
    result: responses[toolName] || {}
  };
};
```

## Next Steps

1. **Implement Priority 1-4 tests first** - These cover the most critical user flows
2. **Add error scenario tests** - Network failures, API errors, timeout handling  
3. **Add performance benchmarks** - Page load times, API response times
4. **Create data-driven tests** - Test all providers systematically
5. **Add visual regression tests** - Screenshot comparisons for UI consistency

## Tips for Stability

1. **Use explicit waits** instead of arbitrary timeouts
2. **Mock external APIs** to avoid flakiness
3. **Clean up test data** after each test
4. **Use unique identifiers** for parallel test execution
5. **Add retry logic** for network-dependent operations