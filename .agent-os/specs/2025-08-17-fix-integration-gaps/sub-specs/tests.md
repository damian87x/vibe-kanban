# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-17-fix-integration-gaps/spec.md

> Created: 2025-08-17
> Version: 1.0.0

## Test Coverage

### Unit Tests

**AgentSessionManager**
- Create session with valid agent and template
- Reject session creation with invalid IDs
- Update session status with valid transitions
- Prevent invalid status transitions
- Save and retrieve checkpoints
- Clean up expired sessions
- Handle concurrent session updates

**DynamicPromptGenerator**
- Generate prompt from simple template
- Interpolate variables correctly
- Map integrations to template capabilities
- Handle missing variables gracefully
- Cache generated prompts
- Invalidate cache on template update
- Generate prompts for different template types

**IntegrationEventService**
- Record connection events
- Track tool usage events
- Handle error events
- Query event history by type
- Filter events by date range
- Aggregate tool usage statistics

**KnowledgeVectorService**
- Generate embeddings for text chunks
- Split documents with proper overlap
- Search by vector similarity
- Filter results by threshold
- Handle embedding API failures
- Retry failed embedding requests
- Update embeddings for modified documents

**TemplateChatBridge**
- Match message to template with confidence scoring
- Execute template from chat context
- Pass variables to template execution
- Handle template execution failures
- Create session for template execution

### Integration Tests

**Agent Session Flow**
- Create session → Update status → Add checkpoint → Complete
- Create session → Pause → Resume → Complete
- Create session → Error → Recovery → Continue
- Multiple concurrent sessions for same agent
- Session persistence across server restart

**Integration Event Flow**
- Connect integration → Discover tools → Use tool → Track event
- Disconnect integration → Update tool availability → Notify chat
- Integration error → Retry → Success → Update status
- Multiple integrations with overlapping tools

**Template-Chat Integration**
- Send message → Match template → Generate prompt → Execute
- Template with variables → Collect values → Generate → Execute
- No matching template → Suggest alternatives → User selection
- Template execution → Create session → Track progress

**Knowledge Base Vector Search**
- Upload document → Generate embeddings → Search → Find matches
- Update document → Regenerate embeddings → Search → Find updated
- Delete document → Remove embeddings → Search → No results
- Complex query → Multiple matches → Rank by similarity

### E2E Tests

**Complete Agent Workflow**
```typescript
test('User executes agent from template gallery', async ({ page }) => {
  // Navigate to agents page
  await page.goto('/agents');
  
  // Select template from gallery
  await page.click('[data-template="email-assistant"]');
  
  // Click Run Agent
  await page.click('button:has-text("Run Agent")');
  
  // Verify session created
  await expect(page.locator('[data-session-status]')).toHaveText('Running');
  
  // Verify chat opened with context
  await expect(page.locator('.chat-system-prompt')).toContainText('Email Assistant');
  
  // Send message
  await page.fill('[data-chat-input]', 'Summarize my unread emails');
  await page.click('[data-send-button]');
  
  // Verify integration tools used
  await expect(page.locator('[data-tool-indicator]')).toBeVisible();
  
  // Verify response with email summary
  await expect(page.locator('[data-chat-response]')).toContainText('unread messages');
});
```

**Knowledge Base Semantic Search**
```typescript
test('User uploads and searches documents', async ({ page }) => {
  // Navigate to knowledge base
  await page.goto('/knowledge');
  
  // Upload document
  await page.setInputFiles('[data-file-input]', 'test-doc.pdf');
  
  // Wait for processing
  await expect(page.locator('[data-status="completed"]')).toBeVisible();
  
  // Search with semantic query
  await page.fill('[data-search-input]', 'quarterly revenue trends');
  
  // Verify semantic matches (not just keyword)
  await expect(page.locator('[data-search-results]')).toContainText('Q3 financial performance');
  
  // Verify similarity scores shown
  await expect(page.locator('[data-similarity-score]')).toBeVisible();
});
```

**Real-time Integration Events**
```typescript
test('Integration status updates in real-time', async ({ page }) => {
  // Start chat
  await page.goto('/chat');
  
  // Open integrations in second tab
  const integrationsPage = await context.newPage();
  await integrationsPage.goto('/integrations');
  
  // Disconnect Gmail in integrations tab
  await integrationsPage.click('[data-integration="gmail"] [data-disconnect]');
  
  // Verify chat shows disconnection immediately
  await expect(page.locator('[data-integration-status="gmail"]')).toHaveClass(/disconnected/);
  
  // Reconnect Gmail
  await integrationsPage.click('[data-integration="gmail"] [data-connect]');
  
  // Verify chat shows reconnection
  await expect(page.locator('[data-integration-status="gmail"]')).toHaveClass(/connected/);
});
```

### Mocking Requirements

**OpenAI API**
- Mock embedding generation for tests
- Return consistent vectors for deterministic tests
- Simulate API errors for error handling tests
- Mock rate limiting responses

**Integration Providers (Composio/Klavis)**
- Mock OAuth flow for connection tests
- Simulate tool discovery responses
- Mock tool execution results
- Simulate connection failures

**WebSocket Events**
- Mock real-time event stream
- Simulate connection drops and reconnects
- Test message buffering during disconnection

**S3 Service**
- Mock presigned URL generation
- Simulate upload success/failure
- Mock file retrieval

### Performance Tests

**Load Testing**
- 100 concurrent agent sessions
- 1000 vector searches per minute
- 50 WebSocket connections per server
- Template generation under load

**Benchmark Targets**
- Session creation: < 500ms (p95)
- Prompt generation: < 100ms (p95)
- Vector search: < 200ms (p95)
- Integration discovery: < 50ms (p95)

### Test Data

**Fixtures**
- Sample templates with various complexities
- Test documents with known embeddings
- Mock integration configurations
- Sample agent definitions

**Seeds**
- Test users with different permission levels
- Pre-configured integrations
- Sample knowledge base documents
- Agent templates in various states

### Continuous Integration

**Test Suites**
1. Unit tests: Run on every commit
2. Integration tests: Run on PR creation
3. E2E tests: Run before merge to main
4. Performance tests: Run nightly

**Coverage Requirements**
- Unit tests: 90% code coverage
- Integration tests: 80% feature coverage
- E2E tests: Critical user paths
- No decrease in coverage allowed