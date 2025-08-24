# Fix Composio MCP Integration - Tasks

## Phase 1: Research & Environment Setup
- [ ] Access Composio dashboard and locate authConfigIds for Gmail, Calendar, Slack
- [ ] Document the authConfigIds in a secure location
- [ ] Update .env.example with new variable names
- [ ] Update local .env with authConfigIds

## Phase 2: Backend Implementation
- [ ] Create backup of current ComposioIntegrationManager
- [ ] Implement new MCP flow in ComposioIntegrationManager:
  - [ ] Add `createMCPServer()` method
  - [ ] Add `checkUserConnectionStatus()` method  
  - [ ] Add `getMCPServerURLs()` method
  - [ ] Refactor `initiateConnection()` to use MCP flow
- [ ] Update ComposioMCPAdapter to work with MCP servers
- [ ] Add proper error handling for MCP-specific errors
- [ ] Add logging for debugging MCP flow

## Phase 3: Testing
- [ ] Unit test the new MCP methods
- [ ] Integration test with real Composio API
- [ ] Test Gmail integration end-to-end
- [ ] Test Calendar integration end-to-end
- [ ] Test Slack integration end-to-end
- [ ] Test error scenarios (invalid authConfigId, disconnected user, etc.)

## Phase 4: Frontend Updates
- [ ] Update OAuth callback handler to work with MCP URLs
- [ ] Add connection status checking in UI
- [ ] Update error messages for MCP-specific errors
- [ ] Test the complete flow from UI

## Phase 5: Documentation & Deployment
- [ ] Update README with new environment variable requirements
- [ ] Document the MCP flow for future developers
- [ ] Create migration guide from old to new approach
- [ ] Deploy and verify in production environment