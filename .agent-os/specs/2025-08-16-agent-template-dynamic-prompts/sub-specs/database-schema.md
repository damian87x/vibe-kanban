# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-16-agent-template-dynamic-prompts/spec.md

> Created: 2025-08-16
> Version: 1.0.0

## Schema Changes

### New Tables

#### 1. generated_prompts

Stores generated prompts for caching and analytics.

```sql
CREATE TABLE generated_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES agent_templates_v2(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES user_agents(id) ON DELETE SET NULL,
  
  -- Prompt data
  system_prompt TEXT NOT NULL,
  initial_message TEXT,
  goal TEXT,
  context JSONB NOT NULL DEFAULT '{}',
  
  -- Configuration
  model VARCHAR(100) NOT NULL,
  temperature DECIMAL(3,2),
  max_tokens INTEGER,
  
  -- Metadata
  generation_params JSONB NOT NULL DEFAULT '{}',
  cache_key VARCHAR(255) UNIQUE,
  expires_at TIMESTAMPTZ,
  
  -- Tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_generated_prompts_template_user (template_id, user_id),
  INDEX idx_generated_prompts_cache_key (cache_key),
  INDEX idx_generated_prompts_expires (expires_at)
);
```

#### 2. agent_executions

Tracks agent execution history with prompt references.

```sql
CREATE TABLE agent_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES user_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES generated_prompts(id) ON DELETE SET NULL,
  conversation_id UUID,
  
  -- Execution data
  status VARCHAR(50) NOT NULL DEFAULT 'initialized',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Performance metrics
  tokens_used INTEGER,
  execution_time_ms INTEGER,
  api_calls_count INTEGER,
  
  -- Results
  result JSONB,
  error TEXT,
  
  -- Context
  integrations_used JSONB DEFAULT '[]',
  tools_called JSONB DEFAULT '[]',
  
  -- Indexes
  INDEX idx_agent_executions_agent (agent_id),
  INDEX idx_agent_executions_user (user_id),
  INDEX idx_agent_executions_status (status),
  INDEX idx_agent_executions_started (started_at DESC)
);
```

#### 3. prompt_templates

User-customizable prompt templates.

```sql
CREATE TABLE prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_template_id UUID REFERENCES agent_templates_v2(id) ON DELETE CASCADE,
  
  -- Template data
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_string TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  
  -- Configuration
  is_default BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, agent_template_id, name),
  
  -- Indexes
  INDEX idx_prompt_templates_user (user_id),
  INDEX idx_prompt_templates_agent (agent_template_id),
  INDEX idx_prompt_templates_public (is_public)
);
```

### Modified Tables

#### 1. user_agents

Add fields for prompt generation and execution tracking.

```sql
ALTER TABLE user_agents 
ADD COLUMN IF NOT EXISTS last_prompt_id UUID REFERENCES generated_prompts(id),
ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS average_execution_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS prompt_template_id UUID REFERENCES prompt_templates(id);
```

#### 2. agent_templates_v2

Add fields for prompt generation configuration.

```sql
ALTER TABLE agent_templates_v2
ADD COLUMN IF NOT EXISTS prompt_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS prompt_template TEXT,
ADD COLUMN IF NOT EXISTS context_requirements JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS execution_metrics JSONB DEFAULT '{}';
```

#### 3. conversations (if exists)

Link conversations to agent executions.

```sql
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS agent_execution_id UUID REFERENCES agent_executions(id),
ADD COLUMN IF NOT EXISTS template_context JSONB DEFAULT '{}';
```

## Indexes

### Performance Indexes

```sql
-- Fast prompt lookups
CREATE INDEX idx_generated_prompts_lookup 
ON generated_prompts(template_id, user_id, cache_key) 
WHERE expires_at > NOW();

-- Execution analytics
CREATE INDEX idx_agent_executions_analytics
ON agent_executions(agent_id, status, started_at DESC)
WHERE completed_at IS NOT NULL;

-- Template usage tracking
CREATE INDEX idx_prompt_templates_usage
ON prompt_templates(agent_template_id, is_public, created_at DESC);
```

## Migrations

### Migration 001: Initial Schema

```sql
-- Run all CREATE TABLE statements above
-- Run all ALTER TABLE statements above
-- Run all CREATE INDEX statements above
```

### Migration 002: Add Constraints

```sql
-- Ensure data integrity
ALTER TABLE agent_executions
ADD CONSTRAINT check_execution_times 
CHECK (completed_at IS NULL OR completed_at >= started_at);

ALTER TABLE generated_prompts
ADD CONSTRAINT check_expiry 
CHECK (expires_at IS NULL OR expires_at > created_at);

ALTER TABLE prompt_templates
ADD CONSTRAINT check_version 
CHECK (version > 0);
```

## Data Integrity Rules

1. **Cascade Deletes**
   - Deleting a user cascades to their prompts and executions
   - Deleting a template cascades to generated prompts
   - Deleting an agent sets execution references to NULL

2. **Unique Constraints**
   - Cache keys must be unique for prompt caching
   - User template names must be unique per agent template

3. **Check Constraints**
   - Execution completed time must be after start time
   - Prompt expiry must be after creation
   - Version numbers must be positive

## Performance Considerations

1. **Indexing Strategy**
   - Primary indexes on foreign keys for fast joins
   - Composite indexes for common query patterns
   - Partial indexes for active/recent data

2. **Data Retention**
   - Auto-delete expired prompts after 30 days
   - Archive old executions after 90 days
   - Maintain rolling analytics window

3. **Query Optimization**
   - Use JSONB for flexible schema fields
   - Implement materialized views for analytics
   - Consider partitioning for large tables