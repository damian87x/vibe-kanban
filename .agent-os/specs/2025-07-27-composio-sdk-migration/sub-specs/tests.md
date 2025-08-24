# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-07-27-composio-sdk-migration/spec.md

> Created: 2025-07-27
> Version: 1.0.0

## Test Coverage

### Unit Tests

**ComposioIntegrationManager**
- Test new SDK client initialization with API key
- Test error handling when API key is missing
- Verify all method signatures remain compatible
- Test response normalization (entity_id → user_id mappings)
- Mock new SDK responses and verify correct data transformation
- Test error handling for new SDK error formats

**Provider Factory**
- Ensure Composio provider creation works with new SDK
- Test that provider switching logic remains intact
- Verify mock mode still works correctly

### Integration Tests

**OAuth Flow Tests**
- Test Gmail OAuth initiation with new SDK
- Test Calendar OAuth initiation with new SDK  
- Test Slack OAuth initiation with new SDK
- Verify redirect URLs are correctly formatted
- Test OAuth callback processing with new response format
- Verify connection status checks work with new SDK
- Test account disconnection flow

**Tool Execution Tests**
- Test Gmail send email action with new SDK
- Test Calendar create event action with new SDK
- Test Slack send message action with new SDK
- Verify parameter passing works correctly
- Test error handling for failed tool executions
- Verify response data extraction works properly

**E2E Journey Tests**
- Complete OAuth flow for each service (Gmail, Calendar, Slack)
- Execute at least one action per service after connection
- Verify integration status in UI after connection
- Test disconnection and verify cleanup
- Test error scenarios (invalid credentials, network issues)

### Performance Tests

**Response Time Benchmarks**
- Measure OAuth initiation time (target: < 500ms)
- Measure tool execution time (target: < 2s for simple operations)
- Compare with old SDK baseline performance
- Monitor memory usage during operations

### Mocking Requirements

- **Composio SDK Methods:** Mock all SDK method calls for unit tests
  - Use Jest mocks to simulate SDK responses
  - Create fixtures for common response patterns
  - Mock both success and error scenarios

- **Network Requests:** For integration tests, use Mockoon to simulate Composio API
  - OAuth initiation endpoints
  - Tool execution endpoints
  - Connection status endpoints
  - Account listing endpoints

- **Environment Variables:** Mock environment variables for tests
  - COMPOSIO_API_KEY
  - COMPOSIO_INTEGRATION_ID_* values
  - Frontend/backend URLs

### Test Data

**Test Accounts**
- Use test entity/user IDs: `test-user-1`, `test-user-2`
- Test integration IDs from environment variables
- Mock account IDs for connected services

**Test Scenarios**
1. **Happy Path:** Successful connection and tool execution
2. **Auth Failure:** Invalid API key or integration ID
3. **Network Issues:** Timeout and connection errors
4. **Invalid Data:** Malformed parameters or responses
5. **Edge Cases:** 
   - Duplicate connection attempts
   - Disconnecting already disconnected accounts
   - Executing tools on inactive connections

### Migration-Specific Tests

**SDK Compatibility Tests**
- Verify old data structures work with new SDK
- Test migration of existing connected accounts
- Ensure backward compatibility for stored configurations
- Test handling of deprecated fields

**Feature Flag Tests** (if implementing gradual rollout)
- Test SDK selection based on feature flags
- Verify fallback to old SDK when flag is off
- Test per-integration feature flag controls
- Ensure no cross-contamination between SDKs

### Regression Tests

**Existing E2E Tests**
- Run full E2E test suite after migration
- Focus on integration-dependent workflows
- Verify agent executions using integrations
- Test knowledge base features with document imports

**API Contract Tests**
- Verify all tRPC endpoints maintain same contracts
- Test response structures remain consistent
- Ensure error formats don't change
- Validate TypeScript types still match

### Test Execution Strategy

1. **Pre-Migration Baseline**
   - Run all tests with old SDK
   - Record performance metrics
   - Document any known issues

2. **During Migration**
   - Run unit tests after each code change
   - Run integration tests after major components updated
   - Use feature flags to test in isolation

3. **Post-Migration Validation**
   - Full E2E test suite execution
   - Performance comparison with baseline
   - Load testing with concurrent users
   - Production smoke tests after deployment

### Test Environment Setup

```bash
# Install new SDK for tests
npm install --save-dev @composio/core@next

# Set test environment variables
export COMPOSIO_API_KEY=test-api-key
export COMPOSIO_INTEGRATION_ID_GMAIL=test-gmail-id
export COMPOSIO_INTEGRATION_ID_CALENDAR=test-calendar-id
export COMPOSIO_INTEGRATION_ID_SLACK=test-slack-id
export USE_MOCKOON=true

# Run migration-specific tests
npm test -- --testPathPattern=composio-migration
npm run test:e2e -- --grep "composio|integration"
```