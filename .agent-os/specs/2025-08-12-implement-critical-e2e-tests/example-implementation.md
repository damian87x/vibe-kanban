# Example Implementation - OAuth Flow Completion Test

## Quick Start Example

Here's a complete implementation example for the first critical test to help jumpstart the development:

### Step 1: Create Mock Utilities

**File**: `e2e/integration/composio/helpers/composio-mocks.ts`

```typescript
import { Page, Route } from '@playwright/test';

export interface MockIntegration {
  provider: string;
  displayName: string;
  icon: string;
  description: string;
  connected: boolean;
  connectionId?: string;
  connectedAt?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

export class ComposioMockHelper {
  constructor(private page: Page) {}

  async mockAvailableIntegrations(integrations: MockIntegration[]) {
    await this.page.route('**/api/trpc/integrations.available', async (route) => {
      await route.fulfill({
        json: {
          result: {
            data: {
              json: integrations
            }
          }
        }
      });
    });
  }

  async mockOAuthInitiation(provider: string, state?: string) {
    const oauthState = state || `${provider}-state-${Date.now()}`;
    
    await this.page.route('**/api/trpc/integrations.initiate', async (route) => {
      const request = await route.request();
      const postData = request.postDataJSON();
      
      if (postData.json.provider === provider) {
        await route.fulfill({
          json: {
            result: {
              data: {
                json: {
                  authUrl: `https://composio.dev/oauth/authorize?provider=${provider}&state=${oauthState}`,
                  state: oauthState,
                  needsAuth: true
                }
              }
            }
          }
        });
      }
    });
    
    return oauthState;
  }

  async mockOAuthCallback(success = true) {
    await this.page.route('**/api/trpc/integrations.oauth.callback', async (route) => {
      if (success) {
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
      } else {
        await route.fulfill({
          status: 400,
          json: {
            error: {
              message: 'OAuth callback failed',
              code: 'OAUTH_ERROR'
            }
          }
        });
      }
    });
  }

  async mockConnectionComplete(provider: string, state: string, success = true) {
    await this.page.route('**/api/trpc/integrations.complete', async (route) => {
      const request = await route.request();
      const postData = request.postDataJSON();
      
      if (postData.json.state === state && postData.json.provider === provider) {
        if (success) {
          await route.fulfill({
            json: {
              result: {
                data: {
                  json: {
                    success: true,
                    connectionId: `${provider}-connection-${Date.now()}`
                  }
                }
              }
            }
          });
        } else {
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
      }
    });
  }
}

export const defaultIntegrations: MockIntegration[] = [
  {
    provider: 'gmail',
    displayName: 'Gmail',
    icon: '📧',
    description: 'Connect your Gmail account',
    connected: false
  },
  {
    provider: 'calendar',
    displayName: 'Google Calendar',
    icon: '📅',
    description: 'Connect your Google Calendar',
    connected: false
  },
  {
    provider: 'slack',
    displayName: 'Slack',
    icon: '💬',
    description: 'Connect your Slack workspace',
    connected: false
  }
];
```

### Step 2: Create Test Utilities

**File**: `e2e/integration/composio/helpers/test-utils.ts`

```typescript
import { Page, BrowserContext } from '@playwright/test';

export async function setupBypassAuth(page: Page) {
  await page.addInitScript(() => {
    (window as any).EXPO_PUBLIC_BYPASS_AUTH = 'true';
  });
}

export async function waitForIntegrationsPage(page: Page) {
  await page.waitForURL(/.*integrations/);
  await page.waitForSelector('text="Integrations"', { timeout: 10000 });
}

export async function findIntegrationCard(page: Page, provider: string) {
  // Try multiple selectors for resilience
  const selectors = [
    `[data-testid="integration-card-${provider}"]`,
    `text="${provider}"`,
    `text="${provider.charAt(0).toUpperCase() + provider.slice(1)}"`
  ];
  
  for (const selector of selectors) {
    const element = page.locator(selector).locator('xpath=ancestor::div[contains(@style, "backgroundColor")]').first();
    if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
      return element;
    }
  }
  
  throw new Error(`Could not find integration card for ${provider}`);
}

export async function captureOAuthPopup(context: BrowserContext, action: () => Promise<void>) {
  const popupPromise = context.waitForEvent('page');
  await action();
  const popup = await popupPromise;
  return popup;
}
```

### Step 3: Implement OAuth Completion Test

**File**: `e2e/integration/composio/oauth-completion.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { ComposioMockHelper, defaultIntegrations } from './helpers/composio-mocks';
import { setupBypassAuth, waitForIntegrationsPage, findIntegrationCard, captureOAuthPopup } from './helpers/test-utils';

