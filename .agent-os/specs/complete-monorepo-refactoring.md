# Complete Monorepo Refactoring

> Status: In Progress  
> Priority: Critical  
> Branch: feature/refactoring-v2  
> Created: 2025-08-21

## Executive Summary

The current monorepo refactoring in `feature/refactoring-v2` has a solid architectural vision but critical execution issues preventing compilation. This specification outlines the necessary steps to complete the refactoring and elevate it to production-ready status.

## Current State Analysis

### What's Working Well ✅
- Clean workspace separation (`src/frontend/` and `src/backend/`)
- Proper npm workspaces configuration
- Organized DevOps files in `/devops/`
- Consistent file structure within workspaces
- Documentation organization in `.agent-os/`

### Critical Issues 🚨
1. **900+ TypeScript errors in backend** - Missing ES2015+ lib configuration
2. **400+ TypeScript errors in frontend** - Missing type definitions
3. **Broken import paths** - Test files reference old structure
4. **Cross-workspace violations** - Frontend importing backend directly
5. **Missing dependencies** - `@types/node`, React types not installed

## Goals & Non-Goals

### Goals
- ✅ Fix all TypeScript compilation errors
- ✅ Establish proper cross-workspace communication
- ✅ Update all import paths to new structure
- ✅ Restore full test coverage and execution
- ✅ Implement shared types strategy
- ✅ Complete environment variable separation

### Non-Goals
- ❌ Add new features during refactoring
- ❌ Change technology stack
- ❌ Modify business logic
- ❌ Restructure database schema

## Technical Specification

### Phase 1: Critical Fixes (Day 1)

#### 1.1 Fix TypeScript Configurations

**Backend tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "types": ["node", "jest"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "__tests__/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Frontend tsconfig.json:**
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-native",
    "moduleResolution": "node",
    "types": ["react", "react-native", "jest"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@backend-types/*": ["../backend/src/types/*"]
    }
  },
  "include": ["src/**/*", "app/**/*", "__tests__/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 1.2 Install Missing Dependencies

```bash
# Backend workspace
cd src/backend
npm install --save-dev @types/node @types/jest typescript

# Frontend workspace  
cd ../frontend
npm install --save-dev @types/react @types/react-native @types/jest typescript
```

#### 1.3 Fix Critical Import Paths

Create automated script to fix imports:
```typescript
// scripts/fix-imports.ts
import { glob } from 'glob';
import fs from 'fs/promises';

const fixes = [
  // Backend fixes
  { from: /from ['"]\.\/src\/backend\//g, to: 'from \'@/' },
  { from: /from ['"]\.\.\/\.\.\/backend\//g, to: 'from \'@/' },
  
  // Frontend fixes
  { from: /from ['"]\.\/src\/frontend\//g, to: 'from \'@/' },
  { from: /from ['"]\.\.\/\.\.\/lib\//g, to: 'from \'@/lib/' },
];

async function fixImports() {
  const files = await glob('src/**/*.{ts,tsx,js,jsx}');
  
  for (const file of files) {
    let content = await fs.readFile(file, 'utf-8');
    let changed = false;
    
    for (const fix of fixes) {
      if (fix.from.test(content)) {
        content = content.replace(fix.from, fix.to);
        changed = true;
      }
    }
    
    if (changed) {
      await fs.writeFile(file, content);
      console.log(`Fixed imports in ${file}`);
    }
  }
}
```

### Phase 2: Architectural Improvements (Day 2)

#### 2.1 Implement Shared Types Package

Create new workspace for shared types:
```bash
mkdir -p src/shared
cd src/shared
npm init -y
```

**src/shared/package.json:**
```json
{
  "name": "@vibe-kanban/shared",
  "version": "1.0.0",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch"
  }
}
```

**src/shared/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "strict": true
  },
  "include": ["src/**/*"]
}
```

Move shared interfaces:
```typescript
// src/shared/src/index.ts
export * from './types/user';
export * from './types/workflow';
export * from './types/agent';
export * from './types/integration';
```

#### 2.2 Fix Cross-Workspace Communication

**Option 1: API Contract First (Recommended)**
```typescript
// src/shared/src/api-contract.ts
export interface APIContract {
  '/api/workflows': {
    GET: { response: Workflow[] };
    POST: { body: CreateWorkflowDTO; response: Workflow };
  };
  // ... other endpoints
}
```

**Option 2: tRPC with Shared Types**
```typescript
// src/backend/src/trpc/routers/workflow.ts
import { WorkflowDTO } from '@vibe-kanban/shared';

export const workflowRouter = router({
  list: publicProcedure.query((): WorkflowDTO[] => {
    // Implementation
  })
});

