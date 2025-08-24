# Fix Frontend Import Path Resolution Errors

## Status
**Phase**: Planning  
**Priority**: P0 - Critical (Frontend completely broken)  
**Created**: 2025-08-20  
**Assigned To**: Development Team

## Problem Statement

The frontend application is failing to load with multiple import resolution errors. The bundler (Metro) returns JSON error responses instead of JavaScript bundles, causing:

1. **500 Internal Server Error**: Metro bundler failing to resolve module imports
2. **MIME Type Error**: Browser rejecting response due to `application/json` instead of `application/javascript`
3. **Module Resolution Failure**: Incorrect import paths throughout the frontend codebase

### Root Cause Analysis

The issue stems from incorrect import path configurations after the recent refactoring that moved frontend code to `src/frontend/`. The import paths are using `@/src/frontend/` which resolves to `/Users/damianborek/workspace/rork-getden-ai-workspace/src/frontend/src/frontend/` (double nesting).

### Current State
- Frontend code is located in: `/src/frontend/`
- Project root tsconfig has: `"@/*": ["./*"]`
- Frontend tsconfig has: `"@/*": ["./*"]` with baseUrl: "."
- Files are importing with: `@/src/frontend/...`
- This resolves to: `./src/frontend/src/frontend/...` (incorrect)

## Technical Specifications

### Architecture Overview

```
Project Structure:
/
├── src/
│   ├── frontend/       # Frontend code (React Native/Expo)
│   │   ├── app/       # Expo Router pages
│   │   ├── components/
│   │   ├── constants/
│   │   ├── lib/
│   │   └── tsconfig.json
│   └── backend/       # Backend code (Hono)
└── tsconfig.json      # Root config
```

### Import Resolution Strategy

**Option 1: Fix Import Paths (Recommended)**
- Update all imports from `@/src/frontend/...` to `@/...`
- Keep existing tsconfig path mappings
- Minimal configuration changes

**Option 2: Update Path Mappings**
- Change tsconfig to map `@frontend/*` to `["./src/frontend/*"]`
- Update all imports to use `@frontend/...`
- More semantic but requires more changes

### Affected Files

Total files with incorrect imports: **91 files**

Key affected areas:
- All tab screens in `app/(tabs)/`
- All components in `components/`
- Store files in `store/`
- Hook files in `hooks/`
- Library files in `lib/`

## Implementation Plan

### Phase 1: Fix Critical Path (Immediate)
**Goal**: Get the application running

1. **Update Import Paths in Tab Screens** (Priority: P0)
   - Fix imports in all `app/(tabs)/*.tsx` files
   - These are entry points that block entire app

2. **Update Core Libraries** (Priority: P0)
   - Fix `lib/trpc.ts` imports
   - Fix `store/` imports
   - Fix `contexts/` imports

3. **Verify Metro Bundler**
   - Test bundle generation
   - Confirm MIME type is correct
   - Verify no resolution errors

### Phase 2: Complete Migration (Follow-up)
**Goal**: Fix all remaining import issues

1. **Update Components**
   - Fix all component imports systematically
   - Group by directory for efficiency

2. **Update Tests**
   - Fix test file imports
   - Ensure tests pass

3. **Documentation**
   - Update import guidelines
   - Add to CLAUDE.md

## Task Breakdown

### Task 1: Fix Tab Screen Imports
**Files**: 12 files in `app/(tabs)/`
**Pattern**: Replace `@/src/frontend/` with `@/`
**Verification**: Each tab loads without errors

### Task 2: Fix Core Library Imports  
**Files**: `lib/trpc.ts`, store files
**Pattern**: Replace `@/src/frontend/` with `@/`
**Verification**: API calls work, state management works

### Task 3: Fix Component Imports
**Files**: 47 component files
**Pattern**: Replace `@/src/frontend/` with `@/`
**Verification**: Components render without import errors

### Task 4: Fix Hook and Context Imports
**Files**: Hooks and contexts
**Pattern**: Replace `@/src/frontend/` with `@/`
**Verification**: Hooks and contexts work

### Task 5: Fix Test Imports
**Files**: Test files in `__tests__/`
**Pattern**: Replace `@/src/frontend/` with `@/`
**Verification**: Tests run successfully

### Task 6: Verification & Testing
- Start development server
- Navigate all screens
- Test core functionality
- Run test suite

## Success Criteria

### Immediate Success (Phase 1)
- [ ] Frontend loads at http://localhost:8081
- [ ] No MIME type errors in console
- [ ] No module resolution errors
- [ ] All tab screens accessible
- [ ] API calls working via tRPC

### Complete Success (Phase 2)
- [ ] All 91 files have corrected imports
- [ ] Zero import resolution warnings
- [ ] All tests passing
- [ ] Development server runs without errors
- [ ] Hot reload working properly

## Testing Requirements

### Manual Testing
1. Start development server: `npm run dev`
2. Open http://localhost:8081
3. Navigate to each tab
4. Test key interactions
5. Check browser console for errors

### Automated Testing
1. Run unit tests: `npm test`
2. Run E2E tests: `npm run test:e2e`
3. Verify no import-related failures

## Risk Mitigation

### Risks
1. **Mass file changes**: Could introduce typos or miss files
2. **Breaking changes**: Could affect running functionality
3. **Test failures**: Tests may have their own import issues

### Mitigation Strategies
1. **Use automated search/replace**: Minimize human error
2. **Test incrementally**: Verify after each batch of changes
3. **Keep backup**: Commit before starting changes
4. **Use TypeScript**: Let compiler catch import errors

## Implementation Notes

### Import Path Examples

**Before (Incorrect)**:
```typescript
import { colors } from '@/src/frontend/constants/colors';
import { trpc } from '@/src/frontend/lib/trpc';
```

**After (Correct)**:
```typescript
import { colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
```

### Metro Configuration
Current `metro.config.js` should already handle the resolution correctly once paths are fixed.

### TypeScript Configuration
The frontend's `tsconfig.json` with `baseUrl: "."` and `"@/*": ["./*"]` is correct for the `src/frontend/` context.

## Timeline

**Immediate (30 minutes)**:
- Fix critical path files
- Verify app loads

**Short-term (2 hours)**:
- Fix all remaining imports
- Run full test suite
- Document changes

## Dependencies

- No external dependencies
- No API changes required
- No database changes required
- No new packages needed

## Rollback Plan

If issues arise:
1. Git reset to previous commit
2. Analyze specific failure
3. Fix incrementally instead of batch
4. Test each change individually

---

**Ready for Implementation**: This spec provides a clear path to fix the frontend import resolution issues. The fix is straightforward but requires careful execution across many files.