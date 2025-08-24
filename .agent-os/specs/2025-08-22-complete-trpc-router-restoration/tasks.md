# Implementation Tasks

> **Task Breakdown for Complete tRPC Router Structure Restoration**  
> **Total Estimated Time**: 6-8 hours  
> **Dependencies**: Requires functional database and basic tRPC setup  

## Task 1: Create Consolidated MCP Router

**Priority**: P0 - Critical  
**Estimated Time**: 2 hours  
**Assignee**: Developer  
**Dependencies**: None  

### Description
Convert individual MCP procedure exports to a consolidated router structure to fix the "Cannot read properties of undefined (reading '_def')" error.

### Sub-tasks
- [ ] **1.1**: Analyze existing MCP procedure files (30 min)
  - Review `/trpc/routes/mcp/servers/list.ts`
  - Review `/trpc/routes/mcp/servers/connect.ts` 
  - Review `/trpc/routes/mcp/servers/disconnect.ts`
  - Review `/trpc/routes/mcp/servers/remove.ts`
  - Review `/trpc/routes/mcp/servers/status.ts`
  - Review `/trpc/routes/mcp/tools/list.ts`
  - Review `/trpc/routes/mcp/tools/execute.ts`

- [ ] **1.2**: Extract procedures from individual files (45 min)
  - Copy procedure logic from each file
  - Ensure no business logic is lost
  - Maintain exact same input/output schemas

- [ ] **1.3**: Create consolidated MCP router (30 min)  
  - Create `/trpc/routes/mcp/index.ts`
  - Structure as nested routers: `mcpRouter.servers` and `mcpRouter.tools`
  - Import and integrate all extracted procedures

- [ ] **1.4**: Update app-router.ts imports (15 min)
  - Replace individual MCP imports with single `mcpRouter` import
  - Update router structure to use `mcp: mcpRouter`

- [ ] **1.5**: Test MCP endpoints (20 min)
  - Start server and verify no import errors
  - Test each MCP endpoint manually or with curl
  - Verify responses match previous behavior

### Acceptance Criteria
- [ ] MCP router imports without errors
- [ ] All MCP server endpoints (list, connect, disconnect, remove, status) accessible
- [ ] All MCP tool endpoints (list, execute) accessible
- [ ] No breaking changes to existing API contracts
- [ ] Response formats identical to previous implementation

### Definition of Done
- Server starts successfully with MCP router enabled
- All 7 MCP endpoints respond correctly
- No console errors related to MCP routing

---

## Task 2: Create Consolidated Voice Router

**Priority**: P1 - High  
**Estimated Time**: 1 hour  
**Assignee**: Developer  
**Dependencies**: Task 1 completed  

### Description
Convert individual voice procedure exports to a consolidated router structure.

### Sub-tasks
- [ ] **2.1**: Analyze voice procedure files (20 min)
  - Review `/trpc/routes/voice/transcribe.ts`
  - Review `/trpc/routes/voice/synthesize.ts`
  - Document input/output schemas

- [ ] **2.2**: Create consolidated voice router (25 min)
  - Create `/trpc/routes/voice/index.ts`  
  - Extract procedures from individual files
  - Structure as `voiceRouter.transcribe` and `voiceRouter.synthesize`

- [ ] **2.3**: Update app-router.ts and test (15 min)
  - Replace individual voice imports
  - Test both voice endpoints
  - Verify audio processing works correctly

### Acceptance Criteria
- [ ] Voice router imports without errors
- [ ] Transcribe endpoint functional with audio input/output
- [ ] Synthesize endpoint functional with text input/audio output
- [ ] Voice service integrations work correctly

---

## Task 3: Create Consolidated Example Router

**Priority**: P2 - Medium  
**Estimated Time**: 30 minutes  
**Assignee**: Developer  
**Dependencies**: Task 2 completed  

### Description
Convert example procedures to proper router structure for consistency.

### Sub-tasks
- [ ] **3.1**: Analyze example procedure (10 min)
  - Review `/trpc/routes/example/hi/route.ts`
  - Document simple greeting endpoint

- [ ] **3.2**: Create consolidated example router (15 min)
  - Create `/trpc/routes/example/index.ts`
  - Extract hi procedure
  - Structure as `exampleRouter.hi`

- [ ] **3.3**: Update app-router.ts and test (5 min)
  - Replace example import
  - Test greeting endpoint

### Acceptance Criteria  
- [ ] Example router imports without errors
- [ ] Hi endpoint responds with greeting message
- [ ] Input parameter handling works correctly

---

## Task 4: Systematically Re-enable Feature Routers

**Priority**: P0 - Critical  
**Estimated Time**: 2-3 hours  
**Assignee**: Developer  
**Dependencies**: Tasks 1-3 completed  

### Description
Re-enable each disabled feature router one by one, testing thoroughly after each addition.

### Sub-tasks

#### Phase 4.1: Low-Risk Routers (45 min)
- [ ] **4.1.1**: Enable `databaseMonitoringRouter` (15 min)
  - Uncomment in app-router.ts
  - Start server and test
  - Verify database monitoring endpoints work

- [ ] **4.1.2**: Enable `templatesRouter` (15 min)
  - Uncomment in app-router.ts  
  - Test template CRUD operations
  - Verify template validation

- [ ] **4.1.3**: Enable `agentTemplatesRouter` (15 min)
  - Uncomment in app-router.ts
  - Test agent template endpoints
  - Check compatibility with existing agents

#### Phase 4.2: Medium-Risk Routers (60 min) 
- [ ] **4.2.1**: Enable `agentTemplatesV2Router` (15 min)
  - Uncomment in app-router.ts
  - Test enhanced template features
  - Verify backward compatibility

