# Fix Composio MCP Integration

> Priority: P0 Critical - Core Feature Broken
> Created: 2025-07-29
> Status: Planning

## Problem

The OAuth integration flow for Gmail, Calendar, and Slack is failing with a validation error in the Composio SDK. Investigation revealed we're using the wrong Composio approach - we're using the standard OAuth flow (`connectedAccounts.initiate()`) instead of the MCP-specific flow (`composio.mcp.create()`).

### Current Error
```
ComposioError: Failed to parse connected account list query
Caused by:
  - authConfigIds.0 - Required (expected string, received undefined)
  - userIds.0 - Expected string, received object
```

### Root Cause
1. Our implementation uses `connectedAccounts.initiate()` which is the standard OAuth flow
2. Composio MCP requires using `composio.mcp.create()` with specific authConfigId
3. The validation error occurs because the standard flow expects different parameters than what we're providing

## Solution

Migrate from standard Composio OAuth flow to MCP-specific flow.

### Key Differences

| Current (Standard OAuth) | Required (MCP Flow) |
|-------------------------|---------------------|
| `connectedAccounts.initiate()` | `composio.mcp.create()` |
| Uses integrationId | Uses authConfigId |
| Direct OAuth redirect | MCP server URLs |
| Single-step connection | Check status → Generate URLs |

### Implementation Steps

1. **Update Environment Variables**
   - Keep existing `COMPOSIO_INTEGRATION_ID_*` variables (they might be authConfigIds)
   - Verify if current integration IDs work as authConfigIds
   - If not, obtain proper authConfigIds from Composio dashboard

2. **Refactor ComposioIntegrationManager**
   - Replace `connectedAccounts.initiate()` with MCP flow:
     - `mcp.create()` - Create MCP configuration (cache this)
     - `mcp.getServer()` - Get user-specific server URLs
     - `mcp.getUserConnectionStatus()` - Check connection status
   - Remove OAuth redirect logic - MCP handles auth internally
   - Return MCP server URL instead of OAuth redirect URL

3. **Simplify Authentication Flow**
   - No more OAuth callbacks needed
   - MCP server URL handles authentication automatically
   - Frontend just needs to work with the MCP server URL

4. **Update ComposioMCPAdapter**
   - Use the MCP server URLs for tool execution
   - Tools are accessed through the MCP protocol, not direct API

### Technical Details

```typescript
// OLD: Standard OAuth Flow (WRONG APPROACH)
const connectionRequest = await this.composioClient.connectedAccounts.initiate({
  integrationId: "ac_-4oiVfct2l7K",
  entityId: userId,
  redirectUri: redirectUrl
});

// NEW: MCP Flow (CORRECT APPROACH)
// Step 1: Create MCP configuration (one-time setup, can be cached)
const mcpConfig = await this.composioClient.mcp.create(
  `${provider} MCP Server`,  // e.g., "Gmail MCP Server"
  [{
    authConfigId: process.env[`COMPOSIO_AUTH_CONFIG_ID_${provider.toUpperCase()}`],
    allowedTools: this.getAllowedToolsForProvider(provider)
  }],
  { isChatAuth: true }
);

// Step 2: Get server URLs for specific user
const serverUrls = await this.composioClient.mcp.getServer(
  mcpConfig.id,
  entityId  // e.g., "user123@example.com"
);

// The serverUrls will contain the MCP server URL that handles auth automatically
// Example: https://mcp.composio.dev/composio/server/<UUID>/mcp?user_id=user123@example.com

// Step 3: Check connection status (optional but recommended)
const status = await this.composioClient.mcp.getUserConnectionStatus(
  mcpConfig.id,
  entityId
);

if (!status.connected) {
  // User needs to authenticate - redirect to Composio auth flow
  // The server URL will handle this automatically
}

// Return the server URLs for the frontend to use
return {
  success: true,
  serverUrl: serverUrls.url,
  connected: status.connected
};
```

### Key Implementation Notes

1. **MCP Configuration Creation**: Should be done once per provider and cached, not per user
2. **Server URLs**: These are user-specific and handle authentication automatically
3. **No OAuth Redirect**: The MCP server URL handles authentication internally
4. **Tool Access**: Tools are accessed through the MCP server, not direct API calls

## Tasks

- [ ] Research Composio dashboard to find authConfigIds
- [ ] Update environment variables with authConfigIds
- [ ] Refactor `ComposioIntegrationManager.initiateConnection()` to use MCP flow
- [ ] Update `ComposioMCPAdapter` to handle MCP servers properly
- [ ] Test OAuth flow with all three integrations (Gmail, Calendar, Slack)
- [ ] Update documentation with new environment variable requirements
- [ ] Write E2E tests for MCP integration flow

## Success Criteria

1. Users can successfully connect Gmail, Calendar, and Slack integrations
2. No validation errors in Composio SDK
3. MCP tools are properly accessible after connection
4. Connection status is accurately reflected in UI

## References

- [Composio MCP Documentation](https://docs.composio.dev/docs/mcp-overview)
- [MCP vs Standard OAuth Flow](https://docs.composio.dev/authentication/introduction)
- Current implementation: `backend/services/composio-integration-manager.ts`