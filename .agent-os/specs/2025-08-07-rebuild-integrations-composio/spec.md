# Rebuild Integrations System with Composio MCP

## Overview
Complete rebuild of the integration system using Composio MCP (Model Context Protocol) with proper Prisma models, clean architecture, and following Composio best practices.

## Goals
1. Remove all existing integration-related code from backend
2. Drop existing integration tables from database
3. Implement clean Prisma-based data models
4. Build new integration system following Composio MCP documentation
5. Ensure proper OAuth flow and connection persistence

## Current Issues to Solve
- Multiple accounts error when connecting integrations
- Connection status not persisting after page refresh
- Inconsistent account ID storage
- Mixed implementation between Klavis and Composio

## Technical Requirements

### Database Schema (Prisma)
```prisma
// prisma/schema.prisma

model AuthConfig {
  id                String   @id @default(uuid())
  provider          String   // gmail, calendar, slack, etc.
  composioAuthId    String   @unique // Composio auth config ID (e.g., ac_auth_12)
  displayName       String
  icon              String?
  description       String?
  requiredScopes    String[] // Array of required OAuth scopes
  allowedTools      String[] // Array of allowed Composio tools
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  mcpServers        MCPServer[]
  
  @@index([provider])
}

model MCPServer {
  id                String   @id @default(uuid())
  authConfigId      String
  composioServerId  String   @unique // Composio MCP server ID
  name              String
  description       String?
  isChatAuth        Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  authConfig        AuthConfig @relation(fields: [authConfigId], references: [id])
  userConnections   UserConnection[]
  
  @@index([authConfigId])
  @@index([composioServerId])
}

model UserConnection {
  id                String   @id @default(uuid())
  userId            String   // User ID from auth system
  mcpServerId       String
  provider          String   // Denormalized for quick queries
  composioAccountId String   // Connected account ID from Composio
  composioEntityId  String   // Entity ID (usually same as userId)
  status            ConnectionStatus @default(PENDING)
  connectedAt       DateTime?
  lastUsedAt        DateTime?
  lastSyncedAt      DateTime?
  metadata          Json?    // Store any additional provider-specific data
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  mcpServer         MCPServer @relation(fields: [mcpServerId], references: [id])
  toolExecutions    ToolExecution[]
  
  @@unique([userId, provider])
  @@index([userId])
  @@index([composioAccountId])
  @@index([status])
}

enum ConnectionStatus {
  PENDING
  ACTIVE
  INACTIVE
  FAILED
  REVOKED
}

model ToolExecution {
  id                String   @id @default(uuid())
  connectionId      String
  toolName          String
  parameters        Json
  response          Json?
  status            ExecutionStatus @default(PENDING)
  error             String?
  executedAt        DateTime @default(now())
  duration          Int?     // Execution time in milliseconds
  
  connection        UserConnection @relation(fields: [connectionId], references: [id])
  
  @@index([connectionId])
  @@index([toolName])
  @@index([executedAt])
}

enum ExecutionStatus {
  PENDING
  SUCCESS
  FAILED
}

// OAuth state management for secure flow
model OAuthState {
  id                String   @id @default(uuid())
  state             String   @unique
  userId            String
  provider          String
  redirectUri       String
  expiresAt         DateTime
  createdAt         DateTime @default(now())
  
  @@index([userId, provider])
  @@index([expiresAt])
}
```

### Backend Architecture

#### 1. Core Services

```typescript
// backend/services/composio/composio-client.service.ts
import { Composio } from '@composio/core';
import { PrismaClient } from '@prisma/client';

export class ComposioClientService {
  private composio: Composio;
  private prisma: PrismaClient;
  
  constructor() {
    this.composio = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY!,
      allowTracking: false,
      allowTracing: false
    });
  }
  
  // Core methods for interacting with Composio API
  async createMCPServer(authConfigId: string, name: string, allowedTools: string[]) {}
  async getServerUrls(serverId: string, userId: string) {}
  async checkConnectionStatus(serverId: string, userId: string) {}
  async executeAction(accountId: string, toolName: string, parameters: any) {}
}
```

