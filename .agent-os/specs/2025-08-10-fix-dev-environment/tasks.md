# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-08-10-fix-dev-environment/spec.md

> Created: 2025-08-10
> Status: Ready for Implementation

## Tasks

- [ ] 1. Fix Script Path Issues
  - [ ] 1.1 Write tests to verify all npm scripts have valid paths
  - [ ] 1.2 Update package.json to fix ensure-migrations.ts path
  - [ ] 1.3 Scan for other incorrect script paths and fix them
  - [ ] 1.4 Verify `make dev` starts without path errors
  - [ ] 1.5 Run tests to ensure all script paths are valid

- [ ] 2. Fix Port Conflict Management
  - [ ] 2.1 Write tests for port checking functionality
  - [ ] 2.2 Create scripts/dev/check-port.sh script
  - [ ] 2.3 Update backend server to handle graceful shutdown
  - [ ] 2.4 Modify npm scripts to check ports before starting
  - [ ] 2.5 Verify backend starts reliably even with port conflicts
  - [ ] 2.6 Run integration tests for port management

- [ ] 3. Fix Jest Configuration for React Native
  - [ ] 3.1 Write test to verify Jest works with React Native components
  - [ ] 3.2 Create proper Jest setup file for React Native mocks
  - [ ] 3.3 Update jest.config.js with correct configuration
  - [ ] 3.4 Fix test file imports and mock ordering
  - [ ] 3.5 Verify unit tests run without "jest is not defined" errors
  - [ ] 3.6 Run all React Native component tests successfully

- [ ] 4. Fix Metro Bundler Configuration
  - [ ] 4.1 Write tests for Metro path resolution
  - [ ] 4.2 Update metro.config.js to fix anonymous file errors
  - [ ] 4.3 Configure source map generation properly
  - [ ] 4.4 Test frontend startup without bundler errors
  - [ ] 4.5 Verify hot reload works correctly
  - [ ] 4.6 Run E2E test to confirm frontend loads properly

- [ ] 5. Organize Development Scripts
  - [ ] 5.1 Create scripts/dev directory structure
  - [ ] 5.2 Move and organize existing scripts
  - [ ] 5.3 Update all references to moved scripts
  - [ ] 5.4 Create README.md for scripts directory
  - [ ] 5.5 Verify all scripts work from new locations
  - [ ] 5.6 Run full development flow to ensure everything works