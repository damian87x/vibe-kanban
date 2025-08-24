# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-07-27-composio-sdk-migration/spec.md

> Created: 2025-07-27
> Version: 1.0.0

## API Changes Overview

The Composio SDK migration primarily affects internal service implementations rather than external API endpoints. However, there are some considerations for how the tRPC routes interact with the updated Composio service.

## Affected tRPC Routes

### Integration Management Routes

**Route:** `integrations.connect`
- **Location:** `backend/trpc/routes/integrations.ts`
- **Impact:** Calls to `composioIntegrationManager.initiateConnection()` will use new SDK
- **Changes:** No external API changes, internal implementation update only
- **Testing:** Verify OAuth flow initiation works correctly

**Route:** `integrations.callback`
- **Location:** `backend/trpc/routes/integrations.ts`
- **Impact:** Connection status verification will use new SDK methods
- **Changes:** May need to handle different response structures from new SDK
- **Testing:** Test OAuth callback handling with all three services

**Route:** `integrations.disconnect`
- **Location:** `backend/trpc/routes/integrations.ts`
- **Impact:** Calls to `composioIntegrationManager.disconnectAccount()` will use new SDK
- **Changes:** No external API changes expected
- **Testing:** Verify disconnection works and cleans up properly

**Route:** `integrations.list`
- **Location:** `backend/trpc/routes/integrations.ts`
- **Impact:** May call `composioIntegrationManager.listConnectedAccounts()`
- **Changes:** Response structure should remain consistent
- **Testing:** Ensure listing shows correct connection status

### AI Tool Execution Routes

**Route:** `ai.executeIntegrationTool`
- **Location:** `backend/trpc/routes/ai.ts`
- **Impact:** Tool execution will use new SDK's execute method
- **Changes:** Internal method calls updated, external API unchanged
- **Testing:** Test Gmail send, Calendar create event, Slack send message

## Internal Service API Changes

### ComposioIntegrationManager Methods

All public methods of the ComposioIntegrationManager class maintain their signatures to ensure compatibility with the rest of the codebase:

```typescript
// These method signatures remain unchanged:
async executeTool(accountId: string, toolName: string, parameters: Record<string, any>): Promise<any>
async getIntegrationByAccountId(accountId: string): Promise<ComposioIntegration | null>
async getIntegration(userId: string, service: string): Promise<ComposioIntegration | null>
async listToolsForApp(appName: string): Promise<Array<{name: string; description?: string; parameters?: Record<string, any>}>>
async isIntegrationActive(userId: string, appName: string): Promise<boolean>
async getConnectedAccount(accountId: string): Promise<any>
async getConnectionStatus(connectedAccountId: string): Promise<{ status: string; isActive: boolean } | null>
async initiateConnection(provider: string, entityId: string, redirectUrl?: string): Promise<{ redirectUrl: string; connectionId: string }>
async listConnectedAccounts(entityId: string): Promise<Array<{accountId: string; appName: string; status: string; isActive: boolean}>>
async disconnectAccount(connectedAccountId: string): Promise<boolean>
```

## Response Structure Considerations

### OAuth Flow Response
The new SDK may return different field names in OAuth responses:
- `redirectUrl` vs `redirect_url`
- `connectionId` vs `connection_id`
- `accountId` vs `account_id`

We'll normalize these in the service layer to maintain API compatibility.

### Error Response Updates
Error responses should maintain the current structure:
```typescript
{
  error: string;
  code?: string;
  details?: any;
}
```

## Webhook Endpoints

No webhook endpoints are expected to change. The OAuth callback URL remains:
- Pattern: `/oauth/callback`
- Handler: Processes OAuth callbacks from Composio
- Changes: None expected, but verify new SDK sends callbacks to same URL

## Environment Variable API

No changes to how environment variables are accessed:
- `COMPOSIO_API_KEY` - Remains the same
- `COMPOSIO_INTEGRATION_ID_*` - Used the same way, just needs to be added to deployment configs

## Testing Endpoints

For migration testing, we may temporarily add:
- Internal health check endpoint to verify SDK version
- Debug endpoint to compare old vs new SDK responses (development only)

These will be removed after migration is complete.

## API Versioning

Since this is an internal SDK update with no external API changes, we do not need to version the API. All existing clients will continue to work without modification.