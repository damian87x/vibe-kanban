# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-07-26-fix-oauth-hardcoded-urls/spec.md

> Created: 2025-07-26
> Version: 1.0.0

## Technical Requirements

- Replace hardcoded `http://localhost:8081` URLs in OAuth redirect flows
- Implement dynamic URL construction based on environment variables
- Maintain backward compatibility with existing OAuth tokens
- Support multiple deployment environments (development, staging, production)
- Validate environment configuration on server startup
- Provide clear error messages for misconfiguration

## Approach Options

**Option A:** Single FRONTEND_URL Environment Variable
- Pros: Simple configuration, single source of truth, easy to understand
- Cons: Less flexibility for complex deployments

**Option B:** Separate Variables for Each OAuth Provider (Selected)
- Pros: Maximum flexibility, provider-specific URLs possible, easier debugging
- Cons: More configuration required, potential for inconsistency

**Option C:** Auto-detection from Request Headers
- Pros: No configuration needed, works automatically
- Cons: Security concerns, may not work behind proxies, complex implementation

**Rationale:** Option B selected for maximum flexibility while maintaining security. Allows different redirect URLs per provider if needed and makes debugging easier by clearly showing which URL each provider uses.

## Implementation Details

### Environment Variables

```typescript
// Required environment variables
FRONTEND_URL=https://takspilot-728214876651.europe-west1.run.app  // Base frontend URL
OAUTH_REDIRECT_BASE_URL=${FRONTEND_URL}  // Optional override for OAuth redirects
```

### Code Changes Required

1. **backend/hono.ts** - OAuth redirect endpoints (lines 235, 238, 244)
   - Replace hardcoded URLs with `getOAuthRedirectUrl()` helper
   
2. **backend/services/provider-factory.ts** - OAuth provider initialization
   - Pass redirect URLs to providers during initialization
   
3. **backend/config/oauth.ts** (new file) - Centralized OAuth configuration
   - Helper functions for URL construction
   - Environment variable validation
   
4. **backend/utils/environment.ts** (new file) - Environment validation
   - Startup validation for required variables
   - Clear error messages for missing configuration

### URL Construction Logic

```typescript
function getOAuthRedirectUrl(service: string, status: 'success' | 'error'): string {
  const baseUrl = process.env.OAUTH_REDIRECT_BASE_URL || 
                  process.env.FRONTEND_URL || 
                  'http://localhost:8081';
  
  const params = new URLSearchParams({
    oauth: status,
    service: service
  });
  
  return `${baseUrl}/integrations?${params.toString()}`;
}
```

### Security Considerations

- Never log full OAuth redirect URLs in production
- Validate redirect URLs against whitelist of allowed domains
- Use HTTPS in production environments
- Sanitize service parameter to prevent injection

## External Dependencies

No new external dependencies required. This change uses existing Node.js URL APIs and environment variable handling.