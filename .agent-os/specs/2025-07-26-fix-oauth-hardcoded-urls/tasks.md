# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-07-26-fix-oauth-hardcoded-urls/spec.md

> Created: 2025-07-26
> Status: Ready for Implementation

## Tasks

- [ ] 1. Create OAuth Configuration Module
  - [ ] 1.1 Write tests for OAuth URL helper functions
  - [ ] 1.2 Create backend/config/oauth.ts with getOAuthRedirectUrl function
  - [ ] 1.3 Add URL validation and security checks
  - [ ] 1.4 Verify all tests pass

- [ ] 2. Implement Environment Validation
  - [ ] 2.1 Write tests for environment validation on startup
  - [ ] 2.2 Create backend/utils/environment.ts with validation logic
  - [ ] 2.3 Add validation to server startup in backend/hono.ts
  - [ ] 2.4 Add clear error messages for missing variables
  - [ ] 2.5 Verify all tests pass

- [ ] 3. Update OAuth Redirect Endpoints
  - [ ] 3.1 Write integration tests for OAuth redirect flows
  - [ ] 3.2 Replace hardcoded URLs in backend/hono.ts (lines 235, 238, 244)
  - [ ] 3.3 Update error redirect handling to use dynamic URLs
  - [ ] 3.4 Test with different environment configurations
  - [ ] 3.5 Verify all tests pass

- [ ] 4. Update Provider Factory Configuration
  - [ ] 4.1 Write tests for provider initialization with redirect URLs
  - [ ] 4.2 Update Klavis provider initialization to use dynamic URLs
  - [ ] 4.3 Update Composio provider initialization to use dynamic URLs
  - [ ] 4.4 Ensure backward compatibility with existing tokens
  - [ ] 4.5 Verify all tests pass

- [ ] 5. Production Deployment Verification
  - [ ] 5.1 Add E2E tests for production OAuth flows
  - [ ] 5.2 Update .env.production with FRONTEND_URL
  - [ ] 5.3 Deploy to staging and test OAuth flows
  - [ ] 5.4 Deploy to production and verify redirects work
  - [ ] 5.5 Document environment variables in README
  - [ ] 5.6 Verify all E2E tests pass in production