# Feature Specification: Enhance MCP Composio Integration for Assistant

> Version: 1.0.0
> Created: 2025-08-15
> Status: In Review

## Executive Summary

Enhancement of the existing MCP integration in the assistant interface to support native Composio MCP server architecture, enabling direct tool execution through AI providers without intermediate abstraction layers. This will provide more efficient, real-time integration execution similar to how Anthropic Claude and OpenAI handle MCP servers directly.

## Current State Analysis

### Existing Implementation
- **MCP Abstraction Layer**: Well-architected abstraction supporting Composio/Klavis switching
- **Tool Execution**: Currently routes through `mcpToolManager` with intermediate processing
- **OAuth Provider**: Environment-based switching between Composio (10k users) and Klavis (3 users)
- **Integration Status**: Real-time monitoring with health checks
- **AI Provider**: OpenRouter (OpenAI-compatible API) for model inference

### Architecture Components
1. **Frontend**: React Native assistant interface with chat functionality
2. **State Management**: Zustand store with AsyncStorage persistence
3. **Backend**: Hono + tRPC with comprehensive chat service
4. **MCP Integration**: Abstract factory pattern for provider switching
5. **Tool Management**: Centralized tool registry and execution

### Current Flow
```
User Message → Chat Service → AI Router → OpenRouter API
                    ↓
              MCP Tool Manager → Provider Factory → Composio/Klavis
                    ↓
              Tool Execution → Response Processing → User Response
```

## Problem Statement

The current implementation uses an abstraction layer that processes MCP tools through intermediate services. While functional, this approach:
1. Adds latency through multiple service hops
2. Requires translation between MCP formats and internal formats
3. Doesn't leverage native MCP server capabilities in AI providers
4. Limits real-time streaming of tool execution results

## Proposed Solution

### Native MCP Server Integration

Implement direct MCP server integration following Composio's native architecture, similar to Anthropic and OpenAI implementations:

```typescript
// Enhanced architecture
User Message → Chat Service → AI Provider with MCP
                    ↓
            Direct MCP Server URLs → Native Tool Execution
                    ↓
            Streaming Response → User Interface
```

### Key Features

1. **Direct MCP Server Creation**
   - Create MCP servers with Composio SDK
   - Configure server with specific tool allowlists
   - Support multiple auth configurations per server

2. **Native Provider Integration**
   - OpenAI-compatible MCP integration for OpenRouter
   - Pass server URLs directly to AI completion API
   - Support streaming tool execution responses

3. **Dynamic Server Management**
   - Per-user MCP server instances
   - Automatic connection status checking
   - OAuth flow integration for missing connections

4. **Real-time Tool Execution**
   - Stream tool execution progress
   - Display intermediate results
   - Handle multi-step tool chains natively

## Technical Specification

### 1. MCP Server Service

Create a new service for managing Composio MCP servers:

```typescript
// backend/services/mcp/composio-mcp-server.service.ts
interface MCPServerConfig {
  name: string;
  userId: string;
  authConfigId: string;
  allowedTools: string[];
  options?: {
    isChatAuth?: boolean;
    streamingEnabled?: boolean;
  };
}

class ComposioMCPServerService {
  async createServer(config: MCPServerConfig): Promise<MCPServer>
  async getServerUrls(serverId: string, userId: string): Promise<ServerUrls>
  async checkConnectionStatus(serverId: string, userId: string): Promise<ConnectionStatus>
  async handleMissingConnection(serverId: string, toolkit: string, userId: string): Promise<AuthFlow>
}
```

### 2. Enhanced Chat Service

Modify chat service to use native MCP servers:

```typescript
// backend/services/chat-service.ts enhancements
class ChatService {
  async processMessageWithMCP(message: string, userId: string) {
    // 1. Get or create user's MCP server
    const mcpServer = await this.getMCPServerForUser(userId);
    
    // 2. Check connection status
    const status = await this.checkMCPConnections(mcpServer, userId);
    
    // 3. Get server URLs for connected accounts
    const serverUrls = await mcpServer.getServerUrls(userId);
    
    // 4. Send to AI with MCP servers
    const response = await this.sendToAIWithMCP(message, serverUrls);
    
    return response;
  }
}
```

### 3. AI Provider Integration

Enhance OpenRouter client to support MCP servers:

```typescript
// backend/services/ai/openrouter-mcp-client.ts
class OpenRouterMCPClient extends OpenRouterClient {
  async chatWithMCP(
    messages: ChatMessage[],
    mcpServers: ServerUrls[],
    options: ChatOptions
  ): Promise<StreamingResponse> {
    // Format request with MCP servers
    const request = {
      model: options.model,
      messages,
      tools: mcpServers, // Pass MCP servers as tools
      stream: true,
      // Additional MCP-specific headers if needed
    };
    
    return this.streamCompletion(request);
  }
}
```

### 4. Frontend Enhancements

Update assistant interface for MCP status:

```typescript
// components/MCPIntegrationStatus.tsx
interface MCPStatusProps {
  serverId: string;
  userId: string;
  onConnect: (toolkit: string) => void;
}

function MCPIntegrationStatus({ serverId, userId, onConnect }: MCPStatusProps) {
  const [status, setStatus] = useState<ConnectionStatus>();
  
  // Real-time status checking
  useEffect(() => {
    const checkStatus = async () => {
      const connectionStatus = await checkMCPStatus(serverId, userId);
      setStatus(connectionStatus);
    };
    
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [serverId, userId]);
  
  return (
    <View>
      {/* Display connection status for each toolkit */}
      {Object.entries(status?.connectedToolkits || {}).map(([toolkit, info]) => (
        <ToolkitStatus 
          key={toolkit}
          toolkit={toolkit}
          connected={info.connected}
          onConnect={() => onConnect(toolkit)}
        />
      ))}
    </View>
  );
}
```

### 5. Database Schema Updates

Add MCP server tracking:

```sql
-- MCP Server configurations
CREATE TABLE mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  composio_server_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, composio_server_id)
);

-- MCP Connection status cache
CREATE TABLE mcp_connection_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id),
  toolkit VARCHAR(100) NOT NULL,
  connected BOOLEAN DEFAULT FALSE,
  account_id VARCHAR(255),
  last_checked TIMESTAMP DEFAULT NOW(),
  UNIQUE(server_id, toolkit)
);
```

## Implementation Tasks

### Phase 1: Core MCP Server Service (2 days)
- [ ] Create ComposioMCPServerService class
- [ ] Implement server creation with Composio SDK
- [ ] Add connection status checking
- [ ] Implement OAuth flow handling
- [ ] Add server URL retrieval

### Phase 2: Database & State Management (1 day)
- [ ] Create database migrations for MCP tables
- [ ] Add MCP server state to Zustand store
- [ ] Implement server caching logic
- [ ] Add connection status caching

### Phase 3: AI Provider Integration (2 days)
- [ ] Enhance OpenRouterClient for MCP support
- [ ] Implement streaming response handling
- [ ] Add MCP-specific headers and formatting
- [ ] Test with various AI models

### Phase 4: Chat Service Enhancement (2 days)
- [ ] Modify chat service to use MCP servers
- [ ] Implement server lifecycle management
- [ ] Add connection verification before requests
- [ ] Handle authentication flows in chat

### Phase 5: Frontend Integration (2 days)
- [ ] Create MCPIntegrationStatus component
- [ ] Update assistant interface with MCP status
- [ ] Add OAuth connection flow UI
- [ ] Implement real-time status updates

### Phase 6: Testing & Documentation (1 day)
- [ ] Unit tests for MCP server service
- [ ] Integration tests for end-to-end flow
- [ ] Update API documentation
- [ ] Create usage examples

## Success Criteria

1. **Performance**
   - Tool execution latency reduced by 30%
   - Streaming responses visible within 200ms

2. **Functionality**
   - Native MCP server creation and management
   - Seamless OAuth flow for disconnected accounts
   - Real-time tool execution streaming

3. **User Experience**
   - Clear integration status indicators
   - One-click OAuth connection
   - Visible tool execution progress

4. **Technical**
   - 90%+ test coverage for new code
   - No regression in existing functionality
   - Backward compatibility with current integrations

## Migration Strategy

### Phase 1: Parallel Implementation
- New MCP server service runs alongside existing
- Feature flag for enabling new implementation
- A/B testing with subset of users

### Phase 2: Gradual Rollout
- Enable for new users by default
- Migrate existing users in batches
- Monitor performance and error rates