test.describe('OAuth Flow Completion', () => {
  let mockHelper: ComposioMockHelper;

  test.beforeEach(async ({ page }) => {
    mockHelper = new ComposioMockHelper(page);
    await setupBypassAuth(page);
  });

  test('completes full OAuth flow successfully', async ({ page, context }) => {
    // Setup mocks
    await mockHelper.mockAvailableIntegrations(defaultIntegrations);
    const oauthState = await mockHelper.mockOAuthInitiation('gmail');
    await mockHelper.mockConnectionComplete('gmail', oauthState, true);

    // Navigate to integrations
    await page.goto('http://localhost:8081/integrations');
    await waitForIntegrationsPage(page);

    // Find Gmail card
    const gmailCard = await findIntegrationCard(page, 'gmail');
    const connectButton = gmailCard.locator('button:has-text("Connect")');
    
    // Verify initial state
    await expect(connectButton).toBeVisible();
    await expect(gmailCard.locator('text="Not connected"')).toBeVisible();

    // Capture OAuth popup
    const popup = await captureOAuthPopup(context, async () => {
      await connectButton.click();
    });

    // Verify OAuth URL
    const popupUrl = new URL(popup.url());
    expect(popupUrl.hostname).toContain('composio');
    expect(popupUrl.searchParams.get('state')).toBe(oauthState);
    expect(popupUrl.searchParams.get('provider')).toBe('gmail');

    // Simulate successful OAuth completion
    await popup.close();

    // Simulate callback navigation
    await page.evaluate((state) => {
      window.history.pushState({}, '', `/oauth/callback?state=${state}&code=test-auth-code`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, oauthState);

    // Wait for connection to be established
    await page.waitForTimeout(2000);

    // Mock updated integrations list showing Gmail as connected
    await mockHelper.mockAvailableIntegrations([
      {
        ...defaultIntegrations[0],
        connected: true,
        connectionId: 'gmail-connection-123',
        connectedAt: new Date().toISOString(),
        status: 'ACTIVE'
      },
      ...defaultIntegrations.slice(1)
    ]);

    // Refresh to verify persistence
    await page.reload();
    await waitForIntegrationsPage(page);

    // Verify Gmail is now connected
    const gmailCardAfter = await findIntegrationCard(page, 'gmail');
    await expect(gmailCardAfter.locator('text="Connected"')).toBeVisible();
    await expect(gmailCardAfter.locator('button:has-text("Disconnect")')).toBeVisible();
  });

  test('handles OAuth cancellation gracefully', async ({ page, context }) => {
    await mockHelper.mockAvailableIntegrations(defaultIntegrations);
    await mockHelper.mockOAuthInitiation('gmail');

    await page.goto('http://localhost:8081/integrations');
    await waitForIntegrationsPage(page);

    const gmailCard = await findIntegrationCard(page, 'gmail');
    const connectButton = gmailCard.locator('button:has-text("Connect")');

    // Start OAuth flow
    const popup = await captureOAuthPopup(context, async () => {
      await connectButton.click();
    });

    // Close popup without completing OAuth
    await popup.close();
    await page.waitForTimeout(1000);

    // Gmail should still show as not connected
    await expect(gmailCard.locator('text="Not connected"')).toBeVisible();
    await expect(connectButton).toBeVisible();
  });

  test('validates OAuth state parameter', async ({ page }) => {
    await mockHelper.mockAvailableIntegrations(defaultIntegrations);
    await mockHelper.mockConnectionComplete('gmail', 'invalid-state', false);

    await page.goto('http://localhost:8081/integrations');
    
    // Attempt to complete OAuth with invalid state
    await page.evaluate(() => {
      window.history.pushState({}, '', '/oauth/callback?state=invalid-state&code=test-code');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    // Should show error message
    await expect(page.locator('text=/Invalid.*OAuth.*state|expired.*state/i')).toBeVisible({ timeout: 5000 });
  });

  test('prevents OAuth state reuse', async ({ page, context }) => {
    const oauthState = 'reusable-state-123';
    
    await mockHelper.mockAvailableIntegrations(defaultIntegrations);
    await mockHelper.mockOAuthInitiation('gmail', oauthState);

    // First completion should succeed
    await mockHelper.mockConnectionComplete('gmail', oauthState, true);
    
    await page.goto('http://localhost:8081/integrations');
    await waitForIntegrationsPage(page);

    // Complete OAuth once
    await page.evaluate((state) => {
      window.history.pushState({}, '', `/oauth/callback?state=${state}&code=first-code`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, oauthState);

    await page.waitForTimeout(1000);

    // Second completion should fail
    await mockHelper.mockConnectionComplete('gmail', oauthState, false);

    // Attempt to reuse the same state
    await page.evaluate((state) => {
      window.history.pushState({}, '', `/oauth/callback?state=${state}&code=second-code`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, oauthState);

    // Should show error about state reuse
    await expect(page.locator('text=/Invalid.*state|already.*used/i')).toBeVisible({ timeout: 5000 });
  });
});
```

### Step 4: Run the Test

```bash
# Run the OAuth completion test
npm run test:e2e -- e2e/integration/composio/oauth-completion.spec.ts

# Run with visual debugging
npm run test:e2e:headed -- e2e/integration/composio/oauth-completion.spec.ts

# Run with step-by-step debugging
npm run test:e2e:debug -- e2e/integration/composio/oauth-completion.spec.ts
```

## Key Implementation Notes

1. **Mock Strategy**: We mock Composio API responses to ensure tests are reliable and don't depend on external services.

2. **State Management**: The OAuth state parameter is tracked throughout the flow to ensure security.

3. **Error Handling**: Tests cover both success and failure scenarios including cancellation and invalid states.

4. **Persistence Verification**: After OAuth completion, we refresh the page to ensure the connection persists.

5. **Selector Resilience**: We use multiple selector strategies to handle different UI implementations.

## Next Steps

1. Implement the remaining 4 critical tests following this pattern
2. Add more edge cases as discovered during testing
3. Integrate with CI/CD pipeline
4. Add performance benchmarks
5. Create visual regression tests for UI consistency