# Composio MCP Implementation Specification

> Feature: Complete Composio MCP Server Integration
> Created: 2025-01-31
> Status: Ready for Implementation

## Overview

This specification outlines the complete implementation of Composio MCP (Model Context Protocol) servers to replace the old Composio library integration. The goal is to provide a robust, scalable solution for managing OAuth integrations and tool execution through MCP servers.

## Problem Statement

### Current Issues
1. **Legacy Library**: Using outdated Composio SDK patterns
2. **Complex OAuth Flows**: Manual handling of authentication states
3. **No MCP Support**: Missing benefits of standardized Model Context Protocol
4. **UUID Migration**: Old UUID format needs migration to new NanoID format
5. **Tool Management**: Difficult to manage and limit available tools per integration

### Business Impact
- Developers struggle with complex OAuth implementation
- Authentication errors cause user frustration
- Limited visibility into available tools
- Difficult to scale integrations

## Goals

### Primary Goals
1. Implement complete Composio MCP server architecture
2. Migrate from old SDK patterns to MCP-based approach
3. Provide seamless OAuth flow with automatic connection management
4. Enable tool limiting and management per integration
5. Support both Claude Desktop and programmatic access

### Success Metrics
- Zero OAuth failures due to implementation issues
- 50% reduction in integration setup time
- 100% compatibility with existing integrations
- Real-time connection status monitoring

## Technical Specification

### Architecture Overview

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Your Application  │────▶│  Composio MCP    │────▶│  External APIs  │
│                     │     │     Servers      │     │  (Gmail, etc)   │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────────┐     ┌──────────────────┐
│   MCP Clients       │     │   Composio API   │
│ (Claude, Cursor)    │     │                  │
└─────────────────────┘     └──────────────────┘
```

### Core Components

#### 1. MCP Server Manager
```typescript
interface MCPServerManager {
  create(config: MCPServerConfig): Promise<MCPServer>;
  get(serverId: string): Promise<MCPServer>;
  list(): Promise<MCPServer[]>;
  delete(serverId: string): Promise<void>;
}

interface MCPServerConfig {
  name: string;
  provider: 'gmail' | 'calendar' | 'slack' | 'notion' | 'github';
  authConfigId: string;
  allowedTools: string[];
  options: {
    isChatAuth: boolean;
    maxConnections?: number;
  };
}
```

#### 2. Connection Manager
```typescript
interface ConnectionManager {
  initiate(provider: string, userId: string): Promise<OAuthFlow>;
  check(connectionId: string): Promise<ConnectionStatus>;
  list(userId: string): Promise<Connection[]>;
  disconnect(connectionId: string): Promise<void>;
}

interface OAuthFlow {
  redirectUrl: string;
  connectionId: string;
  state: string;
}

interface ConnectionStatus {
  connected: boolean;
  authenticated: boolean;
  provider: string;
  accountInfo?: {
    email?: string;
    name?: string;
  };
}
```

#### 3. Tool Executor
```typescript
interface ToolExecutor {
  execute(
    connectionId: string,
    toolName: string,
    parameters: Record<string, any>
  ): Promise<ToolResult>;
  
  listAvailable(provider: string): Promise<Tool[]>;
  validate(toolName: string, parameters: any): ValidationResult;
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    rateLimitInfo?: RateLimitInfo;
  };
}
```

### Implementation Plan

#### Phase 1: Core Infrastructure (Week 1)

**1.1 Environment Setup**
```bash
# Required environment variables
COMPOSIO_API_KEY=your_api_key
COMPOSIO_INTEGRATION_ID_GMAIL=xxx
COMPOSIO_INTEGRATION_ID_CALENDAR=xxx
COMPOSIO_INTEGRATION_ID_SLACK=xxx
COMPOSIO_INTEGRATION_ID_NOTION=xxx
COMPOSIO_INTEGRATION_ID_GITHUB=xxx
```

**1.2 Base Classes**
```typescript
// File: backend/services/mcp/composio-mcp-manager.ts
export class ComposioMCPManager {
  private client: Composio;
  private serverCache: Map<string, MCPServer>;
  
  constructor(config: ComposioConfig) {
    this.client = new Composio({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.composio.dev',
      options: {
        timeout: 30000,
        retries: 3
      }
    });
  }
  
