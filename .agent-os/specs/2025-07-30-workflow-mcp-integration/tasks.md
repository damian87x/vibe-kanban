# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-07-30-workflow-mcp-integration/spec.md

> Created: 2025-07-30
> Status: Ready for Implementation

## Tasks

- [x] 1. Create WorkflowIntegrationService
  - [x] 1.1 Write tests for WorkflowIntegrationService class structure
  - [x] 1.2 Create service class with MCP client initialization
  - [x] 1.3 Implement integration lookup and caching
  - [x] 1.4 Add tool mapping for agent actions
  - [x] 1.5 Implement parameter transformation logic
  - [x] 1.6 Add comprehensive error handling
  - [x] 1.7 Verify all unit tests pass

- [ ] 2. Integrate Email Agent with MCP
  - [ ] 2.1 Write tests for email action mapping
  - [ ] 2.2 Map send_email to gmail_send_message tool
  - [ ] 2.3 Transform email parameters to Gmail format
  - [ ] 2.4 Handle email-specific errors (invalid recipient, etc.)
  - [ ] 2.5 Test with real Gmail integration
  - [ ] 2.6 Verify emails are actually sent

- [ ] 3. Integrate Calendar Agent with MCP
  - [ ] 3.1 Write tests for calendar action mapping
  - [ ] 3.2 Map create_event to calendar_create_event tool
  - [ ] 3.3 Implement date/time format conversion
  - [ ] 3.4 Map get_freebusy to calendar listing with filters
  - [ ] 3.5 Test with real Calendar integration
  - [ ] 3.6 Verify events appear in calendar

- [ ] 4. Integrate Other Agents with MCP
  - [ ] 4.1 Write tests for Slack, Drive, and custom agents
  - [ ] 4.2 Map Slack post_message action
  - [ ] 4.3 Map Drive spreadsheet operations
  - [ ] 4.4 Handle agents without direct MCP mapping
  - [ ] 4.5 Test each integration type
  - [ ] 4.6 Verify all integrations work correctly

- [ ] 5. Update SimpleWorkflowExecutor
  - [ ] 5.1 Write tests for integration service usage
  - [ ] 5.2 Replace simulator calls with integration service
  - [ ] 5.3 Maintain backward compatibility
  - [ ] 5.4 Add integration status logging
  - [ ] 5.5 Update error handling flow
  - [ ] 5.6 Verify all workflow tests pass

- [ ] 6. End-to-End Testing
  - [ ] 6.1 Create E2E test for complete workflow with all services
  - [ ] 6.2 Test workflow with missing integrations
  - [ ] 6.3 Test workflow with API failures
  - [ ] 6.4 Verify workflow history contains real results
  - [ ] 6.5 Test concurrent workflow execution
  - [ ] 6.6 Verify all E2E tests pass