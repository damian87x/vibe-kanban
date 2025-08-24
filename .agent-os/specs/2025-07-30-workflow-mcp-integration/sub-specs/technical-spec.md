# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-07-30-workflow-mcp-integration/spec.md

> Created: 2025-07-30
> Version: 1.0.0

## Technical Requirements

### Integration Service Layer
- Create a new `WorkflowIntegrationService` to handle integration lookups and MCP tool calls
- Service should cache integration configs per user during workflow execution
- Handle provider abstraction (Composio/Klavis) transparently

### MCP Tool Mapping
- Map workflow agent actions to specific MCP tool names:
  - `email-agent.send_email` → `gmail_send_message`
  - `email-agent.analyze_email` → `gmail_get_message` + custom analysis
  - `calendar-agent.create_event` → `calendar_create_event`
  - `calendar-agent.get_freebusy` → `calendar_list_events` with time filtering
  - `slack-agent.post_message` → `slack_post_message`
  - `drive-agent.create_spreadsheet` → `drive_create_file` with spreadsheet type
  - `drive-agent.update_spreadsheet` → `drive_update_file`

### Parameter Transformation
- Transform workflow step parameters to MCP tool arguments:
  - Email: Map `to`, `subject`, `body` to Gmail API format
  - Calendar: Convert date strings to RFC3339 format
  - Slack: Map channel names to channel IDs via lookup

### Error Handling Strategy
- Check integration status before tool calls
- Provide specific error messages for common failures:
  - Missing integration: "Gmail integration not connected. Please connect your Gmail account."
  - Expired token: "Gmail access has expired. Please reconnect your account."
  - API error: Include actual error from service
- Continue workflow with failure status rather than throwing exceptions

### Database Integration
- Query `integrations` table for user's service integrations
- Use `normalizeIntegrationConfig` helper to handle different provider formats
- Log tool usage in `integration_usage_logs` table

## Approach Options

**Option A: Direct Replacement in SimpleWorkflowExecutor**
- Pros: Minimal code changes, quick implementation
- Cons: Mixes integration logic with workflow logic, harder to test

**Option B: Create Integration Service Layer** (Selected)
- Pros: Clean separation of concerns, easier testing, reusable for other features
- Cons: Requires additional service class

**Option C: Extend Existing MCP Tool Manager**
- Pros: Leverages existing tool management infrastructure
- Cons: Tool manager focused on AI chat, not workflow execution

**Rationale:** Option B provides the cleanest architecture and makes the integration logic reusable for other features while keeping the workflow executor focused on orchestration.

## External Dependencies

No new external dependencies required. The implementation will use:
- Existing `ProviderFactory` for MCP client creation
- Existing MCP client interfaces and adapters
- Existing database connection pool
- Existing logger utility

## Implementation Details

### WorkflowIntegrationService Structure
```typescript
class WorkflowIntegrationService {
  private mcpClient: IMCPClient;
  private integrationCache: Map<string, IntegrationConfig>;
  
  async executeAgentAction(
    userId: string,
    agent: string,
    action: string,
    parameters: any
  ): Promise<StepResult>;
  
  private async getIntegration(
    userId: string,
    service: string
  ): Promise<IntegrationConfig>;
  
  private mapToMCPTool(
    agent: string,
    action: string
  ): { toolName: string; parameterMapper: Function };
}
```

### Integration Status Checks
Before each tool call:
1. Verify integration exists in database
2. Check status is 'active'
3. Validate server instance ID is present
4. Handle provider-specific config normalization

### Fallback Behavior
- If USE_MOCKOON=true, continue using simulated responses
- If integration missing, return error result but continue workflow
- Log all attempts for debugging and usage tracking