```typescript
// backend/services/integrations/integration.service.ts
export class IntegrationService {
  constructor(
    private composioClient: ComposioClientService,
    private prisma: PrismaClient
  ) {}
  
  async listAvailableIntegrations(userId: string) {}
  async initiateConnection(userId: string, provider: string) {}
  async completeConnection(userId: string, provider: string, accountId: string) {}
  async disconnectIntegration(userId: string, provider: string) {}
  async getConnectionStatus(userId: string, provider: string) {}
  async executeTool(userId: string, provider: string, toolName: string, params: any) {}
}
```

#### 2. tRPC Routes

```typescript
// backend/trpc/routes/integrations.ts
export const integrationsRouter = router({
  // List all available integrations with connection status
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return integrationService.listAvailableIntegrations(ctx.user.id);
    }),
  
  // Initiate OAuth connection
  connect: protectedProcedure
    .input(z.object({
      provider: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return integrationService.initiateConnection(ctx.user.id, input.provider);
    }),
  
  // Complete OAuth connection (callback)
  complete: protectedProcedure
    .input(z.object({
      provider: z.string(),
      state: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return integrationService.completeConnection(
        ctx.user.id, 
        input.provider,
        input.state
      );
    }),
  
  // Disconnect integration
  disconnect: protectedProcedure
    .input(z.object({
      provider: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return integrationService.disconnectIntegration(ctx.user.id, input.provider);
    }),
  
  // Execute tool
  executeTool: protectedProcedure
    .input(z.object({
      provider: z.string(),
      toolName: z.string(),
      parameters: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      return integrationService.executeTool(
        ctx.user.id,
        input.provider,
        input.toolName,
        input.parameters
      );
    }),
});
```

### Integration Flow

#### 1. Initial Setup (One-time)
```typescript
// backend/scripts/setup-integrations.ts
async function setupIntegrations() {
  // 1. Create auth configs for each provider
  const providers = [
    {
      provider: 'gmail',
      displayName: 'Gmail',
      composioAuthId: process.env.COMPOSIO_AUTH_CONFIG_GMAIL,
      allowedTools: [
        'GMAIL_FETCH_EMAILS',
        'GMAIL_SEND_EMAIL',
        'GMAIL_CREATE_EMAIL_DRAFT',
        'GMAIL_SEARCH_EMAILS',
      ]
    },
    // ... other providers
  ];
  
  // 2. Create MCP servers for each auth config
  for (const provider of providers) {
    const authConfig = await prisma.authConfig.create({
      data: provider
    });
    
    const mcpServer = await composioClient.createMCPServer(
      authConfig.composioAuthId,
      `${provider.displayName} MCP Server`,
      provider.allowedTools
    );
    
    await prisma.mcpServer.create({
      data: {
        authConfigId: authConfig.id,
        composioServerId: mcpServer.id,
        name: mcpServer.name,
      }
    });
  }
}
```

