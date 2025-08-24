# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-10-fix-workflow-edit-typescript-errors/spec.md

> Created: 2025-08-10
> Version: 1.0.0

## Technical Requirements

### P0 - Critical Issues (Must Fix)

1. **tRPC Router Type Conflicts**
   - Consolidate duplicate workflow routers in `/backend/trpc/routes/workflows/`
   - Resolve type conflicts between `workflowsRouter` and `userWorkflowsRouter`
   - Ensure proper router composition in `app-router.ts` (line 88: `...workflowsRouter`)

2. **API Schema Mismatches**
   - Fix parameter structure differences between frontend calls and backend expectations
   - Address `useQuery` optional chaining on undefined methods (lines 38-40 in edit.tsx)
   - Resolve `useMutation` optional chaining issues (lines 108, 125 in edit.tsx)

3. **Missing tRPC Method Definitions**
   - Define proper return types for workflow operations
   - Fix `workflows.get?.useQuery?.()` undefined method calls
   - Ensure all mutation methods are properly typed

### P1 - Important Issues (Should Fix)

4. **Unsafe Type Casting Elimination**
   - Replace `(Icons as any)[workflow.icon...]` unsafe casting (line 103-105 in edit.tsx)
   - Add proper type guards for dynamic icon loading
   - Create proper interfaces for workflow icon types

5. **Template Converter Type Safety**
   - Ensure `convertLegacyWorkflowToUnified()` has proper input/output types
   - Validate workflow template interface compatibility
   - Add type guards for legacy workflow format detection

### P2 - Medium Priority (Nice to Have)

6. **Error Handling Consistency**
   - Standardize error handling patterns across tRPC operations
   - Add proper TypeScript error types for workflow operations
   - Implement consistent error message formatting

## Approach Options

### Option A: Gradual Router Consolidation (Selected)

**Approach**: Merge duplicate routers while maintaining backwards compatibility
- Pros: 
  - Lower risk of breaking existing functionality
  - Incremental migration path
  - Easier to test and validate
- Cons: 
  - Takes more time to complete
  - Temporary increase in code complexity

### Option B: Complete Router Restructure

**Approach**: Completely rebuild workflow router structure
- Pros: 
  - Clean slate implementation
  - Optimal long-term architecture
- Cons: 
  - High risk of breaking changes
  - Requires extensive testing
  - Complex migration of existing calls

**Rationale**: Option A is selected because it provides a safer migration path with incremental validation, reducing the risk of introducing runtime errors while fixing TypeScript issues.

## External Dependencies

No new external dependencies required. The fix utilizes existing:
- **@trpc/server** - Already in use for router definitions
- **@trpc/react-query** - Already in use for frontend integration  
- **zod** - Already in use for schema validation

## Implementation Details

### Phase 1: Router Consolidation
1. Audit all workflow-related routes in both router files
2. Identify overlapping functionality between routers
3. Create unified interface for workflow operations
4. Merge routers with proper namespace separation
5. Update app-router.ts to use consolidated structure

### Phase 2: Schema Alignment  
1. Map all frontend tRPC calls to backend route definitions
2. Identify parameter structure mismatches
3. Update either frontend or backend to align schemas
4. Add proper TypeScript interfaces for request/response types

### Phase 3: Type Safety Enhancement
1. Create proper TypeScript interfaces for all workflow types
2. Add type guards for dynamic operations (icon loading, template conversion)
3. Replace unsafe casting with proper type checking
4. Add runtime validation where needed

### Phase 4: Error Handling Standardization
1. Define consistent error response interfaces
2. Update all mutation error handlers to use standard patterns  
3. Add proper TypeScript error types throughout the chain

## Testing Strategy

- **Unit Tests**: Test type guards and interface validation functions
- **Integration Tests**: Verify tRPC router consolidation doesn't break existing functionality
- **Type Tests**: Create TypeScript compilation tests to prevent regression
- **E2E Tests**: Validate workflow edit page functionality after type fixes