# Fix Agent Endpoints 500 Errors Specification

> **Created**: 2025-07-27
> **Priority**: CRITICAL
> **Status**: In Progress
> **Impact**: Production blocking - Users cannot view or manage agents

## Problem Statement

The `agents.list` and `agents.executions` endpoints are returning 500 errors on the production deployment at https://takspilot-728214876651.europe-west1.run.app. This prevents users from:
- Viewing their agents in the Automations page
- Managing agent configurations
- Viewing agent execution history
- Creating or executing agents

## Root Cause Analysis

### 1. Table Name Mismatch
The primary issue is a mismatch between table names used in the code versus what exists in production:

**Code expects (AgentDatabaseService):**
- `agent_templates` table
- `user_agents` table
- `agent_executions` table

**Production has:**
- `agent_templates_v2` table (new structure)
- Missing or outdated `agent_templates` table
- Potentially missing `user_agents` and `agent_executions` tables

### 2. Schema Evolution
The codebase has evolved to use a v2 schema for agent templates with a different structure:
- Old: `agent_templates` with basic fields
- New: `agent_templates_v2` with enhanced fields like `role`, `purpose`, `default_workflow` as JSONB

### 3. Inconsistent Queries
- The router (`agents/index.ts`) directly queries `agent_templates_v2` in some methods
- The `AgentDatabaseService` still queries the old `agent_templates` table
- This creates inconsistency and failures when tables don't exist

## Technical Specification

### Solution Overview
Update the `AgentDatabaseService` to use the correct table names and handle both v1 and v2 schemas gracefully during the transition period.

### Affected Files
1. `/backend/services/agents/agent-database-service.ts` - Primary fix location
2. `/backend/trpc/routes/agents/index.ts` - Minor adjustments needed
3. `/backend/database/migrations/` - Ensure all migrations are applied

### Implementation Details

#### Phase 1: Update Table References
Update `AgentDatabaseService` methods to use correct table names:

```typescript
// In getAgentTemplates()
const query = 'SELECT * FROM agent_templates_v2 WHERE 1=1';

// In getUserAgents()
// First check if user_agents table exists, create if needed
const query = 'SELECT * FROM user_agents WHERE user_id = $1';

// In getAgentExecutions()
// Ensure agent_executions table exists
const query = `
  SELECT 
    ae.*,
    ua.name as agent_name,
    ua.description as agent_description
  FROM agent_executions ae
  LEFT JOIN user_agents ua ON ae.agent_id = ua.id
  WHERE ae.user_id = $1
`;
```

#### Phase 2: Update Mapping Functions
Adjust the mapping functions to handle v2 schema:

```typescript
private mapToAgentTemplateV2(row: any): AgentTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.purpose || row.description, // Handle both fields
    icon: row.icon,
    category: row.category,
    goal: row.purpose || row.goal,
    requiredIntegrations: row.required_integrations || [],
    steps: row.default_workflow?.steps || row.steps || [],
    capabilities: row.capabilities || [],
    defaultConfig: {
      settings: row.settings || {},
      default_workflow: row.default_workflow || {}
    },
    estimatedTime: row.estimated_time,
    usageCount: row.usage_count || 0,
    rating: row.rating || 0,
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
```

#### Phase 3: Add Migration Check
Create a method to ensure required tables exist:

```typescript
async ensureTablesExist(): Promise<void> {
  // Check and create user_agents table if missing
  await this.pool.query(`
    CREATE TABLE IF NOT EXISTS user_agents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      template_id VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      icon VARCHAR(100),
      category VARCHAR(50),
      goal TEXT,
      required_integrations JSONB DEFAULT '[]',
      steps JSONB DEFAULT '[]',
      config JSONB DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      is_favorite BOOLEAN DEFAULT false,
      last_used TIMESTAMP WITH TIME ZONE,
      execution_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check and create agent_executions table if missing
  await this.pool.query(`
    CREATE TABLE IF NOT EXISTS agent_executions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      agent_id UUID REFERENCES user_agents(id) ON DELETE SET NULL,
      flow_id UUID,
      status VARCHAR(50) NOT NULL,
      input_data JSONB,
      output_data JSONB,
      error_message TEXT,
      execution_log JSONB DEFAULT '[]',
      started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP WITH TIME ZONE,
      duration_ms INTEGER
    );
  `);

  // Create indexes
  await this.pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_agents_user_id ON user_agents(user_id);
    CREATE INDEX IF NOT EXISTS idx_agent_executions_user_id ON agent_executions(user_id);
    CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);
  `);
}
```

#### Phase 4: Initialize Tables on Service Start
Call `ensureTablesExist()` when the service initializes:

```typescript
// In agents/index.ts router initialization
const agentDb = new AgentDatabaseService(database.getPool());
// Ensure tables exist before using the service
await agentDb.ensureTablesExist().catch(err => {
  logger.error('Failed to ensure agent tables exist', { error: err });
});
```

### Testing Plan

#### Local Testing
1. Run database migrations locally
2. Test all agent endpoints:
   - `GET /api/trpc/agents.list`
   - `GET /api/trpc/agents.executions`
   - `POST /api/trpc/agents.create`
   - `POST /api/trpc/agents.execute`
3. Verify table creation with `psql` queries
4. Run the test script: `./backend/scripts/test-production-fixes.sh`

#### Production Testing
1. Deploy fix to staging environment first
2. Run production test script against staging
3. Monitor logs for any errors
4. Deploy to production
5. Run verification script
6. Monitor error rates in production logs

### Rollback Plan
If issues occur after deployment:
1. The changes are backward compatible (CREATE IF NOT EXISTS)
2. Revert to previous container image in Cloud Run
3. No data loss risk as we're only adding missing tables

### Success Criteria
- [ ] Agent list endpoint returns 200 status
- [ ] Agent executions endpoint returns 200 status
- [ ] Users can view agents in the Automations page
- [ ] No 500 errors in production logs for agent endpoints
- [ ] All existing functionality continues to work

### Implementation Timeline
1. **Immediate Fix** (1-2 hours): Update table references and add table creation
2. **Testing** (1 hour): Local and staging validation
3. **Deployment** (30 min): Production deployment and verification

### Future Improvements
1. Consolidate to single schema version (v2)
2. Add proper database migration system
3. Add health checks for table existence
4. Implement better error messages for missing tables

## Risk Assessment
- **Low Risk**: Changes use CREATE IF NOT EXISTS, no data modification
- **Medium Risk**: Table structure differences between v1 and v2
- **Mitigation**: Backward compatible mappings and gradual migration

## Monitoring
After deployment, monitor:
- Cloud Run logs for agent-related errors
- HTTP 500 error rates
- User reports of agent functionality
- Database query performance