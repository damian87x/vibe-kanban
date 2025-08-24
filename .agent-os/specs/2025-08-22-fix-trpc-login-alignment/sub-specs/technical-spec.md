# Technical Specification: Fix tRPC Login System & Backend Structure Alignment

> Spec: Fix tRPC Login System & Backend Structure Alignment
> Created: 2025-08-22
> Status: Planning
> Parent: /specs/2025-08-22-fix-trpc-login-alignment/spec.md

## Technical Approach

### 1. tRPC Router Restoration Analysis

**Current State**: Minimal tRPC router with only 2 routes (test, auth)
**Target State**: Complete tRPC router with 15+ modules matching main branch

#### Current Simplified Structure:
```typescript
// src/backend/trpc/app-router.ts
export const appRouter = createTRPCRouter({
  test: publicProcedure.query(...),
  auth: authRouter,
});
```

#### Target Complete Structure (from main branch):
```typescript
export const appRouter = createTRPCRouter({
  example: { hi },
  voice: { transcribe, synthesize },
  mcp: { servers: {...}, tools: {...} },
  integrations: integrationsRouter,
  chat: chatRouter,
  health: { ...healthRouter, system: systemHealthRouter },
  auth: authRouter,
  knowledge: knowledgeRouter,
  workflows: { templates, executions, userWorkflows, triggers, ...workflowsRouter },
  agents: agentsRouter,
  agentTemplates: agentTemplatesRouter,
  database: databaseMonitoringRouter,
  templates: mainTemplatesRouter,
  ai: aiRouter,
  metrics: metricsRouter,
});
```

### 2. tRPC Client-Server Communication Fix

**Root Cause Analysis**:
- Frontend sends plain JSON: `{"email":"...","password":"..."}`
- Backend expects superjson format: `{"json":{"email":"...","password":"..."}}`
- Transformer mismatch between client and server configurations

#### Technical Solution Options:

**Option A: Fix Client Configuration (Recommended)**
```typescript
// frontend/lib/trpc.ts
const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_BASE_URL}/api/trpc`,
      transformer: superjson, // Ensure superjson is properly configured
      headers: () => ({
        'Content-Type': 'application/json',
      }),
    }),
  ],
  transformer: superjson, // Client-side transformer
});
```

**Option B: Fix Server Configuration**
```typescript
// backend/app.ts - tRPC server setup
app.use('/api/trpc/*', async (c) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: c.req.raw,
    router: appRouter,
    createContext: () => ({}),
    transformer: superjson, // Server-side transformer
  });
});
```

**Recommended**: Implement both for complete consistency

### 3. Router Restoration Implementation Plan

#### Phase 1: Core Business Logic Routers
```typescript
// Priority 1 - Essential for basic functionality
import { workflowsRouter } from "./routes/workflows";
import { agentsRouter } from "./routes/agents"; 
import { knowledgeRouter } from "./routes/knowledge";
import { integrationsRouter } from "./routes/integrations";
```

#### Phase 2: AI and System Routers  
```typescript
// Priority 2 - AI functionality and monitoring
import { aiRouter } from "./routes/ai";
import { chatRouter } from "./routes/chat";
import { healthRouter } from "./routes/health";
import { metricsRouter } from "./routes/metrics";
```

#### Phase 3: Advanced Features
```typescript  
// Priority 3 - Advanced features and tools
import { mcpServersListRoute, mcpToolsExecuteRoute } from "./routes/mcp/...";
import { voiceTranscribeRoute, voiceSynthesizeRoute } from "./routes/voice/...";
import { databaseMonitoringRouter } from "./routes/database-monitoring";
```

#### Missing Router Dependencies to Create/Restore:
1. **workflows**: Workflow templates, executions, user-workflows, triggers
2. **agents**: AI agent management and agent templates
3. **knowledge**: Knowledge base and document management
4. **integrations**: OAuth providers and external service connections
5. **ai**: OpenRouter, Claude, LiteLLM proxy endpoints
6. **mcp**: Model Context Protocol servers and tools
7. **health**: System health checks and database monitoring
8. **voice**: Speech transcription and synthesis
9. **chat**: AI conversation management
10. **metrics**: Performance and usage tracking

### 4. Architecture Cleanup Strategy

**Current Mixed Architecture Issues**:
- Duplicate REST endpoints alongside tRPC procedures
- Inconsistent error handling between REST and tRPC
- Mixed middleware approach

**Target tRPC-Only Architecture**:
```typescript
// src/backend/app.ts - Clean architecture (keeping current structure)
const app = new Hono();

// Essential non-tRPC endpoints (webhooks, OAuth callbacks)  
app.get("/api/oauth/callback", oauthCallbackHandler); // OAuth callbacks only
app.post("/api/webhooks/workflow/:triggerId", webhookHandler); // External webhooks only
app.get("/api/sse/oauth-status", sseHandler); // SSE for real-time updates