// src/frontend/src/lib/trpc.ts
import type { WorkflowDTO } from '@vibe-kanban/shared';
```

#### 2.3 Update Test Infrastructure

**Backend Jest Config:**
```javascript
// src/backend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@vibe-kanban/shared$': '<rootDir>/../shared/dist'
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts']
};
```

**Frontend Jest Config:**
```javascript
// src/frontend/jest.config.js
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@vibe-kanban/shared$': '<rootDir>/../shared/dist'
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts']
};
```

### Phase 3: Environment & DevOps (Day 3)

#### 3.1 Environment Variable Separation

**Root .env (shared):**
```env
NODE_ENV=development
LOG_LEVEL=debug
```

**src/backend/.env:**
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
PORT=3001
```

**src/frontend/.env:**
```env
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_WS_URL=ws://localhost:3001
```

#### 3.2 Update Build & Deploy Scripts

**Root package.json:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "npm --workspace=src/backend run dev",
    "dev:frontend": "npm --workspace=src/frontend run dev",
    "build": "npm run build:shared && npm run build:backend && npm run build:frontend",
    "build:shared": "npm --workspace=src/shared run build",
    "build:backend": "npm --workspace=src/backend run build",
    "build:frontend": "npm --workspace=src/frontend run build",
    "test": "npm run test:shared && npm run test:backend && npm run test:frontend",
    "test:shared": "npm --workspace=src/shared run test",
    "test:backend": "npm --workspace=src/backend run test",
    "test:frontend": "npm --workspace=src/frontend run test",
    "lint": "npm run lint:backend && npm run lint:frontend",
    "typecheck": "npm run typecheck:shared && npm run typecheck:backend && npm run typecheck:frontend"
  }
}
```

#### 3.3 CI/CD Pipeline Updates

**.github/workflows/ci.yml:**
```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build shared types
        run: npm run build:shared
      
      - name: Run type checks
        run: npm run typecheck
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test -- --coverage
      
      - name: Build applications
        run: npm run build
```

## Implementation Plan

### Day 1: Critical Fixes
- [ ] Fix TypeScript configurations in both workspaces
- [ ] Install missing dependencies
- [ ] Run import path fix script
- [ ] Verify compilation succeeds
- [ ] Fix remaining compilation errors manually

### Day 2: Architecture
- [ ] Create shared types workspace
- [ ] Move shared interfaces to new package
- [ ] Update cross-workspace imports
- [ ] Fix test configurations
- [ ] Run and fix failing tests

### Day 3: Polish & Documentation
- [ ] Implement environment variable separation
- [ ] Update build and deploy scripts
- [ ] Update CI/CD pipelines
- [ ] Update documentation
- [ ] Perform final testing

## Testing Strategy

### Unit Testing
- Restore 90%+ code coverage
- All workspaces must pass independently
- Shared types must have interface tests

### Integration Testing
- Test cross-workspace communication
- Verify build pipeline works end-to-end
- Test deployment scripts

### E2E Testing
- Full user journey tests
- Performance benchmarks
- Load testing with monorepo structure

## Success Metrics

### Must Have (P0)
- ✅ Zero TypeScript compilation errors
- ✅ All tests passing (unit, integration, E2E)
- ✅ Clean workspace separation maintained
- ✅ No cross-workspace violations

### Should Have (P1)
- ✅ 90%+ test coverage restored
- ✅ Build time < 2 minutes
- ✅ Deploy pipeline working
- ✅ Documentation updated

### Nice to Have (P2)
- ✅ Workspace-specific linting rules
- ✅ Automated dependency updates
- ✅ Performance monitoring
- ✅ Bundle size optimization

## Risk Mitigation

### Risk 1: Breaking Production
**Mitigation:** 
- Keep changes in feature branch until fully tested
- Run parallel testing environment
- Have rollback plan ready

### Risk 2: Import Path Confusion
**Mitigation:**
- Document import conventions clearly
- Use ESLint rules to enforce patterns
- Provide migration guide for team

### Risk 3: Cross-Workspace Dependencies
**Mitigation:**
- Strict workspace boundaries
- Shared types package for contracts
- API-first communication pattern

## Dependencies

### Technical Dependencies
- Node.js 20+
- npm 10+ (workspace support)
- TypeScript 5+

### Team Dependencies
- Frontend team review
- Backend team review
- DevOps team for deployment updates
- QA team for regression testing

## References

- [Original Refactoring PR](https://github.com/vibe-kanban/feature/refactoring-v2)
- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Monorepo Best Practices](https://monorepo.tools/)

## Appendix: Validation Checklist

Before merging to main:

- [ ] **Compilation**: Zero TypeScript errors in all workspaces
- [ ] **Tests**: All unit tests passing (>90% coverage)
- [ ] **E2E**: All E2E tests passing
- [ ] **Imports**: No broken import paths
- [ ] **Dependencies**: All required packages installed
- [ ] **Documentation**: README updated with new structure
- [ ] **CI/CD**: Pipeline green on feature branch
- [ ] **Performance**: Build time acceptable (<2min)
- [ ] **Security**: No new vulnerabilities introduced
- [ ] **Review**: Approved by tech lead and 2+ developers

---

*This specification provides a complete roadmap to finish the monorepo refactoring and bring it to production-ready status.*