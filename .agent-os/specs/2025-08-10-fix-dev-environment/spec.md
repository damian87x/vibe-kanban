# Spec Requirements Document

> Spec: Fix Development Environment
> Created: 2025-08-10
> Status: Planning

## Overview

Fix critical development environment issues preventing developers from running the application locally, including script path mismatches, port conflicts, Jest configuration errors, and Metro bundler problems. This will restore the ability to use `make dev` and run tests successfully.

## User Stories

### Broken Development Startup

As a developer, I want to run `make dev` successfully, so that I can start developing without encountering module not found errors.

Currently, when running `make dev`, the command fails immediately with "Cannot find module '/Users/.../scripts/ensure-migrations.ts'" because the package.json references the wrong path. The actual script is located in `scripts/migration-scripts/ensure-migrations.ts`, causing the entire development startup to fail before any services can start.

### Jest Testing Environment

As a developer, I want to run unit tests for React Native components, so that I can ensure code quality and prevent regressions.

When attempting to run tests, Jest fails with "jest is not defined" errors because the testing environment is misconfigured for React Native. The mocks are not being applied correctly, and the test environment cannot handle React Native components properly, making it impossible to run the unit tests that were just created.

### Backend Port Conflicts

As a backend developer, I want the backend server to start reliably, so that I can test API changes without manual port management.

The backend server fails to start with "EADDRINUSE: address already in use :::3001" errors, indicating that previous processes aren't being cleaned up properly or multiple instances are trying to start. This requires manual process killing and makes development frustrating.

## Spec Scope

1. **Script Path Corrections** - Fix all npm script paths to match actual file locations
2. **Jest Configuration Fix** - Properly configure Jest for React Native component testing
3. **Port Management** - Implement proper port cleanup and conflict resolution
4. **Metro Bundler Fixes** - Resolve path resolution issues causing anonymous file errors
5. **Development Scripts Organization** - Clean up and organize development scripts

## Out of Scope

- Creating new development features
- Changing the core architecture
- Modifying production deployment scripts
- Implementing new testing frameworks
- Adding new dependencies

## Expected Deliverable

1. `make dev` starts successfully without path errors
2. Jest tests run without "jest is not defined" errors
3. Backend starts reliably on port 3001 without conflicts

## Spec Documentation

- Tasks: @.agent-os/specs/2025-08-10-fix-dev-environment/tasks.md
- Technical Specification: @.agent-os/specs/2025-08-10-fix-dev-environment/sub-specs/technical-spec.md
- Tests Specification: @.agent-os/specs/2025-08-10-fix-dev-environment/sub-specs/tests.md