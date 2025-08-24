# Spec Requirements Document

> Spec: Complete Workspace Restructure
> Created: 2025-08-18
> Status: Planning

## Overview

Complete the partial npm workspaces implementation to properly separate frontend and backend concerns, enabling independent development, testing, and deployment while reducing the monolithic complexity of the current structure.

## User Stories

### Developer Workflow Improvement

As a developer, I want to work on either frontend or backend independently, so that I can have faster install times, clearer dependencies, and focused testing.

The current monolithic structure with 160+ dependencies in one package.json makes development slow and confusing. With proper workspace separation, I can run `npm run dev:frontend` to work only on the UI, or `npm run dev:backend` for API work, with each having their own dependencies and environment configuration.

### Clean Test Organization

As a developer, I want tests co-located with the code they test, so that I can easily find and maintain test coverage without searching through scattered test directories.

Currently tests are spread across multiple locations (__tests__ at root, backend/, src/), making it difficult to understand test coverage. With workspace-based test organization, frontend tests will be in src/frontend/__tests__ and backend tests in src/backend/__tests__, with only E2E tests at the root level.

### Environment Configuration Isolation

As a DevOps engineer, I want separate environment configurations for frontend and backend, so that I can deploy and configure each tier independently without exposing unnecessary secrets.

The single .env file currently contains both frontend and backend secrets mixed together. With separate .env files per workspace, the frontend only gets EXPO_PUBLIC_ variables it needs, while backend keeps database credentials and API keys isolated.

## Spec Scope

1. **Complete NPM Workspaces Setup** - Add frontend to workspaces config and configure proper workspace scripts
2. **Reorganize Test Structure** - Move tests to their respective workspace __tests__ directories
3. **Split Environment Configuration** - Create separate .env files for frontend and backend workspaces
4. **Remove Duplicate Directories** - Clean up duplicate /backend directory, keeping only /src/backend
5. **Update Development Scripts** - Configure workspace-aware npm scripts for development, testing, and building

## Out of Scope

- Migration to different build tools (keeping existing Expo/Metro setup)
- Changing the deployment infrastructure
- Modifying the core application functionality
- Converting to a different monorepo tool (nx, lerna, etc.)

## Expected Deliverable

1. Both frontend and backend can be developed independently with `npm run dev:frontend` or `npm run dev:backend`
2. Running `npm install` at root installs all workspace dependencies correctly
3. Tests pass when run from their new locations within each workspace

## Spec Documentation

- Tasks: @.agent-os/specs/2025-08-18-complete-workspace-restructure/tasks.md
- Technical Specification: @.agent-os/specs/2025-08-18-complete-workspace-restructure/sub-specs/technical-spec.md
- Database Schema: Not applicable - no database changes needed
- API Specification: Not applicable - no API changes needed
- Tests Specification: @.agent-os/specs/2025-08-18-complete-workspace-restructure/sub-specs/tests.md