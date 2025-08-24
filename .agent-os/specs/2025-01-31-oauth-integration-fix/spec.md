# Spec Requirements Document

> Spec: OAuth Integration Fix
> Created: 2025-01-31
> Status: Planning

## Overview

Fix critical OAuth integration failures including broken disconnect functionality, incorrect API usage mixing MCP and Connected Accounts APIs, and unreliable connection status synchronization. This will restore users' ability to connect and disconnect integrations reliably, reducing support tickets and improving the core integration experience.

## User Stories

### Connect Integration

As a user, I want to connect my Gmail/Calendar/Slack accounts, so that I can use them in workflows and automations.

Currently, when I click "Connect" on the integrations page, the OAuth flow starts but often fails silently. The popup closes but the integration doesn't show as connected. I have to retry multiple times, and even then it's unclear if it worked. The system should reliably complete OAuth flows and show accurate connection status immediately.

### Disconnect Integration

As a user, I want to disconnect integrations I no longer need, so that I can manage my privacy and connected services.

Currently, when I click "Disconnect", nothing happens. The button shows a loading state briefly but the integration remains connected. This forces me to contact support to remove integrations. The system should immediately disconnect the integration both locally and from the OAuth provider.

### View Connection Status

As a user, I want to see accurate real-time status of my integrations, so that I know which services are available for use.

Currently, the integration page shows outdated or incorrect statuses. Sometimes it shows "connected" when the connection has expired, or "disconnected" when it's actually working. The system should sync status with the OAuth provider and display accurate information.

## Spec Scope

1. **Fix API Usage** - Replace incorrect connectedAccounts.get() calls with proper MCP API getUserConnectionStatus() for status checks
2. **Fix Disconnect Flow** - Ensure disconnect button properly removes integration from both database and Composio
3. **Fix OAuth Completion** - Update polling logic to use correct APIs and handle ID format changes
4. **Add Error Handling** - Implement proper error messages and fallback behavior for API failures
5. **Add Logging** - Comprehensive logging for debugging OAuth flows in production

## Out of Scope

- Migrating to a different OAuth provider
- Adding new integration types beyond Gmail/Calendar/Slack
- Redesigning the integrations UI
- Implementing OAuth refresh token rotation
- Adding integration usage analytics

## Expected Deliverable

1. Users can reliably connect integrations on first attempt with clear success/failure feedback
2. Disconnect button immediately removes integration from both local database and Composio
3. Integration status accurately reflects current connection state without manual refresh

## Spec Documentation

- Tasks: @.agent-os/specs/2025-01-31-oauth-integration-fix/tasks.md
- Technical Specification: @.agent-os/specs/2025-01-31-oauth-integration-fix/sub-specs/technical-spec.md
- API Specification: @.agent-os/specs/2025-01-31-oauth-integration-fix/sub-specs/api-spec.md
- Tests Specification: @.agent-os/specs/2025-01-31-oauth-integration-fix/sub-specs/tests.md