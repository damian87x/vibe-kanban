# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-08-10-fix-workflow-edit-typescript-errors/spec.md

> Created: 2025-08-10
> Status: Ready for Implementation

## Tasks

- [ ] 1. Audit and Fix tRPC Router Architecture (P0 - Critical)
  - [ ] 1.1 Write tests to verify current router behavior before changes
  - [ ] 1.2 Audit duplicate functionality between `/backend/trpc/routes/workflows/index.ts` and `/backend/trpc/routes/workflows/user-workflows.ts`
  - [ ] 1.3 Create unified router interface maintaining backward compatibility
  - [ ] 1.4 Consolidate routers by merging overlapping procedures 
  - [ ] 1.5 Update `app-router.ts` to use consolidated structure without spread operator conflicts
  - [ ] 1.6 Verify workflow edit page loads correctly using MCP browser tools (navigate to `/workflow/[id]/edit`, verify no console errors)
  - [ ] 1.7 Verify all tRPC calls resolve without TypeScript compilation errors

- [ ] 2. Fix API Schema Alignment (P0 - Critical) 
  - [ ] 2.1 Write schema validation tests for all workflow API endpoints
  - [ ] 2.2 Map frontend tRPC calls in `edit.tsx` to backend route parameter expectations
  - [ ] 2.3 Fix `workflows.get?.useQuery?.()` undefined method calls (lines 38-40)
  - [ ] 2.4 Fix `useMutation` optional chaining issues (lines 108, 125) 
  - [ ] 2.5 Align input schemas between frontend and backend for create/update operations
  - [ ] 2.6 Add proper return type definitions for all workflow operations
  - [ ] 2.7 Test workflow create/update operations using MCP browser tools (navigate to edit page, modify workflow, save, verify success)
  - [ ] 2.8 Verify all API calls return consistent response structures

- [ ] 3. Replace Unsafe Type Casting (P1 - Important)
  - [ ] 3.1 Write unit tests for type-safe icon component loading
  - [ ] 3.2 Create proper TypeScript interfaces for workflow icon types
  - [ ] 3.3 Replace `(Icons as any)[workflow.icon...]` unsafe casting (lines 103-105)
  - [ ] 3.4 Implement type guards for dynamic icon loading
  - [ ] 3.5 Add proper type validation for `convertLegacyWorkflowToUnified()` function
  - [ ] 3.6 Create interface definitions for legacy vs unified workflow formats
  - [ ] 3.7 Verify workflow icons display correctly using MCP browser tools (check template and user workflow icons)
  - [ ] 3.8 Verify template conversion maintains data integrity

- [ ] 4. Standardize Error Handling (P2 - Medium)
  - [ ] 4.1 Write tests for consistent error response formatting
  - [ ] 4.2 Define standardized error response interface for all workflow operations
  - [ ] 4.3 Update all tRPC error handlers to use consistent patterns
  - [ ] 4.4 Add proper TypeScript error types throughout the workflow chain
  - [ ] 4.5 Implement user-friendly error message formatting
  - [ ] 4.6 Test error scenarios using MCP browser tools (invalid workflow IDs, network failures, validation errors)  
  - [ ] 4.7 Verify error messages are properly typed and user-friendly

- [ ] 5. TypeScript Compilation and Validation
  - [ ] 5.1 Create TypeScript compilation tests to prevent regression
  - [ ] 5.2 Run full TypeScript build on workflow-related files
  - [ ] 5.3 Verify zero compilation errors across all workflow modules
  - [ ] 5.4 Add type coverage monitoring for workflow edit functionality
  - [ ] 5.5 Create pre-commit hooks to prevent unsafe type casting
  - [ ] 5.6 Test complete workflow edit flow using MCP browser tools (full end-to-end user journey)
  - [ ] 5.7 Verify all tests pass and TypeScript compilation succeeds