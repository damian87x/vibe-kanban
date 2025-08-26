# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-26-kanban-workflow-enhancement/spec.md

> Created: 2025-08-26
> Version: 1.0.0

## Schema Changes

### New Tables

#### batch_refinements
```sql
CREATE TABLE batch_refinements (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    agent_id TEXT,
    refinement_prompt TEXT,
    total_tasks INTEGER NOT NULL,
    completed_tasks INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX idx_batch_refinements_project ON batch_refinements(project_id);
CREATE INDEX idx_batch_refinements_status ON batch_refinements(status);
```

#### batch_refinement_tasks
```sql
CREATE TABLE batch_refinement_tasks (
    batch_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    sequence_order INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    original_state JSONB,
    refined_state JSONB,
    changes_applied BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    processed_at TIMESTAMP,
    PRIMARY KEY (batch_id, task_id),
    FOREIGN KEY (batch_id) REFERENCES batch_refinements(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped'))
);

CREATE INDEX idx_batch_tasks_status ON batch_refinement_tasks(status);
```

#### environments
```sql
CREATE TABLE environments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    task_id TEXT,
    worktree_path TEXT NOT NULL UNIQUE,
    branch TEXT NOT NULL,
    port INTEGER,
    status TEXT NOT NULL DEFAULT 'initializing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cleanup_after TIMESTAMP,
    metadata JSONB,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    CHECK (status IN ('initializing', 'running', 'testing', 'idle', 'cleaning', 'terminated'))
);

CREATE INDEX idx_environments_project ON environments(project_id);
CREATE INDEX idx_environments_status ON environments(status);
CREATE INDEX idx_environments_cleanup ON environments(cleanup_after);
```

#### workflow_configurations
```sql
CREATE TABLE workflow_configurations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    configuration JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_workflow_project ON workflow_configurations(project_id);
```

#### workflow_stages
```sql
CREATE TABLE workflow_stages (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    name TEXT NOT NULL,
    sequence_order INTEGER NOT NULL,
    agent_id TEXT,
    auto_transition BOOLEAN DEFAULT FALSE,
    is_parallel BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT TRUE,
    manual_trigger BOOLEAN DEFAULT FALSE,
    configuration JSONB,
    FOREIGN KEY (workflow_id) REFERENCES workflow_configurations(id) ON DELETE CASCADE,
    UNIQUE (workflow_id, name),
    UNIQUE (workflow_id, sequence_order)
);

CREATE INDEX idx_stages_workflow ON workflow_stages(workflow_id);
```

#### agents
```sql
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    version TEXT,
    capabilities JSONB,
    configuration JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (type IN ('planning', 'development', 'qa', 'review', 'custom'))
);

CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_active ON agents(is_active);
```

#### agent_executions
```sql
CREATE TABLE agent_executions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    task_id TEXT,
    batch_id TEXT,
    environment_id TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'running',
    input_context JSONB,
    output_context JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (batch_id) REFERENCES batch_refinements(id),
    FOREIGN KEY (environment_id) REFERENCES environments(id),
    CHECK (status IN ('running', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX idx_executions_agent ON agent_executions(agent_id);
CREATE INDEX idx_executions_task ON agent_executions(task_id);
CREATE INDEX idx_executions_status ON agent_executions(status);
```

### Modified Tables

#### tasks (modifications)
```sql
ALTER TABLE tasks 
ADD COLUMN workflow_stage TEXT,
ADD COLUMN assigned_agent_id TEXT,
ADD COLUMN refinement_data JSONB,
ADD COLUMN environment_id TEXT,
ADD FOREIGN KEY (assigned_agent_id) REFERENCES agents(id),
ADD FOREIGN KEY (environment_id) REFERENCES environments(id);

CREATE INDEX idx_tasks_workflow_stage ON tasks(workflow_stage);
CREATE INDEX idx_tasks_environment ON tasks(environment_id);
```

#### projects (modifications)
```sql
ALTER TABLE projects
ADD COLUMN workflow_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN default_agents JSONB,
ADD COLUMN environment_settings JSONB;
```