#### 2. OAuth Connection Flow
```typescript
// Step 1: User initiates connection
async initiateConnection(userId: string, provider: string) {
  // Get MCP server for provider
  const server = await prisma.mcpServer.findFirst({
    where: { authConfig: { provider } },
    include: { authConfig: true }
  });
  
  // Check if already connected
  const existing = await prisma.userConnection.findUnique({
    where: { userId_provider: { userId, provider } }
  });
  
  if (existing?.status === 'ACTIVE') {
    // Verify with Composio
    const status = await composioClient.checkConnectionStatus(
      server.composioServerId,
      userId
    );
    
    if (status.connected) {
      return { connected: true, needsAuth: false };
    }
  }
  
  // Generate OAuth URL
  const serverUrls = await composioClient.getServerUrls(
    server.composioServerId,
    userId
  );
  
  // Create OAuth state
  const state = crypto.randomUUID();
  await prisma.oAuthState.create({
    data: {
      state,
      userId,
      provider,
      redirectUri: `${process.env.FRONTEND_URL}/oauth/callback`,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    }
  });
  
  return {
    authUrl: serverUrls.authUrl,
    state,
    needsAuth: true
  };
}

// Step 2: Complete connection after OAuth
async completeConnection(userId: string, provider: string, state: string) {
  // Verify OAuth state
  const oauthState = await prisma.oAuthState.findUnique({
    where: { state },
  });
  
  if (!oauthState || oauthState.userId !== userId || oauthState.expiresAt < new Date()) {
    throw new Error('Invalid or expired OAuth state');
  }
  
  // Get connected accounts from Composio
  const accounts = await composioClient.listConnectedAccounts(userId);
  const activeAccount = accounts.find(
    acc => acc.appName === provider && acc.status === 'ACTIVE'
  );
  
  if (!activeAccount) {
    throw new Error('No active account found');
  }
  
  // Create or update connection
  await prisma.userConnection.upsert({
    where: { userId_provider: { userId, provider } },
    create: {
      userId,
      provider,
      mcpServerId: server.id,
      composioAccountId: activeAccount.id,
      composioEntityId: userId,
      status: 'ACTIVE',
      connectedAt: new Date(),
    },
    update: {
      composioAccountId: activeAccount.id,
      status: 'ACTIVE',
      connectedAt: new Date(),
      lastSyncedAt: new Date(),
    }
  });
  
  // Clean up OAuth state
  await prisma.oAuthState.delete({ where: { id: oauthState.id } });
  
  return { success: true };
}
```

### Frontend Integration

```typescript
// app/integrations.tsx
export default function IntegrationsScreen() {
  const { data: integrations, refetch } = trpc.integrations.list.useQuery();
  const connectMutation = trpc.integrations.connect.useMutation();
  const disconnectMutation = trpc.integrations.disconnect.useMutation();
  
  const handleConnect = async (provider: string) => {
    const result = await connectMutation.mutateAsync({ provider });
    
    if (result.needsAuth && result.authUrl) {
      // Open OAuth popup
      const popup = window.open(result.authUrl, 'oauth', 'width=600,height=700');
      
      // Poll for completion
      const checkInterval = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(checkInterval);
          // Check if connection was successful
          await refetch();
        }
      }, 1000);
    } else if (result.connected) {
      // Already connected
      showToast('Already connected!');
    }
  };
  
  const handleDisconnect = async (provider: string) => {
    await disconnectMutation.mutateAsync({ provider });
    await refetch();
  };
  
  return (
    // UI implementation
  );
}
```

## Migration Plan

### Phase 1: Database Migration
1. Create new Prisma schema file
2. Generate Prisma migrations
3. Run migrations to create new tables
4. Migrate any existing connection data if needed

### Phase 2: Backend Implementation
1. Remove all existing integration-related code
2. Implement new services following the architecture above
3. Create tRPC routes
4. Set up integration configurations

### Phase 3: Frontend Updates
1. Update integration screens to use new API
2. Implement proper OAuth flow handling
3. Add error handling and loading states

### Phase 4: Testing
1. Test OAuth flow for each provider
2. Verify connection persistence
3. Test tool execution
4. Test disconnection flow

## Success Criteria
1. No "multiple accounts" errors
2. Connection status persists after page refresh
3. Clean separation between providers
4. Proper error handling
5. All integrations work consistently

## Environment Variables Required
```env
# Composio
COMPOSIO_API_KEY=your_api_key

# Auth Config IDs (from Composio dashboard)
COMPOSIO_AUTH_CONFIG_GMAIL=ac_xxx
COMPOSIO_AUTH_CONFIG_CALENDAR=ac_xxx
COMPOSIO_AUTH_CONFIG_SLACK=ac_xxx
COMPOSIO_AUTH_CONFIG_NOTION=ac_xxx
COMPOSIO_AUTH_CONFIG_GITHUB=ac_xxx

# Frontend
FRONTEND_URL=http://localhost:8081
```