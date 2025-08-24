# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-16-agent-template-dynamic-prompts/spec.md

> Created: 2025-08-16
> Version: 1.0.0

## Test Coverage

### Unit Tests

#### DynamicPromptGenerator

**Test Cases:**
- Generate prompt from valid template
- Handle missing required fields gracefully
- Apply custom parameters correctly
- Optimize prompts for different models (GPT-4, Claude, etc.)
- Cache key generation consistency
- Variable substitution in templates
- Integration capability mapping

**Edge Cases:**
- Empty template handling
- Invalid YAML/JSON structure
- Circular references in templates
- Maximum prompt length constraints

#### IntegrationContextBuilder

**Test Cases:**
- Build context from active integrations
- Handle disconnected integrations
- Map capabilities to prompt hints
- Format permissions correctly
- Handle OAuth token refresh

**Edge Cases:**
- No integrations connected
- Expired OAuth tokens
- Invalid integration configuration
- Rate limited API responses

#### ChatSessionManager

**Test Cases:**
- Initialize conversation from template
- Preserve template context
- Queue initial messages
- Link agent to conversation
- Handle concurrent sessions

**Edge Cases:**
- Duplicate session creation
- Session timeout handling
- Memory limit exceeded
- Network interruptions

### Integration Tests

#### Template to Chat Flow

**Test Scenarios:**
1. **Happy Path**
   - Select template → Generate prompt → Initialize chat → Execute agent
   - Verify all context preserved
   - Confirm integrations available

2. **Missing Integrations**
   - Attempt execution without required integrations
   - Verify proper error messaging
   - Test integration connection flow

3. **Custom Parameters**
   - Modify prompt before execution
   - Verify customizations applied
   - Test parameter validation

4. **Concurrent Executions**
   - Multiple users executing same template
   - Verify isolation between sessions
   - Test resource pooling

#### API Endpoint Tests

**POST /api/trpc/prompts.generate**
- Valid template ID returns prompt
- Invalid template ID returns 404
- Caching works correctly
- Custom parameters override defaults
- Rate limiting enforced

**POST /api/trpc/agents.executeFromTemplate**
- Successful execution flow
- Integration validation
- Error handling for failures
- Execution tracking
- WebSocket events fired

**POST /api/trpc/chat.initializeFromTemplate**
- Conversation created successfully
- System prompt set correctly
- Context preserved
- Auto-execution if requested

### E2E Tests

#### User Journey: Execute Agent from Template

```typescript
test('User executes agent from template gallery', async ({ page }) => {
  // Given: User is logged in with Gmail connected
  await givenUserIsLoggedIn('test@example.com');
  await givenIntegrationConnected('gmail');
  
  // When: User navigates to template and clicks "Run Agent"
  await page.goto('/templates');
  await page.click('[data-template="email-assistant"]');
  await page.click('[data-action="run-agent"]');
  
  // Then: User is redirected to chat with agent executing
  await expect(page).toHaveURL(/\/assistant/);
  await expect(page.locator('.agent-message')).toContainText('I\'m ready to help');
  await expect(page.locator('.system-context')).toContainText('Gmail connected');
});
```

#### User Journey: Customize and Save Prompt

```typescript
test('User customizes prompt template', async ({ page }) => {
  // Given: User viewing agent template
  await page.goto('/agent/template-id');
  
  // When: User clicks customize and modifies prompt
  await page.click('[data-action="customize-prompt"]');
  await page.fill('[data-field="goal"]', 'Custom goal text');
  await page.click('[data-action="save-template"]');
  
  // Then: Custom template is saved and usable
  await expect(page.locator('.success-message')).toBeVisible();
  await page.click('[data-action="use-custom"]');
  await expect(page.locator('.system-prompt')).toContainText('Custom goal text');
});
```

#### User Journey: Monitor Agent Execution

```typescript
test('User monitors agent execution progress', async ({ page }) => {
  // Given: Agent execution started
  await startAgentExecution('template-id');
  
  // When: User views execution status
  await page.goto('/agents/executions');
  
  // Then: Real-time updates shown
  await expect(page.locator('.execution-status')).toContainText('Running');
  await page.waitForSelector('.execution-complete', { timeout: 30000 });
  await expect(page.locator('.execution-metrics')).toBeVisible();
});
```

### Performance Tests

#### Load Testing

**Scenarios:**
1. **Concurrent Prompt Generation**
   - 100 simultaneous requests
   - Target: < 100ms p95 latency
   - Verify cache effectiveness

2. **Agent Execution Scale**
   - 50 concurrent agent executions
   - Monitor resource usage
   - Verify queue management

3. **Template Processing**
   - Large complex templates (> 10KB)
   - Nested workflow structures
   - Target: < 200ms generation time

### Security Tests

#### Prompt Injection Prevention

**Test Cases:**
- Attempt to inject malicious prompts
- Test template sanitization
- Verify output escaping
- Check for information leakage

#### Authorization Tests

**Test Cases:**
- Access control for templates
- User isolation verification
- Integration permission checks
- Rate limiting enforcement

### Mocking Requirements

#### External Services

**OpenAI/Claude API**
- Mock completion responses
- Simulate rate limiting
- Test timeout handling
- Error response scenarios

**OAuth Providers (Gmail, Slack, etc.)**
- Mock token validation
- Simulate token refresh
- Test scope verification
- Handle disconnection

**Database**
- Mock for unit tests
- Use test database for integration
- Transaction rollback for E2E

#### Time-based Tests

**Caching Expiry**
- Mock time progression
- Verify cache invalidation
- Test TTL boundaries

**Execution Timeouts**
- Mock long-running operations
- Test timeout handling
- Verify cleanup procedures

## Test Data

### Fixtures

```typescript
// Sample template for testing
export const testTemplate = {
  id: 'test-template-1',
  name: 'Email Assistant',
  default_workflow: {
    goal: 'Help manage emails efficiently',
    steps: ['Read emails', 'Draft responses', 'Schedule sends']
  },
  required_integrations: ['gmail'],
  model: 'gpt-4'
};

// Sample user with integrations
export const testUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  integrations: [
    { service: 'gmail', status: 'active', token: 'mock-token' }
  ]
};

// Sample generated prompt
export const testPrompt = {
  id: 'test-prompt-1',
  systemPrompt: 'You are an email assistant...',
  goal: 'Help manage emails efficiently',
  context: {
    integrations: ['gmail'],
    capabilities: ['read_email', 'send_email']
  }
};
```

## Coverage Requirements

- **Unit Tests:** 90% code coverage
- **Integration Tests:** All API endpoints covered
- **E2E Tests:** Critical user journeys covered
- **Performance Tests:** Load and stress scenarios
- **Security Tests:** All authorization paths tested

## CI/CD Integration

```yaml
# GitHub Actions test workflow
test:
  runs-on: ubuntu-latest
  steps:
    - name: Unit Tests
      run: npm run test:unit
    
    - name: Integration Tests
      run: npm run test:integration
      
    - name: E2E Tests
      run: npm run test:e2e
      
    - name: Coverage Report
      run: npm run test:coverage
      
    - name: Performance Tests (nightly)
      if: github.event.schedule == '0 2 * * *'
      run: npm run test:performance
```