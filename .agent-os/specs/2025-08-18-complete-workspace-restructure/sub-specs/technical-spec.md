# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-18-complete-workspace-restructure/spec.md

> Created: 2025-08-18
> Version: 1.0.0

## Technical Requirements

### Workspace Configuration
- Configure npm workspaces in root package.json to include both frontend and backend
- Each workspace must have its own package.json with isolated dependencies
- Shared dependencies (if any) stay at root level only
- Workspace-specific scripts for independent development

### Directory Structure
- Frontend workspace at `/src/frontend/` with its own package.json
- Backend workspace at `/src/backend/` with its own package.json  
- Remove duplicate `/backend/` directory entirely
- Move all tests to workspace-specific `__tests__` directories
- Keep only E2E tests at root `/e2e/` directory

### Environment Configuration
- Frontend .env at `/src/frontend/.env` with only EXPO_PUBLIC_ variables
- Backend .env at `/src/backend/.env` with server-side variables
- Root .env.example showing structure but no actual values
- Each workspace loads its own .env independently

### Build & Development Scripts
- Root package.json orchestrates workspace commands
- Individual workspace scripts for local development
- Proper script inheritance and composition
- Support for parallel and sequential execution

## Approach Options

**Option A:** Full restructure with new directory layout
- Pros: Clean slate, optimal structure
- Cons: Major disruption, high risk of breaking changes

**Option B:** Incremental enhancement of existing structure (Selected)
- Pros: Lower risk, can be done in phases, preserves working code
- Cons: Some temporary duplication during migration

**Rationale:** Option B selected to minimize disruption while achieving the same end result. The incremental approach allows testing at each step and rollback if issues arise.

## Implementation Strategy

### Phase 1: Workspace Configuration
1. Update root package.json to include frontend in workspaces
2. Verify both workspaces are recognized by npm
3. Test that `npm install` works correctly

### Phase 2: Dependency Separation  
1. Analyze current package.json dependencies
2. Move frontend-specific deps to src/frontend/package.json
3. Move backend-specific deps to src/backend/package.json
4. Keep only workspace tools at root

### Phase 3: Test Reorganization
1. Create __tests__ directories in each workspace
2. Move frontend tests from root __tests__ to src/frontend/__tests__
3. Move backend tests to src/backend/__tests__
4. Update Jest configs for new paths

### Phase 4: Environment Separation
1. Create .env.example files in each workspace
2. Split current .env into workspace-specific files
3. Update code to load workspace-specific .env
4. Test that each workspace gets correct variables

### Phase 5: Script Configuration
1. Add workspace-aware scripts to root package.json
2. Configure individual workspace scripts
3. Test all development workflows
4. Update documentation

### Phase 6: Cleanup
1. Remove duplicate /backend directory
2. Remove old test directories
3. Clean up obsolete configuration files
4. Verify everything still works

## Configuration Details

### Root package.json structure:
```json
{
  "name": "vibe-kanban",
  "private": true,
  "workspaces": [
    "src/frontend",
    "src/backend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "npm run dev --workspace=@vibe/frontend",
    "dev:backend": "npm run dev --workspace=@vibe/backend",
    "test": "npm run test --workspaces",
    "test:e2e": "playwright test",
    "install:all": "npm install"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "@playwright/test": "^1.41.0"
  }
}
```

### Frontend .env structure:
```env
# API Configuration
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3001
EXPO_PUBLIC_FRONTEND_URL=http://localhost:8081

# Feature Flags
EXPO_PUBLIC_BYPASS_AUTH=false
EXPO_PUBLIC_DEBUG=false
```

### Backend .env structure:
```env
# Database
DATABASE_URL=postgresql://postgres@localhost:5432/rork_getden_ai

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# AI & OAuth Providers
OPENROUTER_API_KEY=your-key
OAUTH_PROVIDER=klavis
KLAVIS_API_KEY=your-key

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=rork-knowledge-base
```

## External Dependencies

No new external dependencies required. This restructure uses existing npm workspaces functionality built into npm 7+.

## Risk Mitigation

- Create full backup before starting
- Test each phase independently
- Maintain ability to rollback at each step
- Run full test suite after each phase
- Document any breaking changes discovered