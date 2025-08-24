# Complete tRPC Router Structure Restoration

> **Feature Specification**  
> **Status**: Ready for Development  
> **Priority**: P0 - Critical  
> **Estimation**: 6-8 hours  
> **Creation Date**: 2025-08-22  

## Overview

The tRPC router system has been partially restored after fixing the superjson transformer issue. While core routers (auth, health, metrics, agents, workflows) are working, several important router modules remain disabled due to structural initialization errors. This specification covers the complete restoration of all tRPC routers to a fully functional state.

## Current Situation

### ✅ Working Routers
- `authRouter` - Authentication endpoints  
- `healthRouter` - System health monitoring  
- `metricsRouter` - Application metrics  
- `agentsRouter` - AI agent management  
- `workflowsRouter` - Workflow execution  

### ❌ Disabled Routers (Critical Issues)
- **MCP Routes**: Individual procedure exports causing `TypeError: Cannot read properties of undefined (reading '_def')`
- **Voice Routes**: Similar structural issues with procedure-based exports
- **Example Routes**: Same initialization pattern problems

### ❌ Disabled Routers (Commented Out)
- `aiRouter` - AI provider integration
- `chatRouter` - Chat system  
- `integrationsRouter` - OAuth/API integrations
- `knowledgeRouter` - Document/knowledge management
- `templatesRouter` - Template management
- `agentTemplatesRouter` - Agent template system
- `agentTemplatesV2Router` - Enhanced agent templates
- `databaseMonitoringRouter` - Database monitoring

## Problem Analysis

### Root Cause
The main issue is architectural inconsistency in route definitions. Some routes export raw tRPC procedures (`publicProcedure.query()`) while others export proper tRPC routers (`createTRPCRouter({})`). The tRPC router merger expects consistent router objects, not individual procedures.

### Error Pattern
```typescript
// ❌ PROBLEMATIC PATTERN (causes _def error)
export default publicProcedure.query(/* ... */);

// ✅ CORRECT PATTERN  
export const routerName = createTRPCRouter({
  procedureName: publicProcedure.query(/* ... */)
});
```

## Solution Strategy

### Phase 1: Fix MCP Router Structure
**Objective**: Convert individual MCP procedure exports to a consolidated MCP router

**Current Structure**:
```
trpc/routes/mcp/
├── servers/
│   ├── list.ts (exports publicProcedure)
│   ├── connect.ts (exports publicProcedure)  
│   ├── disconnect.ts (exports publicProcedure)
│   ├── remove.ts (exports publicProcedure)
│   └── status.ts (exports publicProcedure)
└── tools/
    ├── list.ts (exports publicProcedure)
    └── execute.ts (exports publicProcedure)
```

**Target Structure**:
```
trpc/routes/mcp/
└── index.ts (exports mcpRouter)
```

### Phase 2: Fix Voice Router Structure  
**Objective**: Convert individual voice procedure exports to a consolidated voice router

**Current Files**:
- `voice/transcribe.ts` - Audio transcription endpoint
- `voice/synthesize.ts` - Text-to-speech endpoint

### Phase 3: Fix Example Router Structure
**Objective**: Convert example procedures to proper router structure

**Current Files**:
- `example/hi/route.ts` - Simple greeting endpoint

### Phase 4: Re-enable Feature Routers
**Objective**: Systematically re-enable and test each feature router

**Approach**: One-by-one activation with immediate testing after each addition

### Phase 5: Integration Testing
**Objective**: Comprehensive testing of all router interactions

## Implementation Plan

### Task 1: Create Consolidated MCP Router
**Estimated Time**: 2 hours

**Steps**:
1. Create `/trpc/routes/mcp/index.ts` 
2. Import all MCP procedures from individual files
3. Restructure into `createTRPCRouter({})` pattern:
   ```typescript
   export const mcpRouter = createTRPCRouter({
     servers: createTRPCRouter({
       list: /* import from servers/list.ts */,
       connect: /* import from servers/connect.ts */,
       disconnect: /* import from servers/disconnect.ts */,
       remove: /* import from servers/remove.ts */,
       status: /* import from servers/status.ts */
     }),
     tools: createTRPCRouter({
       list: /* import from tools/list.ts */,
       execute: /* import from tools/execute.ts */
     })
   });
   ```
4. Update app-router.ts imports
5. Test MCP endpoints

**Acceptance Criteria**:
- [ ] MCP router imports without errors
- [ ] All MCP server endpoints accessible
- [ ] All MCP tool endpoints accessible  
- [ ] No breaking changes to existing API contracts

### Task 2: Create Consolidated Voice Router
**Estimated Time**: 1 hour

**Steps**:
1. Create `/trpc/routes/voice/index.ts`
2. Import transcribe and synthesize procedures
3. Restructure into router pattern:
   ```typescript
   export const voiceRouter = createTRPCRouter({
     transcribe: /* import from transcribe.ts */,
     synthesize: /* import from synthesize.ts */
   });
   ```
4. Update app-router.ts imports
5. Test voice endpoints

**Acceptance Criteria**:
- [ ] Voice router imports without errors
- [ ] Transcribe endpoint functional
- [ ] Synthesize endpoint functional

### Task 3: Create Consolidated Example Router  
**Estimated Time**: 30 minutes

