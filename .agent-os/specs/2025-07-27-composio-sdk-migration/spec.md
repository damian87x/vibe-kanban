# Spec Requirements Document

> Spec: Composio SDK Migration
> Created: 2025-07-27
> Status: Planning

## Overview

Migrate the existing Composio integration from the deprecated `composio-core` SDK to the new `@composio/core@next` SDK to resolve compatibility issues and leverage improved performance and reliability. This migration will ensure continued OAuth functionality for Gmail, Calendar, and Slack integrations while maintaining the existing provider abstraction layer.

## User Stories

### OAuth Integration Stability

As a TaskPilot user, I want to connect my Gmail, Calendar, and Slack accounts reliably, so that I can automate tasks across these services without authentication failures.

Currently, users may experience intermittent issues with the old SDK causing OAuth flows to fail or integrations to disconnect unexpectedly. The new SDK promises better stability and performance, ensuring users can maintain persistent connections to their third-party services. This directly impacts the core value proposition of TaskPilot as a unified workspace for task automation.

### Developer Experience

As a developer maintaining TaskPilot, I want to use the latest Composio SDK with better documentation and support, so that I can quickly resolve issues and add new integrations.

The old `composio-core` SDK is being deprecated, and Composio has indicated it will be sunset in the coming months. Migrating to the new SDK ensures continued support, access to bug fixes, and compatibility with new features. The new SDK also provides better TypeScript support and more intuitive API patterns.

## Spec Scope

1. **SDK Package Migration** - Replace `composio-core` with `@composio/core@next` throughout the codebase
2. **API Method Updates** - Update all Composio API calls to match new SDK patterns and method signatures
3. **Environment Configuration** - Add missing COMPOSIO_INTEGRATION_ID variables to production deployment configs
4. **OAuth Flow Updates** - Ensure OAuth callback URLs and flows work with the new SDK structure
5. **Testing & Verification** - Comprehensive testing of all three integrations (Gmail, Calendar, Slack) with the new SDK

## Out of Scope

- Migration away from Composio to a different OAuth provider
- Adding new integration services beyond Gmail, Calendar, and Slack
- Changing the provider abstraction pattern or factory architecture
- Modifying the Klavis integration or provider switching logic

## Expected Deliverable

1. All Composio OAuth integrations (Gmail, Calendar, Slack) functioning correctly with the new SDK in production
2. Deployment configurations updated with all required environment variables and secrets
3. Existing E2E tests passing and new tests added for migration-specific scenarios

## Spec Documentation

- Tasks: @.agent-os/specs/2025-07-27-composio-sdk-migration/tasks.md
- Technical Specification: @.agent-os/specs/2025-07-27-composio-sdk-migration/sub-specs/technical-spec.md
- API Specification: @.agent-os/specs/2025-07-27-composio-sdk-migration/sub-specs/api-spec.md
- Tests Specification: @.agent-os/specs/2025-07-27-composio-sdk-migration/sub-specs/tests.md