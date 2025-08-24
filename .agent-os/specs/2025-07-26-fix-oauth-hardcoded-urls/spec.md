# Spec Requirements Document

> Spec: Fix Hardcoded OAuth URLs
> Created: 2025-07-26
> Status: Planning

## Overview

Replace all hardcoded localhost URLs in OAuth redirect flows with environment variables to enable proper production deployment. This fix is critical for TaskPilot to function correctly in production environments where OAuth providers need to redirect back to the production domain instead of localhost.

## User Stories

### OAuth Integration Flow

As a user connecting Gmail/Calendar/Slack integrations, I want to be redirected back to the correct application URL after OAuth authorization, so that my integrations can be successfully connected in production.

Currently, after authorizing OAuth access, users are redirected to localhost:8081 even when using the production application at https://takspilot-728214876651.europe-west1.run.app, causing the integration flow to fail completely.

### Developer Deployment

As a developer deploying TaskPilot to different environments, I want OAuth redirect URLs to automatically adapt to the deployment environment, so that I don't need to modify code for each deployment.

The system should use environment variables to determine the correct redirect URL, supporting localhost for development, staging URLs for testing, and production URLs for live deployments.

## Spec Scope

1. **Environment Variable Configuration** - Add FRONTEND_URL environment variable for dynamic redirect URLs
2. **OAuth Redirect Updates** - Replace all hardcoded localhost references in OAuth flows with dynamic URLs
3. **Provider Factory Updates** - Ensure OAuth providers receive correct redirect URLs from environment
4. **Configuration Validation** - Validate required environment variables on server startup
5. **Documentation Updates** - Document all OAuth-related environment variables

## Out of Scope

- Changing OAuth provider implementations (Klavis/Composio)
- Modifying OAuth permission scopes
- Adding new OAuth providers
- Implementing OAuth token refresh logic
- Frontend OAuth UI changes

## Expected Deliverable

1. OAuth redirects work correctly in production at https://takspilot-728214876651.europe-west1.run.app
2. Environment variables control all OAuth redirect URLs with no hardcoded values
3. Clear error messages when required environment variables are missing

## Spec Documentation

- Tasks: @.agent-os/specs/2025-07-26-fix-oauth-hardcoded-urls/tasks.md
- Technical Specification: @.agent-os/specs/2025-07-26-fix-oauth-hardcoded-urls/sub-specs/technical-spec.md
- Tests Specification: @.agent-os/specs/2025-07-26-fix-oauth-hardcoded-urls/sub-specs/tests.md