# Fix OAuth Multiple Accounts and Connection Persistence Issue

## Problem Statement

When users try to connect Gmail (or other integrations) via OAuth, they encounter two critical issues:

1. **Multiple Connected Accounts Error**: When clicking connect, Composio throws error: "Multiple connected accounts found for user {userId} in auth config {authConfigId}". This happens because:
   - Composio's `connectedAccounts.initiate` with `allowMultiple: false` detects existing connections
   - But our UI doesn't properly reflect the connected state
   - Users attempt to reconnect when a connection already exists

2. **Lost Connection State on Refresh**: When refreshing the page, integrations show as disconnected even though they're actually connected in Composio. This happens because:
   - The integration status check fails to properly sync with Composio
   - Missing or incorrect account IDs prevent status synchronization
   - The UI defaults to showing "Connect" button when status is unknown

## Root Cause Analysis

### Issue 1: Multiple Accounts Error

1. **Incomplete OAuth Flow**: When a user clicks connect but blocks the popup:
   - OAuth is initiated in Composio (creates a pending connection)
   - User never completes the flow
   - Retry attempts fail because Composio sees the pending connection

2. **No Cleanup for Failed Attempts**: The system doesn't:
   - Clean up failed/incomplete OAuth attempts
   - Check if existing connections are actually active before initiating new ones
   - Handle the specific "multiple accounts" error gracefully

### Issue 2: Connection Persistence

1. **Missing Account IDs**: Integration records have warnings about missing account IDs:
   ```
   Integration missing account ID | Context: {"service":"gmail","integrationId":"ca99f820-6b5b-47f4-b76f-3f8b60d09078","config":{"oauth_provider":"composio-v2","oauth_initiated_at":"2025-08-06T19:26:10.555Z"}}
   ```

2. **Incomplete Integration Creation**: When OAuth is initiated:
   - Integration record is created with minimal data
   - `composio_account_id` is not set until OAuth completes
   - Without this ID, status checks fail

3. **Status Sync Failure**: The `listIntegrations` endpoint tries to sync status but:
   - Can't find Composio account without the account ID
   - Falls back to showing integration as disconnected
   - User sees "Connect" button even for connected services

## Technical Solution

### Phase 1: Improve OAuth Initiation Flow

1. **Check and Clean Existing Connections**
   ```typescript
   // In ComposioIntegrationManager.initiateConnection()
   async initiateConnection(provider, entityId, redirectUrl) {
     // First, check ALL existing connections for this user/provider
     const existingAccounts = await this.getAllConnectedAccounts(entityId, provider);
     
     // If we have any existing accounts, verify they're actually active
     for (const account of existingAccounts) {
       if (account.status === 'ACTIVE') {
         // Return existing active connection
         return { 
           redirectUrl: '', 
           connectionId: account.id 
         };
       } else if (account.status === 'PENDING' || account.status === 'FAILED') {
         // Clean up incomplete connections
         await this.disconnectAccount(account.id);
       }
     }
     
     // Now safe to create new connection
     const connectionRequest = await this.composioClient.connectedAccounts.initiate(
       entityId, 
       authConfigId,
       { allowMultiple: false }
     );
     
     return {
       redirectUrl: connectionRequest.redirectUrl,
       connectionId: connectionRequest.connectedAccountId
     };
   }
   ```

2. **Add Helper Methods**
   ```typescript
   // Get all connected accounts for a user/provider combo
   async getAllConnectedAccounts(entityId: string, provider: string) {
     const authConfigId = this.getAuthConfigId(provider);
     return await this.composioClient.connectedAccounts.list({
       entityId,
       authConfigId
     });
   }
   
   // Clean up a specific account
   async disconnectAccount(accountId: string) {
     try {
       await this.composioClient.connectedAccounts.disconnect(accountId);
       return true;
     } catch (error) {
       logger.warn('Failed to disconnect account', { accountId, error });
       return false;
     }
   }
   ```

### Phase 2: Fix Connection Persistence

