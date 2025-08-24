# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-07-25-restore-local-development/spec.md

> Created: 2025-07-25
> Version: 1.0.0

## Test Coverage

### Unit Tests

No unit tests required as this is a build configuration change.

### Integration Tests

**Makefile Commands**
- Verify `make dev` executes `npm run dev`
- Verify `make backend` executes `npm run start:backend`
- Verify `make frontend` executes `npm run start-web`
- Verify `make dev-setup` displays setup instructions

### Manual Testing

**Local Development Flow**
- Start local PostgreSQL database
- Set required environment variables
- Run `make dev` and verify both services start
- Verify hot reloading works for both frontend and backend
- Test API endpoints are accessible at http://localhost:3001
- Test frontend is accessible at http://localhost:8081

**Individual Service Testing**
- Run `make backend` and verify only backend starts on port 3001
- Run `make frontend` and verify only frontend starts on port 8081
- Ensure services can be stopped with Ctrl+C

### Regression Testing

- Verify existing `make start` command still works with Docker
- Ensure all npm scripts continue to function as before
- Confirm no changes to production deployment process

## Mocking Requirements

No mocking requirements for this specification as it only involves build configuration.