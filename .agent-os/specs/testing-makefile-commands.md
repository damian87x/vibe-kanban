# Testing Commands for Makefile Specification

## Overview
Add comprehensive testing commands to the Makefile that support unit tests, E2E tests with mocked providers, and E2E tests with real providers for both frontend and backend.

## Requirements

### 1. Unit Testing Commands
- Run backend unit tests
- Run frontend unit tests  
- Run all unit tests in parallel
- Support watch mode for development
- Support coverage reporting

### 2. E2E Testing Commands (Mocked)
- Run E2E tests with Mockoon mocked providers
- Support different test suites (smoke, api, chat, agents)
- Support headed, debug, and UI modes
- Ensure mock servers are running

### 3. E2E Testing Commands (Real)
- Run integration tests with real providers
- Support OpenRouter, Composio/Klavis real APIs
- Support headed and debug modes
- Environment validation for required API keys

### 4. Test Environment Management
- Setup test database
- Seed test users
- Start/stop mock servers
- Validate environment configurations

## Implementation Details

### Testing Hierarchy
```
make test              # Run all unit tests
make test-unit         # Run unit tests only
make test-e2e          # Run E2E with mocks
make test-e2e-real     # Run E2E with real providers
make test-all          # Run everything
```

### Unit Test Commands
```makefile
# Backend unit tests
test-backend           # Run backend unit tests
test-backend-watch     # Run backend tests in watch mode
test-backend-coverage  # Run backend tests with coverage

# Frontend unit tests  
test-frontend          # Run frontend unit tests
test-frontend-watch    # Run frontend tests in watch mode
test-frontend-coverage # Run frontend tests with coverage

# Combined
test-unit              # Run all unit tests
test-unit-watch        # Run all unit tests in watch mode
test-unit-coverage     # Run all unit tests with coverage
```

### E2E Test Commands (Mocked)
```makefile
# Setup
test-setup-mock        # Start mock servers (Mockoon)
test-teardown-mock     # Stop mock servers

# E2E with mocks
test-e2e               # Run all E2E tests with mocks
test-e2e-headed        # Run E2E tests in headed mode
test-e2e-debug         # Run E2E tests in debug mode
test-e2e-ui            # Run E2E tests with UI mode
test-e2e-smoke         # Run smoke tests only
test-e2e-api           # Run API tests only
test-e2e-chat          # Run chat tests only
test-e2e-agents        # Run agent tests only
```

### E2E Test Commands (Real Providers)
```makefile
# Environment validation
test-env-check         # Validate API keys for real providers

# E2E with real providers
test-e2e-real          # Run all integration tests with real providers
test-e2e-real-headed   # Run integration tests in headed mode
test-e2e-real-debug    # Run integration tests in debug mode
test-e2e-real-single   # Run single test with real providers
```

### Test Database Commands
```makefile
test-db-setup          # Create test database
test-db-migrate        # Run migrations on test database
test-db-seed           # Seed test users
test-db-reset          # Reset test database completely
```

### Combined Testing Workflows
```makefile
test-all               # Run all tests (unit + E2E mocked + E2E real)
test-ci                # Run tests for CI/CD pipeline
test-quick             # Quick test suite for development
test-full              # Full comprehensive test suite
```

## Environment Variables

### For Mocked Tests
```bash
USE_MOCKOON=true
DATABASE_URL=postgresql://postgres@localhost/mcp_backend_test
EXPO_PUBLIC_BYPASS_AUTH=true
```

### For Real Provider Tests
```bash
USE_MOCKOON=false
DATABASE_URL=postgresql://postgres@localhost/mcp_backend_test
OPENROUTER_API_KEY=required
COMPOSIO_API_KEY=required_if_composio
KLAVIS_CLIENT_ID=required_if_klavis
KLAVIS_CLIENT_SECRET=required_if_klavis
OAUTH_PROVIDER=klavis_or_composio
```

## Success Criteria
1. All test commands work reliably
2. Clear separation between mocked and real provider tests
3. Proper environment validation before running tests
4. Helpful error messages when prerequisites are missing
5. Color-coded output for better readability
6. Parallel execution where possible for speed

## Dependencies
- Playwright for E2E testing
- Jest for unit testing
- Mockoon for API mocking
- PostgreSQL for test database
- Environment validation scripts

## Implementation Notes
- Use Make variables for configuration
- Implement prerequisite checks
- Add helpful output messages
- Support CI/CD environments
- Maintain backwards compatibility with existing commands