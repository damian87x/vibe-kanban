# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-01-31-oauth-integration-fix/spec.md

> Created: 2025-01-31
> Version: 1.0.0

## Technical Requirements

### Core Issues to Fix

1. **Incorrect API Usage**
   - Current: Using `connectedAccounts.get(connectedAccountId)` for status checks
   - Required: Use `mcp.getUserConnectionStatus(entityId, mcpServerId)` as per Composio docs
   - Impact: Status checks fail because we're using the wrong API with wrong parameters

2. **ID Confusion**
   - Multiple ID types: entityId (userId), mcpServerId, connectedAccountId (NanoID)
   - Current code mixes these up, passing wrong IDs to wrong APIs
   - Need clear separation and proper usage of each ID type

3. **Disconnect Failures**
   - Frontend passes correct integrationId
   - Backend looks up Composio account ID from config
   - Must use `connectedAccounts.delete(accountId)` to disconnect from Composio

4. **OAuth Completion Polling**
   - Frontend polls with instanceId from OAuth initiation
   - Backend must look up integration by userId + provider
   - Use stored Composio account ID for status checks

### API Clarification

**Composio has two distinct APIs:**

1. **MCP API** - For user-level connection status
   ```typescript
   mcp.getUserConnectionStatus(entityId: string, mcpServerId: string)
   // entityId = user ID (e.g., "user123@example.com")
   // mcpServerId = MCP configuration ID for provider
   ```

2. **Connected Accounts API** - For specific account management
   ```typescript
   connectedAccounts.get(accountId: string)
   connectedAccounts.delete(accountId: string)
   connectedAccounts.initiate(entityId: string, authConfigId: string)
   // accountId = specific connection instance (NanoID)
   ```

## Approach Options

**Option A:** Minimal Fix - Just correct the API calls
- Pros: Quick to implement, low risk
- Cons: Doesn't address underlying architectural issues

**Option B:** Comprehensive Refactor (Selected)
- Pros: Fixes root causes, improves maintainability, adds proper error handling
- Cons: More time to implement, higher testing burden

**Rationale:** The OAuth system is critical infrastructure. A comprehensive fix prevents future issues and provides better debugging capabilities.

## Implementation Details

### 1. Update ComposioIntegrationManager

```typescript
// Fix getConnectionStatus to use MCP API
async getConnectionStatus(entityId: string, provider: string): Promise<{ 
  status: string; 
  isActive: boolean 
} | null> {
  const mcpConfig = await this.getOrCreateMCPServer(provider);
  const status = await this.composioClient.mcp.getUserConnectionStatus(
    entityId,
    mcpConfig.id
  );
  return {
    status: status.connected ? 'ACTIVE' : 'INACTIVE',
    isActive: status.connected
  };
}

// Keep getConnectedAccount for specific account lookups
async getConnectedAccount(accountId: string): Promise<any> {
  return await this.composioClient.connectedAccounts.get(accountId);
}
```

### 2. Fix OAuth Completion Check

```typescript
// In complete-oauth.ts
// First get the integration from database
const integration = await database.getIntegrationByUserAndService(
  ctx.user.id,
  input.provider
);

// Use MCP API to check connection status
const connectionStatus = await integrationManager.getConnectionStatus(
  ctx.user.id,    // entityId
  input.provider  // provider name
);
```

### 3. Fix Disconnect Flow

```typescript
// Backend already correct, just needs error handling
const composioAccountId = existingIntegration.config?.composio_account_id;
if (composioAccountId) {
  try {
    await composioManager.disconnectAccount(composioAccountId);
  } catch (error) {
    logger.error('Composio disconnect failed', { error });
    // Continue with local disconnect
  }
}
```

### 4. Add Comprehensive Logging

```typescript
// Log all OAuth operations with context
logger.info('OAuth operation', {
  operation: 'initiate|complete|disconnect|status',
  provider: 'gmail|calendar|slack',
  userId: 'user-id',
  accountId: 'composio-account-id',
  mcpServerId: 'mcp-server-id',
  success: true|false,
  error: 'error-message'
});
```

## External Dependencies

No new dependencies required. Using existing:
- `@composio/core` - Already installed, just using different methods
- Existing logging and database libraries