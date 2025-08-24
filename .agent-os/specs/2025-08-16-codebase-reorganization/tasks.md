# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-08-16-codebase-reorganization/spec.md

> Created: 2025-08-16
> Status: Ready for Implementation

## Tasks

- [ ] 1. Create New Directory Structure and Move Frontend Code
  - [ ] 1.1 Write tests for frontend component imports in new structure
  - [ ] 1.2 Create `src/frontend/` directory structure
  - [ ] 1.3 Move React Native/Expo app files to `src/frontend/`
  - [ ] 1.4 Move frontend-specific components, hooks, and stores
  - [ ] 1.5 Verify frontend components work using MCP browser tools (navigate, interact, screenshot)
  - [ ] 1.6 Verify all frontend tests pass

- [x] 2. Reorganize Backend Code Structure
  - [ ] 2.1 Write tests for backend service imports in new structure
  - [x] 2.2 Create `src/backend/` directory structure
  - [x] 2.3 Move backend services, routes, and utilities
  - [x] 2.4 Update backend package.json with correct paths
  - [x] 2.5 Verify backend services start correctly using MCP browser tools
  - [ ] 2.6 Verify all backend tests pass

- [ ] 3. Create DevOps Infrastructure Directory
  - [ ] 3.1 Write tests for infrastructure configuration loading
  - [ ] 3.2 Create `src/devops/` directory structure
  - [ ] 3.3 Move Docker files, deployment configs, and infrastructure scripts
  - [ ] 3.4 Update deployment scripts with new paths
  - [ ] 3.5 Verify infrastructure scripts execute correctly
  - [ ] 3.6 Verify all infrastructure tests pass

- [ ] 4. Reorganize Scripts and Utilities
  - [ ] 4.1 Write tests for script execution in new locations
  - [ ] 4.2 Organize root-level `scripts/` directory by functionality
  - [ ] 4.3 Move and categorize utility scripts
  - [ ] 4.4 Update script paths and references
  - [ ] 4.5 Verify all scripts execute correctly
  - [ ] 4.6 Verify script functionality tests pass

- [ ] 5. Consolidate Documentation and Tests
  - [ ] 5.1 Write tests for documentation link resolution
  - [ ] 5.2 Move all documentation to root `docs/` directory
  - [ ] 5.3 Reorganize tests into `tests/` with clear structure
  - [ ] 5.4 Update test configuration files with new paths
  - [ ] 5.5 Verify documentation links work correctly
  - [ ] 5.6 Verify all tests run in new structure

- [ ] 6. Fix Package.json Scripts and Dependencies
  - [ ] 6.1 Write tests for package.json script execution
  - [ ] 6.2 Split root package.json into domain-specific ones
  - [ ] 6.3 Update script paths and dependencies
  - [ ] 6.4 Test all scripts work in their respective directories
  - [ ] 6.5 Verify build and development workflows function
  - [ ] 6.6 Verify all package.json tests pass

- [ ] 7. Update Import Paths and Configuration Files
  - [ ] 7.1 Write tests for import path resolution
  - [ ] 7.2 Update all import statements throughout codebase
  - [ ] 7.3 Update TypeScript configuration files
  - [ ] 7.4 Update build and bundler configurations
  - [ ] 7.5 Verify all imports resolve correctly
  - [ ] 7.6 Verify all configuration tests pass

- [ ] 8. Final Verification and Cleanup
  - [ ] 8.1 Write comprehensive integration tests for new structure
  - [ ] 8.2 Run full test suite to ensure no regressions
  - [ ] 8.3 Verify all development workflows function
  - [ ] 8.4 Clean up old directories and files
  - [ ] 8.5 Run E2E tests to verify complete functionality
  - [ ] 8.6 Verify all tests pass and feature works
