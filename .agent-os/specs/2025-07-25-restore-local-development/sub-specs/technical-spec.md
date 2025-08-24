# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-07-25-restore-local-development/spec.md

> Created: 2025-07-25
> Version: 1.0.0

## Technical Requirements

- Add new Makefile targets for local development without Docker
- Ensure compatibility with existing npm scripts
- Maintain consistency with project's development workflow
- Provide clear feedback when commands are executed
- Support both combined and individual service startup

## Approach Options

**Option A:** Create wrapper scripts in scripts/ directory
- Pros: More control over execution, can add custom logic
- Cons: Additional files to maintain, more complexity

**Option B:** Direct Makefile targets calling npm scripts (Selected)
- Pros: Simple implementation, leverages existing npm scripts, no new files
- Cons: Limited to what npm scripts provide

**Rationale:** Option B is selected because it maintains simplicity and directly uses the existing, tested npm scripts. This approach requires minimal changes and reduces maintenance overhead.

## Implementation Details

### Makefile Targets

1. **make dev** - Runs `npm run dev` which uses concurrently to start both services
2. **make backend** - Runs `npm run start:backend` for backend-only development
3. **make frontend** - Runs `npm run start-web` for frontend-only development
4. **make dev-setup** - Displays instructions for local database setup

### Environment Requirements

The following environment variables must be set for local development:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token generation
- `EXPO_PUBLIC_RORK_API_BASE_URL` - Backend API URL (default: http://localhost:3001)

### Database Setup

Local PostgreSQL can be set up in two ways:
1. Using Docker: `docker-compose up -d postgres`
2. Using local PostgreSQL installation with manual setup

## External Dependencies

No new external dependencies are required. The implementation uses:
- **concurrently** - Already installed, used by npm run dev
- **PostgreSQL** - Required for local development (can use Docker or local installation)