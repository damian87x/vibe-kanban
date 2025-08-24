# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-08-18-complete-workspace-restructure/spec.md

> Created: 2025-08-18
> Status: Ready for Implementation

## Tasks

- [ ] 1. Configure NPM Workspaces
  - [ ] 1.1 Write tests for workspace configuration validation
  - [ ] 1.2 Update root package.json to include src/frontend in workspaces array
  - [ ] 1.3 Add workspace-aware scripts to root package.json
  - [ ] 1.4 Verify both workspaces are recognized with `npm ls --workspaces`
  - [ ] 1.5 Test that `npm install` installs dependencies correctly
  - [ ] 1.6 Verify all workspace configuration tests pass

- [ ] 2. Separate Dependencies Between Workspaces
  - [ ] 2.1 Write tests for dependency isolation
  - [ ] 2.2 Analyze and categorize current dependencies (frontend vs backend vs shared)
  - [ ] 2.3 Move frontend-specific dependencies to src/frontend/package.json
  - [ ] 2.4 Move backend-specific dependencies to src/backend/package.json
  - [ ] 2.5 Keep only build tools and workspace utilities in root package.json
  - [ ] 2.6 Run `npm install` and verify no duplicate installations
  - [ ] 2.7 Verify dependency isolation tests pass

- [ ] 3. Reorganize Test Structure
  - [ ] 3.1 Write tests for test file migration validation
  - [ ] 3.2 Create __tests__ directory structure in src/frontend/
  - [ ] 3.3 Create __tests__ directory structure in src/backend/
  - [ ] 3.4 Move frontend tests from root __tests__ to src/frontend/__tests__
  - [ ] 3.5 Move backend tests to src/backend/__tests__
  - [ ] 3.6 Update Jest configurations for new test paths
  - [ ] 3.7 Run tests from new locations to verify they work
  - [ ] 3.8 Verify all test migration validation tests pass

- [ ] 4. Split Environment Configuration
  - [ ] 4.1 Write tests for environment variable loading
  - [ ] 4.2 Create .env.example in src/frontend/ with EXPO_PUBLIC_ variables
  - [ ] 4.3 Create .env.example in src/backend/ with server variables
  - [ ] 4.4 Split current .env into workspace-specific .env files
  - [ ] 4.5 Update frontend code to load from src/frontend/.env
  - [ ] 4.6 Update backend code to load from src/backend/.env
  - [ ] 4.7 Start both services and verify correct env vars are loaded
  - [ ] 4.8 Verify environment loading tests pass

- [ ] 5. Clean Up and Verify
  - [ ] 5.1 Write E2E test for complete development workflow
  - [ ] 5.2 Remove duplicate /backend directory completely
  - [ ] 5.3 Remove old root-level __tests__ directory
  - [ ] 5.4 Update all import paths affected by restructure
  - [ ] 5.5 Update README with new workspace commands
  - [ ] 5.6 Run full test suite (unit, integration, E2E)
  - [ ] 5.7 Verify development workflow with `npm run dev`
  - [ ] 5.8 Test individual workspace commands (`npm run dev:frontend`, `npm run dev:backend`)
  - [ ] 5.9 Take screenshot of both services running independently as proof
  - [ ] 5.10 Verify all tests pass and project structure is clean