## Migration Scripts

### Up Migration
```sql
-- Migration: 0001_kanban_workflow_enhancement.up.sql

-- Create batch refinement tables
CREATE TABLE batch_refinements (...);
CREATE TABLE batch_refinement_tasks (...);

-- Create environment management tables
CREATE TABLE environments (...);

-- Create workflow configuration tables
CREATE TABLE workflow_configurations (...);
CREATE TABLE workflow_stages (...);

-- Create agent management tables
CREATE TABLE agents (...);
CREATE TABLE agent_executions (...);

-- Modify existing tables
ALTER TABLE tasks ...;
ALTER TABLE projects ...;

-- Create all indexes
CREATE INDEX ...;

-- Insert default agents
INSERT INTO agents (id, name, type, capabilities) VALUES
  ('claude-planning', 'Claude Planning Agent', 'planning', '{"refinement": true, "estimation": true}'),
  ('claude-code', 'Claude Code Agent', 'development', '{"coding": true, "testing": true}'),
  ('qa-specialist', 'QA Specialist Agent', 'qa', '{"testing": true, "validation": true}'),
  ('tech-lead', 'Tech Lead Review Agent', 'review', '{"code_review": true, "architecture": true}');
```

### Down Migration
```sql
-- Migration: 0001_kanban_workflow_enhancement.down.sql

-- Remove added columns from existing tables
ALTER TABLE tasks 
DROP COLUMN workflow_stage,
DROP COLUMN assigned_agent_id,
DROP COLUMN refinement_data,
DROP COLUMN environment_id;

ALTER TABLE projects
DROP COLUMN workflow_enabled,
DROP COLUMN default_agents,
DROP COLUMN environment_settings;

-- Drop all new tables
DROP TABLE agent_executions;
DROP TABLE agents;
DROP TABLE workflow_stages;
DROP TABLE workflow_configurations;
DROP TABLE environments;
DROP TABLE batch_refinement_tasks;
DROP TABLE batch_refinements;
```

## Query Patterns

### Get Active Environments
```sql
SELECT e.*, t.name as task_name, p.name as project_name
FROM environments e
JOIN projects p ON e.project_id = p.id
LEFT JOIN tasks t ON e.task_id = t.id
WHERE e.status IN ('running', 'testing', 'idle')
ORDER BY e.created_at DESC;
```

### Get Batch Refinement Progress
```sql
SELECT 
    br.*,
    COUNT(brt.task_id) as total_tasks,
    SUM(CASE WHEN brt.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
FROM batch_refinements br
LEFT JOIN batch_refinement_tasks brt ON br.id = brt.batch_id
WHERE br.id = ?
GROUP BY br.id;
```

### Get Workflow Configuration
```sql
SELECT 
    wc.*,
    json_agg(
        json_build_object(
            'stage', ws.name,
            'order', ws.sequence_order,
            'agent', a.name,
            'capabilities', a.capabilities
        ) ORDER BY ws.sequence_order
    ) as stages
FROM workflow_configurations wc
JOIN workflow_stages ws ON wc.id = ws.workflow_id
LEFT JOIN agents a ON ws.agent_id = a.id
WHERE wc.project_id = ? AND wc.is_active = true
GROUP BY wc.id;
```

## Performance Optimizations

1. **Partitioning**: Consider partitioning agent_executions by created_at for better query performance
2. **Indexes**: All foreign keys and commonly queried columns have indexes
3. **JSONB**: Using JSONB for flexible schema while maintaining query performance
4. **Cleanup**: Automated cleanup of old environment and execution records via scheduled jobs

## Data Integrity

1. **Foreign Keys**: All relationships properly constrained
2. **Check Constraints**: Status fields limited to valid values
3. **Unique Constraints**: Prevent duplicate workflow stages and configurations
4. **Cascading Deletes**: Proper cleanup of related records
5. **Transactions**: Batch operations wrapped in transactions for consistency