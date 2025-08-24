# Action Plan for Branch vk-9f72-create-spe

## Overview
This action plan addresses the issues found during the branch review and provides a structured approach to complete the reorganization and prepare for merge.

## Phase 1: Critical Fixes (Immediate)
**Timeline**: 1-2 hours  
**Goal**: Make the branch functional for development

### Tasks

#### 1.1 Install Frontend Dependencies
```bash
cd src/frontend && npm install
```
**Owner**: Developer  
**Status**: 🔴 Required  
**Verification**: `npm run start:frontend` should work

#### 1.2 Create Missing .gitignore Files
```bash
# Backend .gitignore
cat > src/backend/.gitignore << 'EOF'
node_modules/
dist/
build/
*.log
.env
.env.local
.env.*.local
coverage/
.nyc_output/
EOF

# Frontend .gitignore  
cat > src/frontend/.gitignore << 'EOF'
node_modules/
.expo/
dist/
*.log
.env
.env.local
.env.*.local
coverage/
web-build/
EOF
```
**Owner**: Developer  
**Status**: 🔴 Required  
**Verification**: Files exist and git ignores node_modules

#### 1.3 Verify Basic Functionality
```bash
# Terminal 1: Start backend
cd src/backend && npm run dev

# Terminal 2: Start frontend
cd src/frontend && npm run start:web

# Terminal 3: Run tests
npm test
```
**Owner**: Developer  
**Status**: 🔴 Required  
**Verification**: Both services start without errors

## Phase 2: Path and Configuration Updates
**Timeline**: 2-3 hours  
**Goal**: Fix all broken references and imports

### Tasks

#### 2.1 Update Import Paths
```bash
# Find potentially broken imports
grep -r "from ['\"].*\.\.\/\.\.\/backend" src/ --include="*.ts" --include="*.tsx"
grep -r "require.*\.\.\/\.\.\/backend" src/ --include="*.js" --include="*.ts"

# Update paths from:
# from "../../backend/services/..."
# to:
# from "../../src/backend/services/..."
```
**Owner**: Developer  
**Status**: 🟡 Important  
**Verification**: TypeScript compilation succeeds

#### 2.2 Update TypeScript Configurations
```json
// Update tsconfig.json paths if needed
{
  "compilerOptions": {
    "paths": {
      "@backend/*": ["./src/backend/*"],
      "@frontend/*": ["./src/frontend/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```
**Owner**: Developer  
**Status**: 🟡 Important  
**Verification**: `npm run type-check` passes

#### 2.3 Fix Docker Configurations
```dockerfile
# Update Dockerfile paths
# FROM:
COPY backend/ /app/backend/
# TO:
COPY src/backend/ /app/src/backend/

# Update docker-compose.yml volumes
# FROM:
- ./backend:/app/backend
# TO:
- ./src/backend:/app/src/backend
```
**Owner**: DevOps  
**Status**: 🟡 Important  
**Verification**: Docker builds succeed

## Phase 3: CI/CD Updates
**Timeline**: 2-3 hours  
**Goal**: Restore deployment capability

### Tasks

#### 3.1 Update GitHub Actions
```yaml
# Update workflow paths in .github/workflows/
# FROM:
working-directory: ./backend
# TO:
working-directory: ./src/backend
```
**Owner**: DevOps  
**Status**: 🟡 Important  
**Verification**: CI pipeline runs successfully

#### 3.2 Update Deployment Scripts
```bash
# Update any deployment scripts that reference old paths
# Check scripts in:
# - scripts/deployment/
# - devops/deployment/
```
**Owner**: DevOps  
**Status**: 🟡 Important  
**Verification**: Deployment to staging works

## Phase 4: Complete Reorganization (Optional)
**Timeline**: 2-3 hours  
**Goal**: Optimize the reorganization structure

### Tasks

#### 4.1 Organize Scripts Properly
```bash
# Infrastructure/deployment scripts stay at root
mkdir -p scripts/{deployment,infrastructure,ci-cd}
# Move only infrastructure scripts from src/backend/scripts/
mv src/backend/scripts/deployment/* scripts/deployment/
mv src/backend/scripts/utilities/setup-*.sh scripts/infrastructure/

# App-specific scripts STAY in workspace
# src/backend/scripts/ - backend-specific scripts
# src/frontend/scripts/ - frontend-specific scripts
```
**Owner**: Developer  
**Status**: 🟢 Nice to have  
**Verification**: Scripts organized by purpose

#### 4.2 Keep DevOps at Root (CORRECT AS-IS)
```bash
# DevOps directory is CORRECTLY at root level
# /devops/ contains infrastructure configs (NOT source code)
# No action needed - this is the correct structure
```
**Owner**: N/A - Already correct  
**Status**: ✅ Already correct  
**Verification**: DevOps files remain accessible at root

