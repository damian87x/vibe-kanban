# Spec Requirements Document

> Spec: Workflow MCP Integration
> Created: 2025-07-30
> Status: Planning

## Overview

Replace simulated agents in the workflow executor with real MCP integrations to enable actual email sending, calendar event creation, and Slack messaging. This will make workflows functional by connecting to real services through the existing OAuth infrastructure.

## User Stories

### Workflow Automation with Real Services

As a user who has connected their integrations, I want workflows to actually interact with my services, so that my automations produce real results.

When I execute a workflow that includes sending an email, the system should use my connected Gmail integration to send the actual email through the Gmail API. Similarly, when creating calendar events or posting Slack messages, the system should use my authenticated integrations to perform these actions in the real services.

### Integration Status Awareness

As a user running workflows, I want clear feedback when integrations are not connected or fail, so that I can take corrective action.

The workflow executor should check integration status before attempting to use services and provide clear error messages when integrations are missing or have expired credentials. This prevents confusion when workflows appear to run but don't produce expected results.

## Spec Scope

1. **MCP Client Integration** - Replace simulated agent methods with real MCP tool calls
2. **Integration Discovery** - Retrieve user integrations from database and use appropriate server instances
3. **Tool Mapping** - Map workflow actions to specific MCP tool names and parameters
4. **Error Handling** - Handle missing integrations, expired tokens, and API failures gracefully
5. **Backward Compatibility** - Maintain existing workflow template structure and execution flow

## Out of Scope

- Modifying workflow template format or structure
- Adding new agent types or capabilities
- Changing the workflow execution engine architecture
- Implementing new MCP servers or tools
- OAuth flow improvements

## Expected Deliverable

1. Workflows successfully send real emails through connected Gmail accounts
2. Calendar events are created in user's Google Calendar when workflow includes calendar actions
3. Slack messages are posted to configured channels through connected Slack workspaces
4. Clear error messages when integrations are missing or fail

## Spec Documentation

- Tasks: @.agent-os/specs/2025-07-30-workflow-mcp-integration/tasks.md
- Technical Specification: @.agent-os/specs/2025-07-30-workflow-mcp-integration/sub-specs/technical-spec.md
- Tests Specification: @.agent-os/specs/2025-07-30-workflow-mcp-integration/sub-specs/tests.md