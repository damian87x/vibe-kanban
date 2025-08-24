# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-08-22-test-coverage-fix/spec.md

> Created: 2025-08-22
> Status: Ready for Implementation

## Tasks

- [ ] 1. Fix import path issues in test files
  - [ ] 1.1 Write a script to find all @backend/ imports in test files
  - [ ] 1.2 Fix imports in SSL service tests (certificate-manager.test.ts, certbot-config.test.ts)
  - [ ] 1.3 Fix imports in integration service tests (integration.service.test.ts, composio-polling.service.test.ts)
  - [ ] 1.4 Fix imports in auth/OAuth tests (auth-service.test.ts, oauth-session.service.test.ts, oauth.test.ts)
  - [ ] 1.5 Fix imports in other service tests (trigger-condition-evaluator.test.ts, agent-template-version-manager.test.ts)
  - [ ] 1.6 Fix imports in utility tests (environment.test.ts, logger.test.ts, template-converter.test.ts)
  - [ ] 1.7 Update Jest moduleNameMapper configuration if needed
  - [ ] 1.8 Verify all import errors are resolved by running npm test

- [ ] 2. Fix tRPC router testing issues
  - [ ] 2.1 Write tests for the tRPC router _def property issue
  - [ ] 2.2 Create proper mock for tRPC router with _def property
  - [ ] 2.3 Fix the lazy loading implementation to properly export router
  - [ ] 2.4 Create test helper for tRPC endpoint testing
  - [ ] 2.5 Add integration tests for tRPC through HTTP
  - [ ] 2.6 Verify tRPC endpoints work with curl commands
  - [ ] 2.7 Ensure all tRPC tests pass

- [ ] 3. Add unit tests for refactored files
  - [ ] 3.1 Write comprehensive tests for app.ts
  - [ ] 3.2 Write tests for server.ts initialization
  - [ ] 3.3 Write tests for trpc/app-router.ts
  - [ ] 3.4 Write tests for lazy loading behavior
  - [ ] 3.5 Write tests for webhook endpoint
  - [ ] 3.6 Write tests for health check endpoints
  - [ ] 3.7 Run coverage report and verify improvement

- [ ] 4. Improve test coverage for critical paths
  - [ ] 4.1 Write tests for authentication flows
  - [ ] 4.2 Write tests for workflow execution
  - [ ] 4.3 Write tests for integration services
  - [ ] 4.4 Write tests for error handling paths
  - [ ] 4.5 Write tests for database operations
  - [ ] 4.6 Verify coverage reaches 60% minimum
  - [ ] 4.7 Generate coverage report

- [ ] 5. Create test utilities and documentation
  - [ ] 5.1 Create test data factories
  - [ ] 5.2 Create mock implementations for common services
  - [ ] 5.3 Create tRPC test client helper
  - [ ] 5.4 Document testing best practices
  - [ ] 5.5 Create example tests as templates
  - [ ] 5.6 Verify all tests run in under 30 seconds
  - [ ] 5.7 Ensure no flaky tests exist