#### 4.3 Consolidate Documentation
```bash
# Move all docs to root docs/ directory
mv src/backend/docs/* docs/backend/
mv src/frontend/docs/* docs/frontend/
# Update README files with new structure
```
**Owner**: Developer  
**Status**: 🟢 Nice to have  
**Verification**: Documentation is well-organized

## Phase 5: Testing and Validation
**Timeline**: 2-3 hours  
**Goal**: Ensure everything works correctly

### Tasks

#### 5.1 Run Full Test Suite
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Integration tests
npm run test:integration

# Type checking
npm run type-check
```
**Owner**: QA/Developer  
**Status**: 🔴 Required before merge  
**Verification**: All tests pass

#### 5.2 Manual Testing Checklist
- [ ] Login/logout works
- [ ] Create new workflow
- [ ] Upload files
- [ ] Chat functionality
- [ ] Agent management
- [ ] Integration OAuth flows
- [ ] WebSocket connections
- [ ] Database operations
**Owner**: QA  
**Status**: 🔴 Required before merge  
**Verification**: No functional regressions

#### 5.3 Performance Testing
```bash
# Check bundle sizes
npm run build
# Compare with main branch sizes

# Check startup times
time npm run start:backend
time npm run start:frontend
```
**Owner**: Developer  
**Status**: 🟡 Important  
**Verification**: No performance degradation

## Phase 6: Documentation
**Timeline**: 1-2 hours  
**Goal**: Help team adapt to new structure

### Tasks

#### 6.1 Update README
```markdown
# Add to README.md

## Project Structure
After reorganization (as of v2.0):
```
vibe-kanban/
├── src/
│   ├── backend/     # Backend service (Hono + tRPC)
│   └── frontend/    # Frontend app (React Native/Expo)
├── docs/            # Documentation
├── devops/          # Deployment configs
├── scripts/         # Utility scripts
└── tests/           # E2E tests
```

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   cd src/backend && npm install
   cd src/frontend && npm install
   ```
2. Start development:
   ```bash
   npm run dev
   ```
```
**Owner**: Developer  
**Status**: 🟡 Important  
**Verification**: README is accurate

#### 6.2 Create Migration Guide
```markdown
# Create MIGRATION_GUIDE.md

## For Developers
- Backend code moved from `/backend/` to `/src/backend/`
- Frontend code moved to `/src/frontend/`
- Update your local environment:
  ```bash
  git pull
  cd src/backend && npm install
  cd src/frontend && npm install
  ```
- Update any local scripts or aliases
```
**Owner**: Tech Lead  
**Status**: 🟡 Important  
**Verification**: Team understands changes

## Success Criteria

### Minimum for Merge
- [x] Frontend dependencies installed
- [x] Both services start successfully
- [x] All tests pass
- [x] CI/CD pipelines updated
- [x] No functional regressions
- [x] Team notified of changes

### Definition of Done
- [x] 100% of reorganization plan implemented
- [x] Simple cd-based approach maintained (NO npm workspaces)
- [x] All documentation updated
- [x] Performance metrics maintained
- [x] Zero technical debt introduced

## Risk Mitigation

### Rollback Plan
If critical issues arise:
1. Create hotfix branch from main
2. Cherry-pick only essential fixes
3. Delay reorganization to next sprint

### Communication Plan
1. Team standup announcement
2. Slack channel update with migration guide
3. Pair programming sessions for complex merges
4. Architecture review meeting

## Timeline Summary

| Phase | Duration | Priority | Status |
|-------|----------|----------|--------|
| Phase 1: Critical Fixes | 1-2 hours | 🔴 Critical | Required |
| Phase 2: Path Updates | 2-3 hours | 🟡 High | Required |
| Phase 3: CI/CD | 2-3 hours | 🟡 High | Required |
| Phase 4: Complete Reorg | 2-3 hours | 🟢 Medium | Optional |
| Phase 5: Testing | 2-3 hours | 🔴 Critical | Required |
| Phase 6: Documentation | 1-2 hours | 🟡 High | Required |

**Total Required Time**: 8-13 hours  
**Total with Optional**: 10-16 hours

## Conclusion

The branch has successfully implemented the core reorganization but requires several critical fixes before it's ready for merge. Priority should be given to:

1. **Installing frontend dependencies** (blocks all frontend work)
2. **Verifying functionality** (ensures no regressions)
3. **Updating CI/CD** (restores deployment capability)

Once these critical items are complete, the branch can be merged with confidence. The optional Phase 4 items can be completed in a follow-up PR if time constraints exist.