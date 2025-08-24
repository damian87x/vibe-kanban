# Spec Requirements Document

> Spec: OAuth Production URLs
> Created: 2025-07-27
> Status: Planning

## Overview

Eliminate all remaining hardcoded localhost URLs in OAuth flows and implement comprehensive production-ready URL management for secure authentication across all environments. This critical production fix will ensure OAuth integrations work properly in production and meet security requirements for the production launch.

## User Stories

### Secure Production OAuth Flow

As a business professional using TaskPilot in production, I want to connect my Gmail, Calendar, and Slack accounts seamlessly, so that I can automate my workflows without encountering broken authentication flows or security warnings.

The OAuth flow should work identically whether I'm accessing TaskPilot from the production domain, staging environment, or during development. When I click "Connect Gmail," the system should redirect me to Google's OAuth consent screen with the correct production callback URLs, complete the authorization successfully, and return me to the integrations page with a confirmed connection.

### Developer Environment Safety

As a developer working on TaskPilot, I want the OAuth system to prevent accidental use of localhost URLs in production, so that security vulnerabilities are caught before deployment.

The system should validate OAuth URLs on startup and fail fast if localhost URLs are detected in production mode. Development mode should continue to work with localhost for testing, but production deployments should enforce HTTPS production domains only.

### Administrator Configuration Control

As a system administrator deploying TaskPilot, I want clear configuration options for OAuth URLs across different environments, so that I can deploy to staging, production, and testing environments without code changes.

Environment variables should control all OAuth endpoints, with clear documentation and validation. The system should provide helpful error messages if URLs are misconfigured and support multiple deployment patterns (single domain, CDN, multi-region).

## Spec Scope

1. **OAuth URL Validation System** - Implement comprehensive validation that prevents localhost URLs in production and validates HTTPS requirements
2. **Environment-Based URL Construction** - Create dynamic URL building that adapts to deployment environment using configurable base URLs
3. **Fallback URL Management** - Replace all hardcoded localhost fallbacks with environment-aware defaults that fail safely in production
4. **Test Environment Compatibility** - Ensure test suites continue to work with controlled localhost URLs for automated testing
5. **Configuration Documentation** - Provide clear setup instructions for production deployment with all required environment variables

## Out of Scope

- OAuth provider registration or credential management (handled separately)
- Implementation of new OAuth providers beyond existing Gmail, Calendar, Slack
- OAuth token refresh logic improvements (existing implementation is sufficient)
- Multi-tenant OAuth configuration (single tenant focus for now)
- OAuth security audit or penetration testing (separate security review needed)

## Expected Deliverable

1. **Production OAuth flows work correctly** - Users can successfully connect Gmail, Calendar, and Slack in production without localhost-related failures
2. **Environment validation prevents security issues** - System fails fast on startup if localhost URLs are detected in production mode
3. **All automated tests pass** - Test suite continues to work with proper localhost handling in test environment

## Spec Documentation

- Tasks: @.agent-os/specs/2025-07-27-oauth-production-urls/tasks.md
- Technical Specification: @.agent-os/specs/2025-07-27-oauth-production-urls/sub-specs/technical-spec.md
- Tests Specification: @.agent-os/specs/2025-07-27-oauth-production-urls/sub-specs/tests.md