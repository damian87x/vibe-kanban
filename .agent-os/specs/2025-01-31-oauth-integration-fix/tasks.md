# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-01-31-oauth-integration-fix/spec.md

> Created: 2025-01-31
> Status: Ready for Implementation

## Tasks

- [x] 1. Fix Composio API Usage in Integration Manager
  - [x] 1.1 Write tests for getConnectionStatus using MCP API
  - [x] 1.2 Update getConnectionStatus to use mcp.getUserConnectionStatus with entityId and provider
  - [x] 1.3 Remove all UUID/NanoID conversion logic (it's not needed)
  - [x] 1.4 Add proper error handling and timeouts to all Composio API calls
  - [x] 1.5 Update logging to include all relevant IDs for debugging
  - [x] 1.6 Verify all tests pass

- [ ] 2. Fix OAuth Completion Check
  - [ ] 2.1 Write tests for complete-oauth endpoint with new API usage
  - [ ] 2.2 Update complete-oauth.ts to look up integration by userId + provider first
  - [ ] 2.3 Pass correct parameters (entityId, provider) to getConnectionStatus
  - [ ] 2.4 Return updated instanceId to frontend if it changed
  - [ ] 2.5 Add comprehensive error responses for all failure cases
  - [ ] 2.6 Verify all tests pass

- [ ] 3. Fix Disconnect Flow
  - [ ] 3.1 Write tests for disconnect with Composio API failures
  - [ ] 3.2 Add try-catch around Composio disconnect call
  - [ ] 3.3 Ensure local database updates even if Composio fails
  - [ ] 3.4 Add success logging for debugging
  - [ ] 3.5 Verify disconnect works end-to-end
  - [ ] 3.6 Verify all tests pass

- [ ] 4. Update Frontend Error Handling
  - [ ] 4.1 Write tests for new error response format
  - [ ] 4.2 Update frontend to handle standardized error responses
  - [ ] 4.3 Add specific handling for ALREADY_CONNECTED case
  - [ ] 4.4 Improve user feedback for all error scenarios
  - [ ] 4.5 Verify all tests pass

- [ ] 5. End-to-End Testing and Verification
  - [ ] 5.1 Write comprehensive E2E test for connect/disconnect flow
  - [ ] 5.2 Test with bypass auth mode: EXPO_PUBLIC_BYPASS_AUTH=true
  - [ ] 5.3 Verify OAuth flow works for all providers (Gmail, Calendar, Slack)
  - [ ] 5.4 Test error scenarios (timeout, API failure, cancelled OAuth)
  - [ ] 5.5 Update documentation with testing instructions
  - [ ] 5.6 Verify all E2E tests pass consistently