  async createServer(config: MCPServerConfig): Promise<MCPServer> {
    // Implementation
  }
}
```

**1.3 Migration Utilities**
```typescript
// File: backend/services/mcp/migration-utils.ts
export class UUIDToNanoIDMigrator {
  async migrate(oldId: string, userId: string, provider: string): Promise<string> {
    // Check if already migrated
    // Find new NanoID
    // Update database
    // Return new ID
  }
}
```

#### Phase 2: OAuth Flow Implementation (Week 2)

**2.1 OAuth Initiation**
```typescript
// File: backend/trpc/routes/integrations/mcp-oauth.ts
export const mcpOAuthRouter = createTRPCRouter({
  initiate: protectedProcedure
    .input(z.object({
      provider: z.enum(['gmail', 'calendar', 'slack', 'notion', 'github']),
      redirectUrl: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const manager = new ComposioMCPManager();
      
      // Check existing connections
      const existing = await manager.checkExistingConnection(
        input.provider,
        ctx.user.id
      );
      
      if (existing.connected) {
        return { 
          success: true, 
          connectionId: existing.connectionId,
          alreadyConnected: true 
        };
      }
      
      // Initiate new connection
      const flow = await manager.initiateOAuth(
        input.provider,
        ctx.user.id,
        input.redirectUrl
      );
      
      return {
        success: true,
        redirectUrl: flow.redirectUrl,
        connectionId: flow.connectionId
      };
    })
});
```

**2.2 OAuth Callback Handler**
```typescript
// File: backend/trpc/routes/integrations/mcp-callback.ts
export const handleOAuthCallback = async (req: Request) => {
  const { code, state, error } = req.query;
  
  if (error) {
    // Handle OAuth errors
    return redirectToError(error);
  }
  
  // Verify state
  const stateData = await verifyOAuthState(state);
  
  // Exchange code for connection
  const connection = await manager.completeOAuth(code, stateData);
  
  // Save to database
  await database.createIntegration({
    userId: stateData.userId,
    provider: stateData.provider,
    connectionId: connection.id,
    status: 'active'
  });
  
  return redirectToSuccess();
};
```

#### Phase 3: Tool Execution System (Week 3)

**3.1 Tool Registry**
```typescript
// File: backend/services/mcp/tool-registry.ts
export const TOOL_REGISTRY = {
  gmail: {
    send: {
      name: 'GMAIL_SEND_EMAIL',
      schema: z.object({
        to: z.string().email(),
        subject: z.string(),
        body: z.string(),
        cc: z.string().email().optional(),
        bcc: z.string().email().optional(),
        attachments: z.array(z.any()).optional()
      })
    },
    fetch: {
      name: 'GMAIL_FETCH_EMAILS',
      schema: z.object({
        maxResults: z.number().default(10),
        query: z.string().optional(),
        labelIds: z.array(z.string()).optional()
      })
    }
    // ... more tools
  },
  calendar: {
    create: {
      name: 'CALENDAR_CREATE_EVENT',
      schema: z.object({
        summary: z.string(),
        start: z.object({
          dateTime: z.string(),
          timeZone: z.string().optional()
        }),
        end: z.object({
          dateTime: z.string(),
          timeZone: z.string().optional()
        }),
        attendees: z.array(z.object({
          email: z.string().email()
        })).optional()
      })
    }
    // ... more tools
  }
};
```

**3.2 Tool Executor**
```typescript
// File: backend/services/mcp/tool-executor.ts
export class MCPToolExecutor {
  async execute(
    connectionId: string,
    toolName: string,
    parameters: any
  ): Promise<ToolResult> {
    // Validate tool exists
    const tool = this.getToolDefinition(toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    
    // Validate parameters
    const validation = tool.schema.safeParse(parameters);
    if (!validation.success) {
      throw new Error(`Invalid parameters: ${validation.error}`);
    }
    
    // Execute with timeout and retry
    return this.executeWithRetry(async () => {
      const result = await this.client.actions.execute({
        actionName: toolName,
        requestBody: {
          connectedAccountId: connectionId,
          input: validation.data
        }
      });
      
      return {
        success: true,
        data: result.data,
        metadata: {
          executionTime: result.executionTime,
          rateLimitInfo: result.rateLimitInfo
        }
      };
    });
  }
}
```

#### Phase 4: MCP Client Support (Week 4)

**4.1 MCP Server Endpoint**
```typescript
// File: backend/services/mcp/server-endpoint.ts
export class MCPServerEndpoint {
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    switch (request.method) {
      case 'tools/list':
        return this.listTools(request.params);
      
      case 'tools/execute':
        return this.executeTool(request.params);
      
      case 'connection/status':
        return this.getConnectionStatus(request.params);
      
      default:
        throw new Error(`Unknown method: ${request.method}`);
    }
  }
}
```

**4.2 Claude Desktop Integration**
```typescript
// File: backend/config/mcp-claude-config.ts
export const generateClaudeConfig = (userId: string) => {
  return {
    "mcpServers": {
      "composio-gmail": {
        "command": "npx",
        "args": ["@composio/mcp", "gmail", "--user", userId],
        "env": {
          "COMPOSIO_API_KEY": process.env.COMPOSIO_API_KEY
        }
      },
      "composio-calendar": {
        "command": "npx",
        "args": ["@composio/mcp", "calendar", "--user", userId],
        "env": {
          "COMPOSIO_API_KEY": process.env.COMPOSIO_API_KEY
        }
      }
    }
  };
};
```

### API Examples

#### Example 1: Complete OAuth Flow
```typescript
// 1. Initiate OAuth
const { data } = await trpc.integrations.mcp.initiate.mutate({
  provider: 'gmail',
  redirectUrl: 'https://app.example.com/integrations/callback'
});

if (data.alreadyConnected) {
  console.log('Gmail already connected!');
} else {
  // Redirect user to OAuth URL
  window.location.href = data.redirectUrl;
}

// 2. After OAuth callback
const status = await trpc.integrations.mcp.status.query({
  provider: 'gmail'
});

console.log('Connection status:', status);
// { connected: true, authenticated: true, accountInfo: { email: 'user@gmail.com' } }
```

#### Example 2: Execute Gmail Tool
```typescript
// Send an email
const result = await trpc.integrations.mcp.execute.mutate({
  provider: 'gmail',
  tool: 'send',
  parameters: {
    to: 'recipient@example.com',
    subject: 'Meeting Tomorrow',
    body: 'Hi! Confirming our meeting at 2 PM tomorrow.\n\nBest regards'
  }
});

if (result.success) {
  console.log('Email sent successfully!', result.data.messageId);
} else {
  console.error('Failed to send email:', result.error);
}
```

#### Example 3: Create Calendar Event
```typescript
// Create an event
const result = await trpc.integrations.mcp.execute.mutate({
  provider: 'calendar',
  tool: 'create',
  parameters: {
    summary: 'Team Standup',
    start: {
      dateTime: '2024-02-01T10:00:00-05:00',
      timeZone: 'America/New_York'
    },
    end: {
      dateTime: '2024-02-01T10:30:00-05:00',
      timeZone: 'America/New_York'
    },
    attendees: [
      { email: 'alice@example.com' },
      { email: 'bob@example.com' }
    ]
  }
});

console.log('Event created:', result.data.htmlLink);
```

#### Example 4: List Available Tools
```typescript
// Get all Gmail tools
const tools = await trpc.integrations.mcp.tools.query({
  provider: 'gmail'
});

tools.forEach(tool => {
  console.log(`${tool.name}: ${tool.description}`);
  console.log('Parameters:', tool.parameters);
});

// Output:
// GMAIL_SEND_EMAIL: Send an email message
// Parameters: { to: string, subject: string, body: string, ... }
// GMAIL_FETCH_EMAILS: Fetch email messages
// Parameters: { maxResults: number, query?: string, ... }
```

#### Example 5: Check All Connections
```typescript
// Get all user connections
const connections = await trpc.integrations.mcp.list.query();

connections.forEach(conn => {
  console.log(`${conn.provider}: ${conn.status}`);
  if (conn.accountInfo) {
    console.log(`  Account: ${conn.accountInfo.email || conn.accountInfo.name}`);
  }
  console.log(`  Tools: ${conn.availableTools.length}`);
});

// Output:
// gmail: active
//   Account: user@gmail.com
//   Tools: 6
// calendar: active
//   Account: user@gmail.com
//   Tools: 5
// slack: inactive
//   Tools: 0
```

### Error Handling

#### Standard Error Responses
```typescript
interface MCPError {
  code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'RATE_LIMITED' | 'INVALID_PARAMS' | 'TIMEOUT';
  message: string;
  details?: any;
}

// Example error handling
try {
  await executor.execute(connectionId, toolName, params);
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    // Re-initiate OAuth
    await initiateOAuth(provider, userId);
  } else if (error.code === 'RATE_LIMITED') {
    // Wait and retry
    await delay(error.details.retryAfter);
    await executor.execute(connectionId, toolName, params);
  }
}
```

### Migration Guide

#### Step 1: Update Environment Variables
```bash
# Old
COMPOSIO_API_KEY=xxx
COMPOSIO_ENTITY_ID=xxx

