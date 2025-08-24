# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-07-30-workflow-mcp-integration/spec.md

> Created: 2025-07-30
> Version: 1.0.0

## Test Coverage

### Unit Tests

**WorkflowIntegrationService**
- Test MCP tool mapping for each agent/action combination
- Test parameter transformation for email, calendar, and Slack
- Test integration lookup with caching behavior
- Test error handling for missing integrations
- Test provider abstraction (Composio vs Klavis configs)

**SimpleWorkflowExecutor**
- Test integration service is called instead of simulators
- Test workflow continues on integration failure
- Test step results contain real API responses
- Test backward compatibility with existing workflows

### Integration Tests

**Email Workflow Execution**
- Test sending email through real Gmail integration
- Test email analysis with actual message retrieval
- Test handling of invalid email addresses
- Test rate limiting and quota errors

**Calendar Workflow Execution**
- Test creating calendar events with various parameters
- Test free/busy time retrieval and parsing
- Test handling of conflicting events
- Test timezone conversions

**Slack Workflow Execution**
- Test posting messages to channels
- Test channel lookup by name
- Test handling of private channels
- Test message formatting preservation

**Multi-Service Workflow**
- Test workflow using email + calendar + Slack
- Test data passing between different services
- Test partial failures (one service fails, others succeed)

### E2E Tests

**Complete Workflow Journey**
- User connects Gmail, Calendar, and Slack integrations
- User creates workflow with all three services
- User executes workflow and verifies:
  - Email appears in sent folder
  - Calendar event shows in calendar
  - Slack message posted to channel
- Test workflow history shows real results

**Integration Failure Handling**
- Disconnect integration mid-workflow
- Verify clear error messages
- Verify workflow marks failed steps
- Test re-running after reconnecting

### Mocking Requirements

**MCP Client Mock**
- Mock successful tool calls with realistic responses
- Mock various failure scenarios (auth, network, rate limit)
- Mock different provider response formats

**Database Mock**
- Mock integration queries with various states
- Mock missing integrations
- Mock expired tokens

**External Service Mocks**
- Gmail API response mocks
- Google Calendar API response mocks
- Slack API response mocks
- Include realistic delays and response formats

## Test Scenarios

### Success Scenarios
1. Execute email workflow with valid Gmail integration
2. Create calendar event with attendees and reminders
3. Post Slack message with formatting and mentions
4. Run VC research workflow with Drive spreadsheet creation

### Failure Scenarios
1. Execute workflow with no Gmail integration connected
2. Send email with invalid recipient address
3. Create calendar event in the past
4. Post Slack message to non-existent channel
5. Execute with expired OAuth tokens

### Edge Cases
1. Very large email body (>10MB)
2. Calendar event spanning multiple days
3. Slack message with 100+ mentions
4. Concurrent workflows using same integration
5. Integration disconnected during execution

## Performance Tests

- Measure overhead of real API calls vs simulated
- Test workflow execution with 50+ steps
- Verify integration caching reduces database queries
- Monitor memory usage with large responses