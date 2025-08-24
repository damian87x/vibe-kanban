# Implementation Plan: Rebuild Integrations with Composio MCP

## Phase 1: Clean Up Existing Code (Day 1)

### 1.1 Remove Backend Integration Code
- [ ] Delete `/backend/services/composio-integration-manager.ts`
- [ ] Delete `/backend/services/oauth-service.ts`
- [ ] Delete `/backend/services/oauth-providers/` directory
- [ ] Delete `/backend/services/database-extensions.ts` (OAuth-related)
- [ ] Delete `/backend/services/composio-api-client.ts`
- [ ] Delete `/backend/services/provider-factory.ts` (integration parts)
- [ ] Remove integration routes from `/backend/trpc/routes/integrations/`
- [ ] Clean up integration-related imports from other files

### 1.2 Database Cleanup
- [ ] Drop existing tables:
  - `integrations`
  - `oauth_states`
  - `integration_configs` (if exists)
- [ ] Remove migration files related to integrations

## Phase 2: Set Up Prisma Infrastructure (Day 1)

### 2.1 Install Prisma
```bash
npm install prisma @prisma/client
npm install -D @types/node
```

### 2.2 Initialize Prisma
```bash
npx prisma init
```

### 2.3 Create Prisma Schema
- [ ] Add models from spec to `prisma/schema.prisma`
- [ ] Configure PostgreSQL connection
- [ ] Add proper indexes and constraints

### 2.4 Generate and Run Migrations
```bash
npx prisma migrate dev --name init_integrations
npx prisma generate
```

## Phase 3: Implement Core Services (Day 2)

### 3.1 Composio Client Service
- [ ] Create `/backend/services/composio/composio-client.service.ts`
- [ ] Implement core methods:
  - `createMCPServer()`
  - `getServerUrls()`
  - `checkConnectionStatus()`
  - `listConnectedAccounts()`
  - `executeAction()`

### 3.2 Integration Service
- [ ] Create `/backend/services/integrations/integration.service.ts`
- [ ] Implement business logic:
  - `listAvailableIntegrations()`
  - `initiateConnection()`
  - `completeConnection()`
  - `disconnectIntegration()`
  - `getConnectionStatus()`
  - `executeTool()`

### 3.3 OAuth State Service
- [ ] Create `/backend/services/oauth/oauth-state.service.ts`
- [ ] Implement OAuth state management:
  - `createState()`
  - `validateState()`
  - `cleanupExpiredStates()`

## Phase 4: Create tRPC Routes (Day 2)

### 4.1 Integration Router
- [ ] Create new `/backend/trpc/routes/integrations.ts`
- [ ] Implement endpoints:
  - `list` - Get all integrations with status
  - `connect` - Initiate OAuth connection
  - `complete` - Complete OAuth callback
  - `disconnect` - Remove integration
  - `executeTool` - Run Composio tools

### 4.2 Update tRPC App Router
- [ ] Import and add integration router to main router
- [ ] Ensure proper type exports

## Phase 5: Database Seed & Configuration (Day 3)

### 5.1 Create Setup Script
- [ ] Create `/backend/scripts/setup-integrations.ts`
- [ ] Add auth configurations for each provider:
  - Gmail
  - Google Calendar
  - Slack
  - Notion
  - GitHub

### 5.2 Environment Configuration
- [ ] Update `.env.example` with required variables
- [ ] Document how to get Composio auth config IDs

## Phase 6: Frontend Implementation (Day 3)

### 6.1 Update Integration Types
- [ ] Create `/types/integrations.ts` with new types
- [ ] Update any shared integration interfaces

### 6.2 Update Integration Screen
- [ ] Refactor `/app/integrations.tsx` to use new API
- [ ] Implement proper OAuth popup handling
- [ ] Add connection status polling
- [ ] Handle edge cases (popup blocked, timeout, etc.)

### 6.3 OAuth Callback Handler
- [ ] Create `/app/oauth/callback.tsx`
- [ ] Handle OAuth redirect
- [ ] Call complete endpoint
- [ ] Show success/error messages

## Phase 7: Testing & Validation (Day 4)

### 7.1 Manual Testing Checklist
- [ ] Test Gmail connection flow
- [ ] Test Calendar connection flow
- [ ] Test Slack connection flow
- [ ] Test connection persistence after refresh
- [ ] Test disconnect functionality
- [ ] Test multiple users don't interfere

### 7.2 Error Scenarios
- [ ] Test expired OAuth state
- [ ] Test invalid state parameter
- [ ] Test API failures
- [ ] Test network timeouts

### 7.3 Tool Execution Testing
- [ ] Test sending email via Gmail
- [ ] Test creating calendar event
- [ ] Test sending Slack message

## Phase 8: Documentation (Day 4)

### 8.1 Developer Documentation
- [ ] Document setup process
- [ ] Document environment variables
- [ ] Document troubleshooting steps

### 8.2 User Documentation
- [ ] Update user guide for integrations
- [ ] Document supported features per integration

## Code Examples for Quick Reference

### Example: Composio Client Method
```typescript
async checkConnectionStatus(serverId: string, userId: string): Promise<{
  connected: boolean;
  accountId?: string;
}> {
  try {
    const status = await this.composio.mcp.getUserConnectionStatus(
      userId,
      serverId
    );
    
    if (status.connected && status.connectedToolkits) {
      const accounts = await this.composio.connectedAccounts.list({
        clientUniqueUserId: userId
      });
      
      const activeAccount = accounts.items.find(
        acc => acc.status === 'ACTIVE'
      );
      
      return {
        connected: true,
        accountId: activeAccount?.id
      };
    }
    
    return { connected: false };
  } catch (error) {
    logger.error('Failed to check connection status', { error });
    return { connected: false };
  }
}
```

### Example: tRPC Route
```typescript
connect: protectedProcedure
  .input(z.object({
    provider: z.enum(['gmail', 'calendar', 'slack', 'notion', 'github']),
  }))
  .mutation(async ({ ctx, input }) => {
    const result = await integrationService.initiateConnection(
      ctx.user.id,
      input.provider
    );
    
    return {
      success: true,
      authUrl: result.authUrl,
      state: result.state,
      needsAuth: result.needsAuth,
      connected: result.connected
    };
  }),
```

### Example: Frontend Connection Handler
```typescript
const handleConnect = async (provider: string) => {
  try {
    setConnecting(provider);
    const result = await connectMutation.mutateAsync({ provider });
    
    if (result.needsAuth && result.authUrl) {
      // Save state for verification
      localStorage.setItem('oauth_state', result.state);
      
      // Open OAuth popup
      const popup = window.open(
        result.authUrl,
        'oauth',
        'width=600,height=700,left=100,top=100'
      );
      
      // Listen for completion
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          // Trigger refresh after small delay
          setTimeout(() => refetch(), 1000);
        }
      }, 500);
    } else if (result.connected) {
      showToast(`${provider} is already connected!`);
    }
  } catch (error) {
    showError(`Failed to connect ${provider}`);
  } finally {
    setConnecting(null);
  }
};
```

## Timeline
- **Day 1**: Cleanup & Prisma setup
- **Day 2**: Core services & tRPC routes
- **Day 3**: Database seed & Frontend
- **Day 4**: Testing & Documentation

Total estimated time: 4 days for complete rebuild