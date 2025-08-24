# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-10-fix-workflow-edit-typescript-errors/spec.md

> Created: 2025-08-10
> Version: 1.0.0

## tRPC Router Consolidation

### Current Problematic Structure

**Issue**: Duplicate workflow routers causing type conflicts

```typescript
// Current problematic structure in app-router.ts
workflows: createTRPCRouter({
  templates: templatesRouter,
  executions: executionsRouter,
  userWorkflows: userWorkflowsRouter,  // Separate router
  triggers: triggersRouter,
  ...workflowsRouter,                  // Spread causing conflicts
}),
```

### Proposed Unified Structure

```typescript
// Consolidated structure
workflows: createTRPCRouter({
  // Template operations
  templates: templatesRouter,
  
  // User workflow operations (consolidated)
  get: workflowGetProcedure,
  list: workflowListProcedure, 
  create: workflowCreateProcedure,
  update: workflowUpdateProcedure,
  delete: workflowDeleteProcedure,
  toggleFavorite: workflowToggleFavoriteProcedure,
  
  // Execution operations
  executions: executionsRouter,
  
  // Trigger operations  
  triggers: triggersRouter,
}),
```

## Route Consolidation Details

### GET /workflows.get

**Current Issues**:
- `workflows.get?.useQuery?.()` - undefined method errors
- Inconsistent return types between routers

**Fixed Interface**:
```typescript
get: protectedProcedure
  .input(z.object({ 
    workflowId: z.string().uuid() 
  }))
  .query(async ({ input, ctx }) => {
    // Returns consistent WorkflowResponse interface
    return {
      success: true,
      workflow: WorkflowWithLegacyCompat
    };
  })
```

### POST /workflows.create  

**Current Issues**:
- Different input schemas between routers
- Optional chaining on mutation methods

**Fixed Interface**:
```typescript
create: protectedProcedure
  .input(CreateWorkflowInput)
  .mutation(async ({ input, ctx }) => {
    // Returns consistent CreateWorkflowResponse
    return {
      success: true,
      workflow: CreatedWorkflow
    };
  })
```

### PUT /workflows.update

**Current Issues**:
- Schema mismatch between frontend calls and backend expectations
- Missing type definitions

**Fixed Interface**:  
```typescript
update: protectedProcedure
  .input(UpdateWorkflowInput)
  .mutation(async ({ input, ctx }) => {
    // Returns consistent UpdateWorkflowResponse
    return {
      success: true,
      workflow: UpdatedWorkflow  
    };
  })
```

## Type Interface Definitions

### Input Schemas

```typescript
const CreateWorkflowInput = z.object({
  templateId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().default('custom'),
  definition: WorkflowDefinitionSchema,
  config: WorkflowConfigSchema
});

const UpdateWorkflowInput = z.object({
  workflowId: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  definition: WorkflowDefinitionSchema.optional(),
  config: WorkflowConfigSchema.optional(),
  isActive: z.boolean().optional(),
  isFavorite: z.boolean().optional()
});
```

### Response Types

```typescript
interface WorkflowResponse {
  success: boolean;
  workflow: {
    id: string;
    user_id: string;
    template_id?: string;
    name: string;
    description?: string;
    category: string;
    definition: WorkflowDefinition;
    config: WorkflowConfig;
    is_active: boolean;
    is_favorite: boolean;
    created_at: Date;
    updated_at: Date;
    // Legacy compatibility fields
    steps: WorkflowStep[];
    required_integrations: string[];
    icon: string;
  };
}
```

## Error Handling Standardization

### Consistent Error Response Format

```typescript
interface WorkflowErrorResponse {
  success: false;
  error: {
    code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR';
    message: string;
    details?: Record<string, any>;
  };
}
```

### Error Handler Implementation

```typescript
// Standardized error handling across all workflow routes
const handleWorkflowError = (error: unknown, context: string) => {
  if (error instanceof TRPCError) {
    throw error;
  }
  
  logger.error(`Workflow ${context} error`, { error });
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `Failed to ${context} workflow`
  });
};
```

## Migration Steps

1. **Phase 1**: Create unified workflow router with proper types
2. **Phase 2**: Update all frontend calls to use new unified structure  
3. **Phase 3**: Remove duplicate router files and update imports
4. **Phase 4**: Add comprehensive type tests to prevent regression