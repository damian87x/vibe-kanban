# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-16-agent-template-dynamic-prompts/spec.md

> Created: 2025-08-16  
> Version: 1.0.0

## tRPC Routes

### Prompts Router

#### POST /api/trpc/prompts.generate

**Purpose:** Generate a dynamic prompt from an agent template

**Input:**
```typescript
{
  templateId: string;
  agentId?: string;
  customParameters?: {
    goal?: string;
    context?: Record<string, any>;
    variables?: Record<string, string>;
  };
  useCache?: boolean;
}
```

**Output:**
```typescript
{
  id: string;
  systemPrompt: string;
  initialMessage?: string;
  goal: string;
  context: {
    integrations: Integration[];
    capabilities: string[];
    workflow?: WorkflowConfig;
  };
  cacheKey?: string;
  expiresAt?: Date;
}
```

**Errors:**
- `TEMPLATE_NOT_FOUND` - Template doesn't exist
- `UNAUTHORIZED` - User lacks permission
- `INTEGRATION_ERROR` - Required integration not connected

#### GET /api/trpc/prompts.get

**Purpose:** Retrieve a previously generated prompt

**Input:**
```typescript
{
  promptId?: string;
  cacheKey?: string;
}
```

**Output:** Same as generate output

**Errors:**
- `PROMPT_NOT_FOUND` - Prompt doesn't exist or expired
- `UNAUTHORIZED` - User lacks permission

#### POST /api/trpc/prompts.customize

**Purpose:** Customize and save a prompt template

**Input:**
```typescript
{
  basePromptId?: string;
  templateId: string;
  name: string;
  description?: string;
  templateString: string;
  variables?: Record<string, any>;
  isPublic?: boolean;
}
```

**Output:**
```typescript
{
  id: string;
  name: string;
  templateString: string;
  variables: Record<string, any>;
  createdAt: Date;
}
```

### Agent Execution Router

#### POST /api/trpc/agents.executeFromTemplate

**Purpose:** Execute an agent directly from a template

**Input:**
```typescript
{
  templateId: string;
  agentId?: string;
  promptOverrides?: {
    goal?: string;
    initialMessage?: string;
  };
  conversationId?: string;
}
```

**Output:**
```typescript
{
  executionId: string;
  conversationId: string;
  agentId: string;
  status: 'initializing' | 'running' | 'completed' | 'failed';
  prompt: GeneratedPrompt;
}
```

**Errors:**
- `TEMPLATE_NOT_FOUND` - Template doesn't exist
- `INTEGRATION_MISSING` - Required integration not connected
- `EXECUTION_FAILED` - Agent execution error

#### GET /api/trpc/agents.getExecution

**Purpose:** Get execution status and results

**Input:**
```typescript
{
  executionId: string;
}
```

**Output:**
```typescript
{
  id: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  metrics: {
    tokensUsed: number;
    executionTimeMs: number;
    apiCallsCount: number;
  };
}
```

#### POST /api/trpc/agents.stopExecution

**Purpose:** Stop a running agent execution

**Input:**
```typescript
{
  executionId: string;
  reason?: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  finalStatus: string;
}
```

### Chat Integration Router

#### POST /api/trpc/chat.initializeFromTemplate

**Purpose:** Initialize a chat conversation from a template

**Input:**
```typescript
{
  templateId: string;
  agentId?: string;
  promptId?: string;
  autoExecute?: boolean;
}
```

**Output:**
```typescript
{
  conversationId: string;
  agentId: string;
  systemPrompt: string;
  initialMessage?: string;
  context: {
    templateId: string;
    goal: string;
    integrations: string[];
  };
}
```

**Errors:**
- `TEMPLATE_NOT_FOUND` - Template doesn't exist
- `CONVERSATION_CREATE_FAILED` - Failed to create conversation

#### POST /api/trpc/chat.continueWithAgent

**Purpose:** Continue an existing conversation with agent context

**Input:**
```typescript
{
  conversationId: string;
  message: string;
  includeAgentContext?: boolean;
}
```

**Output:**
```typescript
{
  messageId: string;
  response: string;
  agentActions?: ToolCall[];
  conversationUpdated: boolean;
}
```

### Analytics Router

#### GET /api/trpc/analytics.promptPerformance

**Purpose:** Get prompt generation and execution analytics

**Input:**
```typescript
{
  templateId?: string;
  agentId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
}
```

**Output:**
```typescript
{
  totalExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  promptMetrics: {
    generationCount: number;
    cacheHitRate: number;
    averageGenerationTime: number;
  };
  topIntegrations: Array<{
    name: string;
    usageCount: number;
  }>;
}
```

## Integration Points

### Existing Services Integration

1. **ChatService**
   - Extend to support template context
   - Add prompt injection capability
   - Maintain conversation continuity

2. **AgentDatabaseService**
   - Add prompt tracking methods
   - Update execution recording
   - Link templates to agents

3. **IntegrationManager**
   - Validate integration availability
   - Get capability descriptions
   - Check permission scopes

4. **WorkflowTemplateManager**
   - Parse template structures
   - Extract workflow components
   - Validate template formats

### WebSocket Events

```typescript
// Execution status updates
socket.emit('agent:execution:started', { executionId, agentId });
socket.emit('agent:execution:progress', { executionId, progress });
socket.emit('agent:execution:completed', { executionId, result });
socket.emit('agent:execution:failed', { executionId, error });

// Prompt generation events
socket.emit('prompt:generated', { promptId, templateId });
socket.emit('prompt:cached', { cacheKey });
```

## Error Handling

### Standard Error Responses

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: any;
  retryable?: boolean;
}
```

### Error Codes

- `PROMPT_001` - Prompt generation failed
- `PROMPT_002` - Invalid template structure
- `PROMPT_003` - Cache retrieval failed
- `EXEC_001` - Execution initialization failed
- `EXEC_002` - Agent not available
- `EXEC_003` - Execution timeout
- `INT_001` - Integration not connected
- `INT_002` - Invalid integration scope
- `AUTH_001` - Unauthorized access
- `AUTH_002` - Insufficient permissions

## Rate Limiting

- Prompt generation: 60 requests per minute per user
- Agent execution: 20 executions per minute per user
- Analytics queries: 100 requests per minute per user

## Caching Strategy

1. **Prompt Caching**
   - TTL: 5 minutes for dynamic prompts
   - Key: Hash of (templateId, userId, parameters)
   - Invalidate on template or integration changes

2. **Response Caching**
   - Analytics: 1 minute cache
   - Template data: 10 minutes cache
   - User agents: No caching (always fresh)