**Steps**:
1. Create `/trpc/routes/example/index.ts`
2. Import hi procedure 
3. Restructure into router pattern:
   ```typescript
   export const exampleRouter = createTRPCRouter({
     hi: /* import from hi/route.ts */
   });
   ```
4. Update app-router.ts imports
5. Test example endpoints

**Acceptance Criteria**:
- [ ] Example router imports without errors
- [ ] Hi endpoint functional

### Task 4: Systematically Re-enable Feature Routers
**Estimated Time**: 2-3 hours

**Process**:
For each disabled router, follow this sequence:

1. **Uncomment in app-router.ts**
2. **Start server and verify no import errors**
3. **Test basic router functionality**
4. **Check for dependency issues**
5. **Move to next router**

**Router Re-enablement Order** (based on dependency complexity):
1. `databaseMonitoringRouter` (least dependencies)
2. `templatesRouter` 
3. `agentTemplatesRouter`
4. `agentTemplatesV2Router`
5. `aiRouter` (moderate dependencies)
6. `knowledgeRouter` (moderate dependencies)  
7. `integrationsRouter` (complex OAuth dependencies)
8. `chatRouter` (highest complexity - depends on most other systems)

**Acceptance Criteria**:
- [ ] All routers import successfully
- [ ] Server starts without errors
- [ ] Basic endpoint testing passes
- [ ] No regression in working functionality

### Task 5: Integration Testing and Validation
**Estimated Time**: 1 hour

**Test Categories**:

1. **Router Structure Tests**:
   ```bash
   curl http://localhost:3001/api/trpc/mcp.servers.list
   curl http://localhost:3001/api/trpc/voice.transcribe  
   curl http://localhost:3001/api/trpc/example.hi
   ```

2. **Cross-Router Dependency Tests**:
   - Chat → AI integration
   - Chat → Integrations  
   - Agents → Templates
   - Workflows → Tools

3. **Error Handling Tests**:
   - Invalid inputs
   - Authentication failures
   - Service unavailability

**Acceptance Criteria**:
- [ ] All individual routers respond correctly
- [ ] Cross-router functionality works
- [ ] Error handling is consistent
- [ ] Performance is acceptable (<200ms for simple queries)

## Risk Assessment

### High Risk
- **Breaking API Contracts**: Changing route structure could break frontend calls
  - **Mitigation**: Maintain exact same endpoint URLs and response formats
  
- **Service Dependencies**: Some routers depend on external services that may not be configured
  - **Mitigation**: Graceful error handling and fallbacks for missing services

### Medium Risk
- **Complex Chat Router**: Most complex router with many dependencies
  - **Mitigation**: Enable this last after all dependencies are working

- **OAuth Integration Issues**: Integration router has complex OAuth flows  
  - **Mitigation**: Test with mock providers first

### Low Risk
- **Simple Route Consolidation**: MCP, Voice, Example routers are straightforward
- **Database Monitoring**: Well-isolated functionality

## Testing Strategy

### Unit Testing
- Individual router procedure testing
- Input validation testing
- Error case handling

### Integration Testing  
- Full tRPC client-server communication
- Cross-router dependency validation
- Authentication flow testing

### Performance Testing
- Response time validation
- Memory usage monitoring  
- Concurrent request handling

## Definition of Done

### Technical Requirements
- [ ] All routers import and initialize successfully
- [ ] Server starts without errors or warnings
- [ ] All original API endpoints remain functional
- [ ] No breaking changes to existing contracts
- [ ] Error handling is consistent across all routers

### Testing Requirements  
- [ ] Unit tests pass for all refactored routers
- [ ] Integration tests pass for cross-router functionality
- [ ] Manual testing confirms all endpoints work
- [ ] Performance benchmarks meet requirements

### Documentation Requirements
- [ ] API documentation updated if any changes
- [ ] Code comments added for complex router structures  
- [ ] Architecture decision record created

## Success Metrics

### Primary Metrics
- **Router Availability**: 100% of routers successfully enabled
- **Zero Breaking Changes**: All existing frontend calls continue working
- **Server Stability**: No crashes or errors during normal operation

### Secondary Metrics  
- **Response Times**: <200ms for simple queries, <2s for complex operations
- **Error Rates**: <1% for valid requests
- **Code Quality**: Consistent structure across all routers

## Implementation Notes

### Code Quality Standards
- Follow existing tRPC patterns from working routers
- Maintain consistent error handling approaches
- Use proper TypeScript typing throughout
- Add comprehensive JSDoc comments

### Performance Considerations
- Minimize router initialization overhead
- Ensure proper connection pooling for database operations
- Implement appropriate caching where beneficial

### Security Considerations  
- Maintain existing authentication patterns
- Ensure proper input validation and sanitization
- Follow principle of least privilege for procedure access

## Rollback Plan

### Immediate Rollback (if server won't start)
1. Comment out problematic router in app-router.ts
2. Restart server to restore basic functionality
3. Debug specific router issues in isolation

### Gradual Rollback (if subset of routers have issues)
1. Disable specific problematic routers
2. Keep working routers enabled
3. Fix issues incrementally

### Full Rollback (if major architectural issues)
1. Revert to git state before refactoring
2. Re-apply only the superjson transformer fix
3. Reassess architectural approach

This comprehensive approach ensures a systematic restoration of all tRPC router functionality while minimizing risk and maintaining system stability throughout the process.