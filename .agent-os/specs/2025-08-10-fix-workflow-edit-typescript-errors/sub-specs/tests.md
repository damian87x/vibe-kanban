# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-10-fix-workflow-edit-typescript-errors/spec.md

> Created: 2025-08-10
> Version: 1.0.0

## Test Coverage

### Unit Tests

**tRPC Router Consolidation**
- Test unified router exports all expected procedures
- Test procedure input/output type validation with Zod schemas
- Test error handling consistency across all workflow operations
- Test legacy compatibility fields are properly mapped

**Type Guard Functions** 
- Test `isUUID()` function with valid/invalid UUID formats
- Test dynamic icon type guards for safe icon component loading
- Test workflow template type validation functions
- Test legacy workflow format detection and conversion

**Interface Validation**
- Test `WorkflowResponse` interface matches all expected fields
- Test `CreateWorkflowInput` schema validation with edge cases
- Test `UpdateWorkflowInput` partial update validation
- Test error response interface consistency

### Integration Tests

**tRPC Router Integration**
- Test workflow.get returns properly typed response
- Test workflow.create accepts correct input schema and returns expected output
- Test workflow.update handles partial updates correctly
- Test workflow router consolidation doesn't break existing functionality

**Frontend-Backend Type Alignment**
- Test all tRPC calls from edit.tsx resolve without type errors
- Test mutation hooks are properly typed and callable
- Test query hooks return expected data structures
- Test error states provide properly typed error objects

**Template Conversion Integration**
- Test `convertLegacyWorkflowToUnified()` with real workflow data
- Test legacy workflow compatibility with new type system
- Test template-to-workflow conversion maintains type safety
- Test workflow icon mapping works with new type system

### Feature Tests

**Workflow Edit Page E2E**
- Navigate to workflow edit page and verify TypeScript compilation succeeds
- Test workflow loading displays correct data without runtime type errors
- Test workflow saving completes successfully with new type system
- Test template-based workflow creation works end-to-end
- Test error handling displays user-friendly messages for type-related issues

**tRPC Type Safety E2E**
- Test IDE provides proper autocompletion for tRPC calls
- Test TypeScript compiler catches type mismatches at build time
- Test runtime type validation prevents invalid data from reaching backend
- Test error responses follow consistent interface structure

### Mocking Requirements

**External Services**
- **Database**: Mock PostgreSQL queries to return typed workflow data
- **Authentication**: Mock user context for protected procedures
- **File System**: Mock icon file existence checks for dynamic loading

**API Responses**
- **tRPC Client**: Mock successful/error responses with proper typing
- **Workflow Templates**: Mock template data with various formats (legacy/new)
- **Integration Data**: Mock integration status data for workflow requirements

**Time-based Tests**  
- **Date Fields**: Mock `created_at`/`updated_at` timestamps for consistent testing
- **UUID Generation**: Mock UUID generation for predictable test data

## Test Implementation Strategy

### TypeScript Compilation Tests

```typescript
// tests/types/workflow-types.test.ts
describe('Workflow TypeScript Types', () => {
  it('should compile workflow edit page without errors', () => {
    // Use tsc programmatically to verify compilation
    expect(compileTypeScript('app/workflow/[id]/edit.tsx')).toBe(true);
  });

  it('should provide proper type inference for tRPC calls', () => {
    // Test that tRPC client provides expected types
    const client = createTestTRPCClient();
    expectType<WorkflowResponse>(client.workflows.get.query({ workflowId: 'test' }));
  });
});
```

### Router Consolidation Tests

```typescript  
// tests/backend/workflow-router.test.ts
describe('Consolidated Workflow Router', () => {
  it('should export all required procedures', () => {
    const procedures = Object.keys(consolidatedWorkflowRouter._def.procedures);
    expect(procedures).toContain('get');
    expect(procedures).toContain('create'); 
    expect(procedures).toContain('update');
  });

  it('should handle duplicate operation names correctly', () => {
    // Ensure no conflicts between old separate routers
    expect(() => consolidatedWorkflowRouter.get).not.toThrow();
  });
});
```

### Frontend Integration Tests

```typescript
// tests/integration/workflow-edit.test.tsx  
describe('Workflow Edit TypeScript Integration', () => {
  it('should render without TypeScript errors', () => {
    render(<WorkflowEditPage />);
    // Verify component renders without runtime type errors
  });

  it('should make properly typed tRPC calls', async () => {
    const { result } = renderHook(() => trpc.workflows.get.useQuery({
      workflowId: 'test-uuid'
    }));
    
    // Verify hook returns expected type structure
    await waitFor(() => {
      expect(result.current.data).toMatchObject({
        success: expect.any(Boolean),
        workflow: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String)
        })
      });
    });
  });
});
```

## Regression Prevention

### Pre-commit Hooks
- TypeScript compilation check for all affected files
- Type coverage validation for workflow-related modules  
- Lint checks for unsafe type casting patterns

### CI/CD Pipeline Tests
- Full TypeScript build verification
- Integration test suite for workflow operations
- E2E tests for workflow edit page functionality

### Type Coverage Monitoring
- Track TypeScript coverage metrics for workflow modules
- Alert on introduction of `any` types or unsafe casting
- Monitor for new optional chaining on potentially undefined methods