- [ ] **4.2.2**: Enable `aiRouter` (20 min)
  - Uncomment in app-router.ts
  - Test AI provider integrations
  - Verify model selection and chat endpoints

- [ ] **4.2.3**: Enable `knowledgeRouter` (25 min)  
  - Uncomment in app-router.ts
  - Test document upload/retrieval
  - Test note CRUD operations
  - Verify S3 integration (if configured)

#### Phase 4.3: High-Risk Routers (60 min)
- [ ] **4.3.1**: Enable `integrationsRouter` (25 min)
  - Uncomment in app-router.ts
  - Test OAuth initiation endpoints
  - Test connection status checking
  - Handle missing OAuth credentials gracefully

- [ ] **4.3.2**: Enable `chatRouter` (35 min)
  - Uncomment in app-router.ts
  - Test message processing
  - Test tool execution integration
  - Test workflow execution integration
  - Verify cross-system dependencies

### Router Re-enablement Process
For each router:
1. **Uncomment** the router import and assignment in `app-router.ts`
2. **Start server** and check for import/initialization errors
3. **Test basic endpoints** with curl or Postman
4. **Check dependencies** and external service integrations  
5. **Verify no regressions** in previously working functionality
6. **Document any issues** and workarounds needed

### Acceptance Criteria
- [ ] All 8 feature routers successfully enabled
- [ ] Server starts without errors or warnings
- [ ] Basic functionality test passes for each router
- [ ] No regressions in core router functionality (auth, health, metrics, agents, workflows)

---

## Task 5: Integration Testing and Validation  

**Priority**: P1 - High  
**Estimated Time**: 1 hour  
**Assignee**: Developer  
**Dependencies**: Task 4 completed  

### Description
Comprehensive testing of all router interactions and system integration.

### Sub-tasks

#### Phase 5.1: Router Structure Validation (20 min)
- [ ] **5.1.1**: Test all new consolidated routers
  ```bash
  curl http://localhost:3001/api/trpc/mcp.servers.list
  curl http://localhost:3001/api/trpc/mcp.tools.list
  curl http://localhost:3001/api/trpc/voice.transcribe
  curl http://localhost:3001/api/trpc/voice.synthesize  
  curl http://localhost:3001/api/trpc/example.hi
  ```

- [ ] **5.1.2**: Validate router nesting structure
  - Ensure nested routers accessible (e.g., `mcp.servers.list`)
  - Verify URL patterns match expectations
  - Check tRPC client can introspect all routes

#### Phase 5.2: Cross-Router Integration Testing (25 min)
- [ ] **5.2.1**: Test Chat → AI integration
  - Send chat message that requires AI processing
  - Verify model selection works
  - Check response generation

- [ ] **5.2.2**: Test Chat → Integrations  
  - Send chat message that triggers tool execution
  - Verify OAuth integrations are accessible
  - Test tool execution through chat

- [ ] **5.2.3**: Test Agents → Templates integration
  - Create agent using template
  - Modify agent template and verify updates
  - Test template validation

- [ ] **5.2.4**: Test Workflows → Tools integration
  - Execute workflow that calls tools
  - Verify tool results feed back to workflow
  - Check workflow status updates

#### Phase 5.3: Error Handling and Edge Cases (15 min)
- [ ] **5.3.1**: Test invalid inputs
  - Send malformed requests to each router
  - Verify consistent error responses
  - Check error logging

- [ ] **5.3.2**: Test authentication failures
  - Call protected endpoints without auth
  - Verify proper 401/403 responses
  - Test token expiration handling

- [ ] **5.3.3**: Test service unavailability
  - Simulate database connection failure
  - Test external service timeouts
  - Verify graceful degradation

### Acceptance Criteria
- [ ] All individual routers respond correctly to test requests
- [ ] Cross-router functionality works without errors
- [ ] Error handling is consistent across all routers
- [ ] Performance is acceptable (<200ms for simple queries, <2s for complex)
- [ ] No memory leaks or resource issues during testing

### Success Metrics
- **Response Time**: 95% of requests complete in <200ms
- **Error Rate**: <1% for valid requests  
- **Availability**: All routers respond successfully to health checks
- **Consistency**: Error response formats match across all routers

---

## Risk Mitigation Strategies

### High Risk: Breaking API Contracts
**Mitigation**:
- Maintain exact same endpoint URLs
- Preserve request/response schemas  
- Test with actual frontend if possible
- Create API compatibility tests

### Medium Risk: Service Dependencies
**Mitigation**:
- Implement graceful fallbacks for missing services
- Add comprehensive error handling
- Use environment variables for optional services
- Mock external dependencies in development

### Low Risk: Performance Degradation  
**Mitigation**:
- Monitor response times during testing
- Profile memory usage
- Implement caching where appropriate
- Optimize database queries if needed

## Rollback Procedures

### If Individual Router Fails
1. Comment out the failing router in `app-router.ts`
2. Restart server to restore other functionality  
3. Debug router in isolation
4. Re-enable once fixed

### If Server Won't Start
1. Revert `app-router.ts` to last working state
2. Re-enable routers one by one to identify the problem
3. Fix root cause before proceeding

### If Major Issues Discovered
1. Revert entire feature branch
2. Keep only the superjson transformer fix
3. Reassess consolidation approach
4. Consider alternative router structuring strategies

## Quality Assurance Checklist

### Code Quality
- [ ] Consistent code style across all routers
- [ ] Proper TypeScript typing
- [ ] Comprehensive JSDoc comments
- [ ] Error handling follows established patterns

### Testing Quality  
- [ ] All endpoints manually tested
- [ ] Error cases covered
- [ ] Cross-router integrations validated
- [ ] Performance benchmarks met

### Documentation Quality
- [ ] API documentation updated
- [ ] Architecture decisions recorded
- [ ] Known issues documented
- [ ] Deployment notes updated