# New
COMPOSIO_API_KEY=xxx
COMPOSIO_INTEGRATION_ID_GMAIL=xxx
COMPOSIO_INTEGRATION_ID_CALENDAR=xxx
# ... etc
```

#### Step 2: Update Database Schema
```sql
-- Add new columns
ALTER TABLE integrations
ADD COLUMN mcp_server_id VARCHAR(255),
ADD COLUMN mcp_connection_id VARCHAR(255),
ADD COLUMN mcp_migrated_at TIMESTAMP;

-- Migration query
UPDATE integrations
SET mcp_connection_id = config->>'server_instance_id'
WHERE provider = 'composio'
AND config->>'server_instance_id' IS NOT NULL;
```

#### Step 3: Update Code References
```typescript
// Old way
const composio = new Composio({ apiKey });
const result = await composio.executeAction(action, params);

// New way
const manager = new ComposioMCPManager({ apiKey });
const result = await manager.execute(connectionId, toolName, params);
```

### Testing Strategy

#### Unit Tests
```typescript
describe('ComposioMCPManager', () => {
  it('should create MCP server', async () => {
    const server = await manager.createServer({
      name: 'test-gmail',
      provider: 'gmail',
      authConfigId: 'test-auth-id',
      allowedTools: ['GMAIL_SEND_EMAIL']
    });
    
    expect(server.id).toBeDefined();
    expect(server.status).toBe('active');
  });
  
  it('should handle OAuth flow', async () => {
    const flow = await manager.initiateOAuth('gmail', 'user-123');
    
    expect(flow.redirectUrl).toContain('oauth.composio.dev');
    expect(flow.connectionId).toBeDefined();
  });
});
```

#### Integration Tests
```typescript
describe('MCP Tool Execution', () => {
  it('should send email via Gmail', async () => {
    const result = await executor.execute(
      testConnectionId,
      'GMAIL_SEND_EMAIL',
      {
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'This is a test'
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.data.messageId).toBeDefined();
  });
});
```

### Monitoring & Observability

#### Key Metrics
1. OAuth success rate
2. Tool execution latency
3. API rate limit usage
4. Connection health status
5. Error rates by provider

#### Logging
```typescript
logger.info('MCP operation', {
  operation: 'tool_execution',
  provider: 'gmail',
  tool: 'GMAIL_SEND_EMAIL',
  userId: 'user-123',
  duration: 245,
  success: true
});
```

### Security Considerations

1. **OAuth State Validation**: Always verify OAuth state parameter
2. **Tool Parameter Validation**: Validate all inputs against schema
3. **Rate Limiting**: Implement per-user rate limits
4. **Connection Isolation**: Ensure users can only access their own connections
5. **Audit Logging**: Log all tool executions for compliance

### Rollout Plan

#### Week 1-2: Development
- Implement core MCP manager
- Set up OAuth flows
- Create tool executor

#### Week 3: Testing
- Unit tests
- Integration tests
- Load testing

#### Week 4: Migration
- Migrate existing connections
- Update documentation
- Monitor for issues

#### Week 5: Full Rollout
- Enable for all users
- Deprecate old system
- Performance optimization

### Success Criteria

1. **Technical Success**
   - 100% of existing integrations migrated
   - < 100ms average tool execution time
   - 99.9% uptime for MCP servers

2. **User Success**
   - 50% reduction in OAuth errors
   - 90% user satisfaction with integration flow
   - Zero data loss during migration

### Future Enhancements

1. **Batch Operations**: Execute multiple tools in one request
2. **Webhooks**: Real-time notifications for changes
3. **Custom Tools**: Allow users to create custom MCP tools
4. **Analytics**: Detailed usage analytics per integration
5. **Mobile SDK**: Native mobile support for MCP