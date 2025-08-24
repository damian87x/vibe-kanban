# Fix Production Agent and Chat Errors

## Overview

After successfully fixing the hardcoded localhost:3001 URLs, QA testing revealed critical functionality issues in production that prevent core features from working. This spec addresses fixing agent endpoints returning 500 errors and chat messages not being sent.

## Problem Statement

### Current Issues
1. **Agent Endpoints Failing (500 errors)**
   - `/api/trpc/agents.list` returns 500 error
   - `/api/trpc/agents.executions` returns 500 error
   - These are called repeatedly causing poor UX

2. **Chat Functionality Broken**
   - Users can type messages but they don't get sent to backend
   - No API calls observed when submitting chat messages
   - No AI responses received

3. **Configuration Issues**
   - Template endpoint has undefined URL prefix: `/undefined/api/trpc/templates.getUserSuggestions`
   - Possible missing environment variables or API keys

### Impact
- Users cannot use AI agents (core feature)
- Chat assistant is non-functional (primary interface)
- Poor user experience with repeated errors

## Goals

1. **Restore Agent Functionality**
   - Fix 500 errors on agent endpoints
   - Ensure agents can be listed and executed

2. **Fix Chat Message Sending**
   - Debug why messages aren't triggering API calls
   - Restore full chat conversation flow

3. **Resolve Configuration Issues**
   - Fix undefined URL prefixes
   - Verify all required environment variables are set

## Success Criteria

- [ ] Agent list loads without errors
- [ ] Agent executions work properly
- [ ] Chat messages send successfully
- [ ] AI responses are received and displayed
- [ ] No undefined URLs in API calls
- [ ] All critical user flows work end-to-end

## Technical Requirements

### Debugging Steps
1. Check Cloud Run logs for specific error messages
2. Verify database connectivity in production
3. Check if required tables exist (agents, agent_executions)
4. Verify AI provider API keys are set
5. Check tRPC route implementations

### Likely Root Causes
1. Missing database migrations for agent tables
2. Missing or incorrect environment variables
3. API key configuration issues
4. Frontend state management preventing message sends

## Out of Scope

- Performance optimization
- New features
- UI/UX improvements
- Non-critical endpoints

## Implementation Plan

### Phase 1: Diagnostics (30 min)
- [ ] Access Cloud Run logs for error details
- [ ] Check database for required tables
- [ ] Verify environment variables

### Phase 2: Fix Agent Errors (1 hour)
- [ ] Run missing database migrations if needed
- [ ] Fix agent service initialization
- [ ] Test agent endpoints

### Phase 3: Fix Chat Functionality (1 hour)
- [ ] Debug frontend chat store
- [ ] Fix message sending logic
- [ ] Verify AI provider integration

### Phase 4: Configuration Fixes (30 min)
- [ ] Fix undefined URL issues
- [ ] Update environment variables
- [ ] Test all API endpoints

### Phase 5: Verification (30 min)
- [ ] Run QA tests on all fixes
- [ ] Document any remaining issues
- [ ] Deploy fixes to production

## Testing Plan

1. **Unit Tests**
   - Test agent service methods
   - Test chat message handling

2. **Integration Tests**
   - Test full agent execution flow
   - Test chat conversation flow

3. **E2E Tests**
   - Login and navigate to agents
   - Create and execute an agent
   - Send chat messages and receive responses

## Rollback Plan

If fixes cause new issues:
1. Revert to previous Docker image
2. Investigate issues in staging environment
3. Apply fixes incrementally

## Dependencies

- Access to Cloud Run logs
- Database access for migrations
- Environment variable management
- AI provider API keys

## Timeline

- Estimated: 3.5 hours
- Priority: Critical (blocking production use)

## Notes

- QA testing confirmed URL routing is fixed
- Authentication and basic navigation work
- Only functionality issues remain