# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-07-27-oauth-production-urls/spec.md

> Created: 2025-07-27
> Version: 1.0.0

## Technical Requirements

### OAuth URL Management
- Remove all hardcoded localhost URLs from production code paths
- Implement environment-aware URL construction using FRONTEND_URL and API_BASE_URL
- Maintain localhost support for development and testing environments only
- Add runtime validation that prevents localhost URLs in production mode

### Environment Variable Configuration
- Enforce FRONTEND_URL and API_BASE_URL as required variables in production
- Add OAUTH_REDIRECT_BASE_URL as optional override for complex deployments
- Implement startup validation with clear error messages for missing/invalid URLs
- Support both development (localhost) and production (HTTPS) configurations

### OAuth Provider Integration Points
- Update Composio integration manager to use dynamic URLs
- Update Klavis provider configurations to use environment variables
- Ensure Gmail, Calendar, and Slack integrations use production-safe URLs
- Validate callback URLs match OAuth provider registrations

### Security and Validation
- Implement HTTPS enforcement for production OAuth URLs
- Add hostname validation to prevent localhost in production
- Create URL format validation with proper error handling
- Ensure OAuth state parameter security across environments

## Approach Options

**Option A: Gradual Migration with Backward Compatibility**
- Pros: Lower risk, maintains existing functionality during transition
- Cons: Longer implementation, potential for missed hardcoded URLs

**Option B: Complete URL System Overhaul** (Selected)
- Pros: Comprehensive fix, eliminates all localhost issues, clean architecture
- Cons: Higher implementation effort, requires thorough testing

**Option C: Configuration-Only Fixes**
- Pros: Minimal code changes, quick deployment
- Cons: Doesn't address systemic issues, potential for future regressions

**Rationale:** Option B provides the most comprehensive solution and aligns with the critical production readiness requirements. The existing OAuth configuration system already has most of the infrastructure needed, so the overhaul is primarily about enforcement and validation rather than complete rebuild.

## External Dependencies

**No new external dependencies required** - This is primarily a configuration and validation improvement using existing Node.js capabilities and the current OAuth framework.

## Implementation Details

### Current OAuth Configuration Analysis
Based on code analysis, the current system:
- Uses `backend/config/oauth.ts` for URL construction
- Has fallback to localhost URLs in development
- Includes validation logic but needs strengthening
- Supports environment variable overrides

### Key Files to Modify
1. `backend/config/oauth.ts` - Core URL construction and validation
2. `backend/services/composio-integration-manager.ts` - Provider-specific URLs
3. `backend/config/__tests__/oauth*.test.ts` - Test updates for new validation
4. Environment configuration files (cloudbuild.yaml, .env.production)

### Environment Variables Required
- `FRONTEND_URL` (required in production): Main application domain
- `API_BASE_URL` (required in production): Backend API domain  
- `OAUTH_REDIRECT_BASE_URL` (optional): Override for complex deployments
- `NODE_ENV` (existing): Environment detection for validation rules

### Validation Rules
- Production mode: Require HTTPS URLs, block localhost domains
- Development mode: Allow localhost and HTTP for testing
- Test mode: Allow controlled localhost for automated testing
- Startup validation: Fail fast with clear error messages