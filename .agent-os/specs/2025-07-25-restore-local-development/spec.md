# Spec Requirements Document

> Spec: Restore Local Development
> Created: 2025-07-25
> Status: Planning

## Overview

Restore local development functionality that allows developers to run the application without Docker, using the previously working `npm run dev` command. This feature ensures backward compatibility and provides a simpler development experience for quick iterations and debugging.

## User Stories

### Local Development Without Docker

As a developer, I want to run the application locally without Docker containers, so that I can develop faster with hot reloading and easier debugging.

Currently, the `make start` command only runs Docker containers, but there's no `make dev` command for local development. The `npm run dev` script exists in package.json but isn't exposed through the Makefile. This creates friction for developers who want to work locally without the overhead of Docker containers.

### Quick Backend-Only Development

As a backend developer, I want to run just the backend server locally, so that I can test API changes without running the full stack.

The `npm run start:backend` command exists but developers need to remember the npm command instead of using the consistent Makefile interface.

## Spec Scope

1. **Makefile Dev Target** - Add `make dev` command that runs the application locally without Docker
2. **Backend-Only Target** - Add `make backend` command for running just the backend server
3. **Frontend-Only Target** - Add `make frontend` command for running just the frontend
4. **Database Setup** - Ensure local PostgreSQL setup instructions are clear
5. **Environment Configuration** - Document required environment variables for local development

## Out of Scope

- Changing the existing Docker-based `make start` command
- Modifying the production deployment setup
- Altering the current npm scripts
- Setting up automated local database provisioning

## Expected Deliverable

1. Developers can run `make dev` to start both frontend and backend locally
2. Clear documentation on setting up local PostgreSQL database
3. All existing npm scripts continue to work as before

## Spec Documentation

- Tasks: @.agent-os/specs/2025-07-25-restore-local-development/tasks.md
- Technical Specification: @.agent-os/specs/2025-07-25-restore-local-development/sub-specs/technical-spec.md
- Tests Specification: @.agent-os/specs/2025-07-25-restore-local-development/sub-specs/tests.md