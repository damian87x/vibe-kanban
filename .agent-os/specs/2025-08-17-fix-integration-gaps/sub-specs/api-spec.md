# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-17-fix-integration-gaps/spec.md

> Created: 2025-08-17
> Version: 1.0.0

## Endpoints

### Agent Sessions

#### POST /api/trpc/agentSessions.create

**Purpose:** Create a new agent session from template or direct configuration
**Parameters:**
```typescript
{
  agentId: string;
  templateId?: string;
  initialContext?: Record<string, any>;
  conversationId?: string;
}
```
**Response:**
```typescript
{
  sessionId: string;
  status: 'running' | 'paused';
  context: Record<string, any>;
  conversationId?: string;
}
```
**Errors:** 
- `AGENT_NOT_FOUND` - Invalid agent ID
- `TEMPLATE_NOT_FOUND` - Invalid template ID
- `UNAUTHORIZED` - User lacks permission

#### GET /api/trpc/agentSessions.get

**Purpose:** Retrieve agent session details and current state
**Parameters:** 
```typescript
{ sessionId: string }
```
**Response:**
```typescript
{
  id: string;
  agentId: string;
  status: string;
  context: Record<string, any>;
  checkpoints: Array<any>;
  lastActiveAt: string;
}
```
**Errors:**
- `SESSION_NOT_FOUND` - Invalid session ID
- `UNAUTHORIZED` - User lacks access

#### POST /api/trpc/agentSessions.updateStatus

**Purpose:** Pause, resume, or complete an agent session
**Parameters:**
```typescript
{
  sessionId: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  checkpoint?: Record<string, any>;
}
```
**Response:**
```typescript
{ success: boolean; status: string }
```
**Errors:**
- `INVALID_TRANSITION` - Status change not allowed
- `SESSION_LOCKED` - Session in use

### Integration Events

#### GET /api/trpc/integrations.events

**Purpose:** Stream real-time integration events via WebSocket
**Parameters:**
```typescript
{ 
  integrationId?: string;
  eventTypes?: string[];
}
```
**Response:** WebSocket stream of events
```typescript
{
  type: 'connected' | 'disconnected' | 'tool_used' | 'error';
  integrationId: string;
  timestamp: string;
  data: Record<string, any>;
}
```
**Errors:**
- `WEBSOCKET_ERROR` - Connection failed
- `UNAUTHORIZED` - Invalid auth

#### POST /api/trpc/integrations.discoverTools

**Purpose:** Dynamically discover available tools from connected integrations
**Parameters:**
```typescript
{ forceRefresh?: boolean }
```
**Response:**
```typescript
{
  integrations: Array<{
    id: string;
    provider: string;
    status: 'connected' | 'error';
    tools: Array<{
      name: string;
      description: string;
      parameters: Record<string, any>;
    }>;
  }>;
}
```
**Errors:**
- `DISCOVERY_FAILED` - Could not query integrations

### Template-Chat Bridge

#### POST /api/trpc/templates.generatePrompt

**Purpose:** Generate dynamic prompt from template with current context
**Parameters:**
```typescript
{
  templateId: string;
  context: {
    userId: string;
    integrations: string[];
    variables?: Record<string, any>;
  };
}
```
**Response:**
```typescript
{
  systemPrompt: string;
  userPrompt?: string;
  tools: Array<string>;
  variables: Record<string, any>;
}
```
**Errors:**
- `TEMPLATE_NOT_FOUND` - Invalid template
- `GENERATION_FAILED` - Could not generate prompt

#### POST /api/trpc/templates.executeFromChat

**Purpose:** Execute workflow template directly from chat message
**Parameters:**
```typescript
{
  message: string;
  conversationId: string;
  templateId?: string;
  confidence?: number;
}
```
**Response:**
```typescript
{
  executed: boolean;
  templateId?: string;
  sessionId?: string;
  result?: any;
}
```
**Errors:**
- `NO_MATCHING_TEMPLATE` - No template matches message
- `EXECUTION_FAILED` - Workflow execution error

### Knowledge Base Vector Search

#### POST /api/trpc/knowledge.vectorSearch

**Purpose:** Semantic similarity search across knowledge base
**Parameters:**
```typescript
{
  query: string;
  limit?: number;
  threshold?: number;
  filters?: {
    userId?: string;
    tags?: string[];
    dateRange?: { start: string; end: string };
  };
}
```
**Response:**
```typescript
{
  results: Array<{
    id: string;
    title: string;
    content: string;
    similarity: number;
    metadata: Record<string, any>;
  }>;
  totalCount: number;
}
```
**Errors:**
- `EMBEDDING_FAILED` - Could not generate query embedding
- `SEARCH_ERROR` - Vector search failed

#### POST /api/trpc/knowledge.generateEmbeddings

**Purpose:** Generate embeddings for uploaded documents
**Parameters:**
```typescript
{
  documentId: string;
  chunkSize?: number;
  overlap?: number;
}
```
**Response:**
```typescript
{
  processed: boolean;
  chunks: number;
  status: 'completed' | 'failed';
}
```
**Errors:**
- `DOCUMENT_NOT_FOUND` - Invalid document ID
- `EMBEDDING_API_ERROR` - OpenAI API failed

## Controllers

### AgentSessionController
- `createSession()` - Initialize new agent session with context
- `getSession()` - Retrieve session state and history
- `updateSession()` - Modify session status or checkpoint
- `listSessions()` - Get user's active sessions
- `cleanupSessions()` - Remove old/inactive sessions

### IntegrationEventController
- `streamEvents()` - WebSocket handler for real-time events
- `recordEvent()` - Log integration event to database
- `getEventHistory()` - Retrieve past events
- `handleToolUse()` - Process tool execution events

### TemplatePromptController
- `generatePrompt()` - Build dynamic prompt from template
- `interpolateVariables()` - Replace template variables
- `mapIntegrations()` - Match integrations to template needs
- `cachePrompt()` - Store generated prompts

### KnowledgeVectorController
- `searchSimilar()` - Execute vector similarity search
- `processDocument()` - Generate embeddings for document
- `chunkDocument()` - Split document into chunks
- `updateEmbedding()` - Refresh document embeddings

## WebSocket Events

### Integration Status Updates
```typescript
// Client subscribes
ws.send({ type: 'subscribe', channel: 'integrations' });

// Server sends updates
ws.send({
  type: 'integration.connected',
  data: { integrationId, provider, tools }
});

ws.send({
  type: 'integration.tool_used',
  data: { tool, parameters, result }
});
```

### Agent Session Updates
```typescript
// Session status changes
ws.send({
  type: 'session.status_changed',
  data: { sessionId, oldStatus, newStatus }
});

// Session checkpoint saved
ws.send({
  type: 'session.checkpoint',
  data: { sessionId, checkpoint }
});
```

## Rate Limiting

- Template prompt generation: 100 requests/minute
- Vector search: 60 requests/minute
- Integration discovery: 10 requests/minute
- WebSocket connections: 5 per user

## Authentication

All endpoints require valid JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

WebSocket connections authenticate via initial message:
```typescript
ws.send({ type: 'auth', token: '<jwt_token>' });
```