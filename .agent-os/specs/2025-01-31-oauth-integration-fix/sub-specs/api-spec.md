    # API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-01-31-oauth-integration-fix/spec.md

> Created: 2025-01-31
> Version: 1.0.0

## API Changes

### Modified Endpoints

#### POST /api/trpc/integrations.completeOAuth.complete

**Purpose:** Check if OAuth flow is complete and update integration status

**Current Issues:**
- Uses wrong Composio API (connectedAccounts.get instead of MCP API)
- Passes connectedAccountId when it should use entityId + provider

**Changes Required:**
```typescript
// Before
const connectionStatus = await integrationManager.getConnectionStatus(
  input.instanceId  // Wrong - this is connectedAccountId
);

// After
const connectionStatus = await integrationManager.getConnectionStatus(
  ctx.user.id,      // entityId (user ID)
  input.provider    // provider name (gmail/calendar/slack)
);
```

**Response Format:** No change
```json
{
  "success": true|false,
  "message": "OAuth completed successfully",
  "instanceId": "updated-nano-id"  // Return updated ID if changed
}
```

### No New Endpoints Required

All fixes are to existing endpoints:
- `/api/trpc/integrations.oauth.initiate` - No changes needed
- `/api/trpc/integrations.disconnect` - Already correct, just needs error handling
- `/api/trpc/integrations.list` - No changes needed

## Error Handling Improvements

### Standard Error Response Format

All OAuth endpoints should return consistent error format:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "OAUTH_TIMEOUT|INVALID_PROVIDER|CONNECTION_FAILED",
  "details": {
    "provider": "gmail",
    "userId": "user-id",
    "timestamp": "2025-01-31T10:00:00Z"
  }
}
```

### Error Codes

- `OAUTH_TIMEOUT` - OAuth flow didn't complete in time
- `INVALID_PROVIDER` - Unknown provider specified
- `CONNECTION_FAILED` - Composio API error
- `ALREADY_CONNECTED` - Integration already exists
- `NOT_FOUND` - Integration not found for disconnect

## API Client Updates

Frontend needs to handle new error format:
```typescript
if (!result.success) {
  if (result.code === 'ALREADY_CONNECTED') {
    // Just refresh the list
  } else {
    // Show error to user
    Alert.alert('Error', result.error);
  }
}
```