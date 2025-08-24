# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-22-backend-refactoring/spec.md

> Created: 2025-08-22
> Version: 1.0.0

## Technical Requirements

### Architecture Changes

- **Single Entry Point**: Consolidate server initialization into app.ts
- **Lazy Loading**: Implement on-demand loading for tRPC router
- **Provider Factory Pattern**: All services use centralized provider factory
- **TypeScript First**: Eliminate CommonJS workarounds and compiled files
- **Error Resilience**: Graceful fallbacks for all critical paths

### Performance Requirements

- Startup time reduction of at least 20%
- Memory usage reduction through lazy loading
- Maintain sub-200ms API response times
- Zero downtime during deployment

## Approach Options

**Option A: Full Server Rewrite**
- Pros: Clean slate, modern patterns throughout
- Cons: High risk, potential for breaking changes, time-intensive

**Option B: Incremental Refactoring** (Selected)
- Pros: Lower risk, maintains compatibility, testable at each step
- Cons: Some legacy patterns may remain temporarily

**Rationale:** Incremental refactoring allows us to maintain service availability while improving the architecture. The approach has already been validated with the QA review showing all functionality working.

## Implementation Details

### New File Structure
```
src/backend/
├── app.ts              # Main Hono application (new)
├── server.ts           # Server startup (modified)
├── test-server.ts      # Test utilities (new)
├── test-trpc.ts        # tRPC test helper (new)
└── trpc/
    └── app-router.ts   # tRPC router (modified)
```

### Lazy Loading Mechanism
```typescript
let cachedHandler: any = null;

app.use("/api/trpc/*", async (c, next) => {
  if (!cachedHandler) {
    try {
      const { appRouter } = await import("./trpc/app-router");
      const { createContext } = await import("./trpc/context");
      
      cachedHandler = trpcServer({
        router: appRouter,
        createContext,
      });
    } catch (error) {
      // Graceful fallback
    }
  }
  return cachedHandler(c, next);
});
```

### Service Import Updates
All services updated to use:
```typescript
import { ProviderFactory } from "../provider-factory";
const factory = ProviderFactory.getInstance();
```

## Files to be Removed

1. `src/backend/hono.ts` - 419 lines (replaced by app.ts)
2. `src/backend/start.js` - 79 lines (functionality moved to server.ts)
3. `src/backend/app-router-compiled.js` - 107 lines (no longer needed)

## Test Path Fixes Required

The following import paths need correction in test files:
- `@backend/oauth` → `../oauth` or proper relative path
- `@backend/trigger-condition-evaluator` → proper relative path
- Update Jest/TypeScript path mapping configuration

## External Dependencies

No new external dependencies required. This refactoring uses existing packages more efficiently.