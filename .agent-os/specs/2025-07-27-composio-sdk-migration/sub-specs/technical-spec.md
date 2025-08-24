# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-07-27-composio-sdk-migration/spec.md

> Created: 2025-07-27
> Version: 1.0.0

## Technical Requirements

- **Package Update**: Replace `composio-core` dependency with `@composio/core@next` in package.json
- **TypeScript Support**: Leverage improved TypeScript definitions in the new SDK for better type safety
- **API Compatibility**: Ensure all existing functionality maps correctly to new SDK methods
- **Breaking Changes**: Handle all breaking changes including terminology updates (entity_ids → user_ids)
- **Environment Variables**: Maintain compatibility with existing environment variable structure
- **Error Handling**: Update error handling to match new SDK error patterns and response structures
- **Performance**: Verify that new SDK maintains or improves current response times

## Approach Options

**Option A: Big Bang Migration**
- Pros: Clean cutover, no mixed SDK usage, simpler testing
- Cons: Higher risk, requires comprehensive testing before deployment

**Option B: Gradual Migration with Feature Flags** (Selected)
- Pros: Lower risk, ability to rollback per integration, production validation in stages
- Cons: Temporary code complexity, requires feature flag infrastructure

**Rationale:** Given the production environment and the critical nature of OAuth integrations, a gradual migration allows us to validate each integration independently and rollback if issues arise without affecting all users.

## External Dependencies

- **@composio/core@next** - The new Composio SDK (preview/beta version)
- **Justification:** Required migration as the current `composio-core` SDK is being deprecated and will be sunset within months. The new SDK provides better stability, performance, and ongoing support.

## Migration Steps

### 1. SDK Installation and Setup
```bash
npm install @composio/core@next
npm uninstall composio-core
```

### 2. Import Updates
```typescript
// Old
import { Composio } from 'composio-core';

// New
import { Composio } from '@composio/core';
```

### 3. Client Initialization Changes
```typescript
// Old
this.composioClient = new Composio(this.apiKey);

// New
this.composioClient = new Composio({
  apiKey: this.apiKey,
  // Additional configuration options if needed
});
```

### 4. Method Signature Updates

**Execute Tool:**
```typescript
// Old
const response = await this.composioClient.actions.execute({
  actionName: toolName,
  requestBody: {
    input: parameters,
    connectedAccountId: accountId,
  }
});

// New (estimated based on patterns)
const response = await this.composioClient.tools.execute({
  toolName: toolName,
  userId: accountId, // Note: terminology change
  input: parameters,
});
```

**List Tools:**
```typescript
// Old
const actions = await this.composioClient.actions.list({
  apps: appName,
  useCase: null
});

// New
const tools = await this.composioClient.tools.list({
  appName: appName,
  // Additional filters if needed
});
```

**OAuth Flow:**
```typescript
// Old
const connectionRequest = await this.composioClient.connectedAccounts.initiate({
  integrationId,
  entityId: entityId,
  redirectUri: redirectUrl
});

// New
const connectionRequest = await this.composioClient.auth.initiate({
  authConfigId: integrationId, // Note: possible field name change
  userId: entityId, // Note: entity_id → user_id
  redirectUrl: redirectUrl
});
```

### 5. Environment Variable Updates

The following environment variables need to be added to production configurations:
- `COMPOSIO_INTEGRATION_ID_GMAIL` - Already in .env, needs to be added to cloudbuild.yaml
- `COMPOSIO_INTEGRATION_ID_CALENDAR` - Already in .env, needs to be added to cloudbuild.yaml
- `COMPOSIO_INTEGRATION_ID_SLACK` - Already in .env, needs to be added to cloudbuild.yaml

### 6. Error Handling Updates

The new SDK may have different error structures. We need to update error handling patterns:
```typescript
try {
  // API call
} catch (error) {
  // Check for new error structure and map appropriately
  if (error.code === 'NEW_ERROR_CODE') {
    // Handle specific error
  }
}
```

## Performance Considerations

- The new SDK claims improved performance, but we should benchmark:
  - OAuth flow completion time
  - Tool execution response time
  - Connection status check latency
- Monitor memory usage changes with the new SDK
- Verify connection pooling behavior remains optimal

## Rollback Plan

If issues arise during migration:
1. Use feature flags to disable new SDK usage per integration
2. Revert to `composio-core` dependency if critical issues found
3. Maintain both SDKs temporarily during transition period
4. Document any workarounds needed for old SDK issues