### Phase 3: Deprecation
- Remove old abstraction layer
- Clean up unused code
- Update documentation

## Risk Analysis

### Technical Risks
1. **OpenRouter MCP Support**: OpenRouter may not fully support MCP server format
   - Mitigation: Build adapter layer if needed
   
2. **Composio API Changes**: SDK updates may break implementation
   - Mitigation: Pin SDK version, test thoroughly

3. **Performance Impact**: Multiple MCP servers may increase latency
   - Mitigation: Implement caching and connection pooling

### Business Risks
1. **User Disruption**: OAuth reconnection may be required
   - Mitigation: Clear communication, seamless flow

2. **Cost Increase**: More API calls to Composio
   - Mitigation: Implement intelligent caching

## Alternative Approaches Considered

1. **Proxy Layer**: Build proxy to translate between formats
   - Rejected: Adds complexity without native benefits

2. **Client-Side MCP**: Handle MCP directly in frontend
   - Rejected: Security concerns with API keys

3. **Hybrid Approach**: Use native for some tools, abstraction for others
   - Rejected: Inconsistent behavior and maintenance burden

## Appendix

### Example Implementation

```typescript
// Example of complete flow with new architecture
async function handleAssistantMessage(message: string, userId: string) {
  // 1. Get/Create MCP Server
  const mcpServer = await composioMCPService.getOrCreateServer({
    name: `Assistant Server - ${userId}`,
    userId,
    authConfigId: process.env.COMPOSIO_AUTH_CONFIG_ID,
    allowedTools: ['GMAIL_FETCH_EMAILS', 'GMAIL_SEND_EMAIL', 'GCAL_CREATE_EVENT'],
    options: { isChatAuth: true, streamingEnabled: true }
  });
  
  // 2. Check Connections
  const status = await composioMCPService.checkConnectionStatus(
    mcpServer.id,
    userId
  );
  
  if (!status.connected) {
    // Handle missing connections
    for (const [toolkit, info] of Object.entries(status.connectedToolkits)) {
      if (!info.connected) {
        const authFlow = await composioMCPService.handleMissingConnection(
          mcpServer.id,
          toolkit,
          userId
        );
        // Return auth URL to frontend
        return { requiresAuth: true, authUrl: authFlow.redirectUrl, toolkit };
      }
    }
  }
  
  // 3. Get Server URLs
  const serverUrls = await mcpServer.getServerUrls(userId, {
    limitTools: ['GMAIL_FETCH_EMAILS', 'GMAIL_SEND_EMAIL']
  });
  
  // 4. Send to AI with MCP
  const stream = await openRouterMCPClient.chatWithMCP(
    [
      { role: 'system', content: 'You are a helpful assistant with email access.' },
      { role: 'user', content: message }
    ],
    serverUrls,
    {
      model: 'anthropic/claude-3.5-sonnet',
      stream: true,
      maxTokens: 1000
    }
  );
  
  // 5. Stream Response
  for await (const chunk of stream) {
    if (chunk.type === 'content') {
      yield { type: 'text', content: chunk.content };
    } else if (chunk.type === 'tool_use') {
      yield { type: 'tool', name: chunk.toolName, status: chunk.status };
    }
  }
}
```

### Testing Strategy

```typescript
// Test scenarios
describe('MCP Composio Integration', () => {
  test('should create MCP server for new user', async () => {
    const server = await service.createServer(config);
    expect(server.id).toBeDefined();
    expect(server.toolkits).toContain('gmail');
  });
  
  test('should handle missing OAuth connections', async () => {
    const status = await service.checkConnectionStatus(serverId, userId);
    expect(status.connected).toBe(false);
    expect(status.connectedToolkits.gmail.connected).toBe(false);
  });
  
  test('should stream tool execution results', async () => {
    const stream = await client.chatWithMCP(messages, serverUrls, options);
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    expect(chunks).toContainEqual(
      expect.objectContaining({ type: 'tool_use' })
    );
  });
});
```

## Conclusion

This enhancement will modernize the MCP integration to use native Composio server architecture, providing better performance, real-time streaming, and more direct integration with AI providers. The phased implementation approach ensures minimal disruption while delivering significant improvements to the assistant experience.

---

*This specification is a living document and will be updated as implementation progresses.*