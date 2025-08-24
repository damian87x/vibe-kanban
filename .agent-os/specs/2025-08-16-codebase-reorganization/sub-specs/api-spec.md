# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-16-codebase-reorganization/spec.md

> Created: 2025-08-16
> Version: 1.0.0

## Endpoints

### No New API Endpoints Required

**Purpose:** This reorganization is purely structural and doesn't add new API functionality
**Parameters:** N/A
**Response:** N/A
**Errors:** N/A

## Controllers

### No New Controllers Required

**Purpose:** Existing controllers remain unchanged, only their file locations change
**Business Logic:** All existing business logic preserved
**Error Handling:** Existing error handling maintained

## Import Path Updates

### Backend API Routes
- **Current:** `backend/trpc/routes/`
- **New:** `src/backend/trpc/routes/`
- **Impact:** Update import statements in frontend and test files

### Frontend API Calls
- **Current:** `lib/trpc.ts`
- **New:** `src/frontend/lib/trpc.ts`
- **Impact:** Update import paths in components and hooks

### Test API Mocks
- **Current:** `__tests__/__mocks__/api-mocks.ts`
- **New:** `tests/unit/__mocks__/api-mocks.ts`
- **Impact:** Update test configuration files

## Migration Notes

- All existing API contracts remain unchanged
- Import paths need updating throughout the codebase
- Test configurations need path updates
- Build scripts need path adjustments
- No functional changes to API behavior