1. **Store Account ID During OAuth Initiation**
   ```typescript
   // In oauth.ts initiateOAuth endpoint
   const result = await oauthService.initiateOAuth(service, userId, scopes);
   
   if (result.success && result.connectionId) {
     // Create or update integration with connection ID immediately
     await database.upsertIntegration({
       userId,
       service,
       status: 'pending',
       config: {
         oauth_provider: 'composio-v2',
         composio_account_id: result.connectionId,
         oauth_initiated_at: new Date().toISOString()
       }
     });
   }
   ```

2. **Improve Status Synchronization**
   ```typescript
   // In manage.ts listIntegrations
   for (const integration of integrations) {
     // Try multiple fields for account ID
     const accountId = 
       integration.config?.composio_account_id || 
       integration.config?.server_instance_id ||
       integration.config?.connectionId;
     
     if (!accountId && integration.status !== 'inactive') {
       // If no account ID but marked as active, check by entity ID
       const connections = await composioManager.getAllConnectedAccounts(
         ctx.user.id, 
         integration.service
       );
       
       if (connections.length > 0) {
         const activeConnection = connections.find(c => c.status === 'ACTIVE');
         if (activeConnection) {
           // Update integration with found account ID
           await database.updateIntegration(integration.id, {
             config: {
               ...integration.config,
               composio_account_id: activeConnection.id
             }
           });
           integration.config.composio_account_id = activeConnection.id;
         }
       }
     }
   }
   ```

### Phase 3: Handle Edge Cases

1. **Graceful Error Handling**
   ```typescript
   // In ComposioOAuthProvider
   catch (error) {
     if (error.message?.includes('Multiple connected accounts found')) {
       // Handle multiple accounts error specifically
       logger.info('Multiple accounts detected, attempting cleanup');
       
       // Get all accounts and keep only the most recent active one
       const accounts = await this.integrationManager.getAllConnectedAccounts(
         userId, 
         provider
       );
       
       const activeAccounts = accounts
         .filter(a => a.status === 'ACTIVE')
         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
       
       if (activeAccounts.length > 0) {
         // Use the most recent active account
         return {
           success: true,
           already_connected: true,
           instance_id: activeAccounts[0].id
         };
       }
       
       // Clean up all non-active accounts
       for (const account of accounts) {
         if (account.status !== 'ACTIVE') {
           await this.integrationManager.disconnectAccount(account.id);
         }
       }
       
       // Retry initiation after cleanup
       return await this.initiateOAuth(provider, userId, scopes);
     }
     
     // Re-throw other errors
     throw error;
   }
   ```

2. **Add Retry Logic for Blocked Popups**
   ```typescript
   // In frontend integrations.tsx
   const handleRetryConnection = async (service: string) => {
     // Clear any existing OAuth state
     await clearOAuthState();
     
     // Reset connection tracking
     setOauthInProgress(prev => {
       const updated = new Map(prev);
       updated.delete(service);
       return updated;
     });
     
     // Force refresh integration status
     await refetch();
     
     // Retry connection
     await handleConnect(service);
   };
   ```

## Implementation Plan

### Step 1: Backend OAuth Flow Improvements
1. Add `getAllConnectedAccounts` method to ComposioIntegrationManager
2. Add cleanup logic in `initiateConnection` for pending/failed accounts
3. Handle "multiple accounts" error with automatic cleanup and retry

### Step 2: Fix Connection Persistence
1. Update OAuth initiation to store account ID immediately
2. Add `upsertIntegration` method to database service
3. Improve account ID discovery in status sync

### Step 3: Frontend Improvements
1. Add retry mechanism for failed OAuth attempts
2. Clear OAuth state on retry
3. Show better error messages for specific failures

### Step 4: Testing
1. Test OAuth flow with popup blocker enabled
2. Test page refresh after successful connection
3. Test multiple connection attempts
4. Verify status sync works correctly

## Success Criteria

1. **No Multiple Account Errors**: Users can retry OAuth connection without errors
2. **Persistent Connection Status**: Page refresh maintains correct connection status
3. **Graceful Error Handling**: Clear messages and retry options for failures
4. **Automatic Cleanup**: Failed/pending connections cleaned up automatically
5. **Accurate Status Display**: UI always reflects true Composio connection state

## Migration Notes

- No database schema changes required
- Existing integrations will get account IDs on next status check
- Backward compatible with existing OAuth flows