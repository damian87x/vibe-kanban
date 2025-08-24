# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-07-27-oauth-production-urls/spec.md

> Created: 2025-07-27
> Version: 1.0.0

## Test Coverage

### Unit Tests

**OAuth Configuration Module**
- Validate URL construction with different environment variable combinations
- Test localhost detection and blocking in production mode
- Verify HTTPS enforcement for production URLs
- Test error handling for malformed URLs
- Validate fallback behavior in development mode

**URL Validation Functions**
- Test hostname validation (localhost, 127.0.0.1, production domains)
- Test protocol validation (HTTP vs HTTPS requirements)
- Test URL format validation and error messages
- Test environment-specific validation rules

**Integration Manager Classes**
- Test Composio integration manager URL construction
- Test Klavis provider URL configuration
- Verify callback URL generation for each OAuth provider
- Test error handling for invalid OAuth configurations

### Integration Tests

**OAuth Flow End-to-End**
- Test complete OAuth flow in development environment with localhost
- Test OAuth flow validation in production mode (should block localhost)
- Test OAuth callback URL generation matches provider registrations
- Verify environment variable loading and validation during startup

**Environment Configuration**
- Test application startup with valid production environment variables
- Test application startup failure with localhost URLs in production
- Test development mode allows localhost URLs
- Verify error messages provide clear guidance for configuration issues

**OAuth Provider Integration**
- Test Gmail OAuth flow with production URLs
- Test Calendar OAuth flow with production URLs  
- Test Slack OAuth flow with production URLs
- Verify OAuth state parameter handling across environments

### Feature Tests

**Production Deployment Simulation**
- Test OAuth flows work correctly with production-like URLs in staging
- Test environment variable validation catches configuration issues
- Verify no localhost URLs leak into production OAuth requests
- Test OAuth provider redirects work with production domains

**Developer Workflow**
- Test development environment continues to work with localhost
- Test automated test suite works with controlled localhost URLs
- Verify environment switching doesn't break OAuth configuration
- Test debugging capabilities for OAuth configuration issues

### Mocking Requirements

**Environment Variables**
- Mock NODE_ENV for different environment tests (development, production, test)
- Mock FRONTEND_URL and API_BASE_URL for various configuration scenarios
- Mock OAUTH_REDIRECT_BASE_URL for override testing

**OAuth Provider Responses**
- Mock OAuth provider callback responses for testing redirect handling
- Mock OAuth error responses to test error handling paths
- Mock network failures for testing resilience

**URL Validation**
- Mock URL constructor for testing malformed URL handling
- Mock hostname resolution for testing domain validation
- Mock HTTPS detection for protocol validation testing

## Test Environment Setup

### Test Configuration Files
- `.env.test` - Test environment variables with localhost allowed
- `.env.production.test` - Production-like environment for validation testing
- Test fixtures for various OAuth provider configurations

### Test Data Requirements
- Valid production domain examples
- Invalid localhost examples for production mode
- Malformed URL examples for validation testing
- OAuth provider callback URL patterns

### Performance Testing
- Test OAuth URL construction performance under load
- Verify validation doesn't significantly impact startup time
- Test memory usage of URL validation caching

## Automated Test Integration

### CI/CD Pipeline Tests
- Add environment variable validation to deployment pipeline
- Test OAuth configuration in staging environment before production
- Verify no localhost URLs in production build artifacts
- Add OAuth flow smoke tests for production deployments