// All business logic through tRPC with complete router coverage
app.use('/api/trpc/*', async (c) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: c.req.raw,
    router: appRouter, // Now includes all 15+ routers
    createContext: createContext,
    transformer: superjson,
  });
});
```

### 5. Implementation Dependencies

#### Required Tools & Libraries:
- **superjson**: ^1.13.1 (client-server transformation)
- **@trpc/server**: ^10.45.0 (server-side tRPC)
- **@trpc/client**: ^10.45.0 (client-side tRPC)
- **@trpc/react-query**: ^10.45.0 (React integration)
- **hono**: ^4.6.0 (web framework)

#### Development Dependencies:
- **tsx**: TypeScript execution for migration scripts
- **@types/node**: Node.js type definitions
- **eslint**: Code linting during migration
- **typescript**: Compiler for type checking

#### Router Files to Create/Restore:
- `src/backend/trpc/routes/workflows/`: Workflow management routers
- `src/backend/trpc/routes/agents/`: AI agent routers  
- `src/backend/trpc/routes/knowledge/`: Knowledge base routers
- `src/backend/trpc/routes/integrations/`: OAuth and external service routers
- `src/backend/trpc/routes/ai/`: AI provider routers
- `src/backend/trpc/routes/mcp/`: Model Context Protocol routers
- `src/backend/trpc/routes/health/`: System health monitoring routers
- `src/backend/trpc/routes/chat/`: AI conversation routers
- `src/backend/trpc/routes/voice/`: Speech processing routers
- `src/backend/trpc/routes/metrics/`: Performance monitoring routers

### 6. Testing Strategy

#### Pre-Restoration Testing:
1. **Create baseline tests** for current minimal functionality (auth + test only)
2. **Document superjson transformation issues** with current login
3. **Run existing E2E test suite** to establish current broken state

#### Router Restoration Testing:
1. **Unit tests** for each restored router module
2. **Integration tests** for tRPC client-server communication with superjson
3. **Feature-specific tests** for workflows, agents, knowledge, integrations
4. **tRPC procedure tests** for all 15+ router modules

#### Post-Restoration Verification:
1. **Login flow end-to-end** testing - should work without superjson errors
2. **All feature navigation** - workflows, agents, knowledge, integrations 
3. **tRPC endpoint coverage** - verify all procedures are accessible
4. **Frontend integration** - ensure UI can call all restored tRPC procedures
5. **Performance testing** - verify no regression with complete router structure

### 7. Risk Mitigation

#### High-Risk Areas:
1. **Router Dependencies**: Missing services and database models for restored routers
2. **Import Resolution**: Router files importing non-existent services  
3. **Database Schema**: Routers expecting tables/models that don't exist
4. **External Integrations**: OAuth, AI providers, and MCP tools configuration
5. **Service Initialization**: Complex service dependencies between routers

#### Mitigation Strategies:
1. **Phased Restoration**: Restore routers in dependency order (auth → workflows → agents → integrations)
2. **Dependency Mapping**: Document all service dependencies before router creation
3. **Stub Implementation**: Create placeholder services for missing dependencies initially
4. **Incremental Testing**: Test each router module independently before integration
5. **Rollback Plan**: Keep simplified router as fallback during restoration

### 8. Performance Considerations

#### Expected Performance Impacts:
- **Positive**: Complete tRPC structure enables proper request batching and caching
- **Negative**: Larger router structure increases initial load time
- **Neutral**: Router restoration should not affect individual endpoint performance

#### Optimization Opportunities:
1. **tRPC Batching**: Enable request batching with complete router structure
2. **Superjson Optimization**: Configure for minimal transformation overhead across all routers
3. **Router Lazy Loading**: Implement dynamic imports for large router modules
4. **Connection Pooling**: Optimize database connections for increased router usage

### 9. Rollback Strategy

#### Rollback Triggers:
- Login functionality completely broken for >15 minutes
- More than 3 critical routers non-functional
- tRPC system completely unresponsive
- Database connection issues from router dependencies

#### Rollback Process:
1. **Immediate**: Revert to simplified router structure (auth + test only)
2. **Router Isolation**: Disable problematic router imports temporarily
3. **Service Dependencies**: Restore minimal service dependencies
4. **Verification**: Test login and basic functionality
5. **Communication**: Document which routers were rolled back and why

### 10. Success Metrics

#### Functional Success:
- [ ] Login works without "Unable to transform response" errors
- [ ] All 15+ tRPC routers restored and functional
- [ ] Complete feature coverage: workflows, agents, knowledge, integrations, ai, mcp, health, etc.
- [ ] No "missing procedure" errors when accessing features
- [ ] Frontend can successfully call all restored tRPC procedures

#### Performance Success:
- [ ] Login response time < 2 seconds
- [ ] tRPC batching works correctly across all routers
- [ ] API response times maintained despite larger router structure
- [ ] Memory usage stable with complete router coverage

#### Quality Success:
- [ ] All existing tests pass with restored routers
- [ ] Router-specific tests achieve >90% coverage
- [ ] No TypeScript compilation errors with all imports
- [ ] All router dependencies resolved correctly
- [ ] Superjson transformation works across all endpoints

---

*This technical specification provides the detailed implementation approach for restoring the complete tRPC router structure and fixing the login system transformation issues.*