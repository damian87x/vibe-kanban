# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-16-template-chat-integration-architecture/spec.md

> Created: 2025-08-16
> Version: 1.0.0

## Schema Changes

### New Tables

#### 1. agent_sessions

Primary table for managing persistent agent sessions.

```sql
CREATE TABLE agent_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id VARCHAR(255) NOT NULL REFERENCES agent_templates_v2(id),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session state
  status VARCHAR(50) NOT NULL DEFAULT 'INITIALIZING',
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  
  -- Context data
  context JSONB NOT NULL DEFAULT '{}',
  variables JSONB DEFAULT '{}',
  checkpoints JSONB DEFAULT '[]',
  
  -- Relationships
  conversation_ids TEXT[] DEFAULT '{}',
  parent_session_id UUID REFERENCES agent_sessions(id),
  
  -- Metrics
  tokens_used INTEGER DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,
  execution_time_ms INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN (
    'INITIALIZING', 'RUNNING', 'PAUSED', 'WAITING_FOR_INPUT',
    'COMPLETED', 'FAILED', 'CANCELLED'
  )),
  
  -- Indexes
  INDEX idx_agent_sessions_user (user_id),
  INDEX idx_agent_sessions_template (template_id),
  INDEX idx_agent_sessions_status (status),
  INDEX idx_agent_sessions_created (created_at DESC)
);
```

#### 2. session_checkpoints

Stores checkpoint data for session recovery.

```sql
CREATE TABLE session_checkpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
  
  -- Checkpoint data
  step_number INTEGER NOT NULL,
  checkpoint_type VARCHAR(50) NOT NULL,
  state JSONB NOT NULL,
  
  -- Message context
  last_message_id VARCHAR(255),
  message_count INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(session_id, step_number),
  
  -- Indexes
  INDEX idx_checkpoints_session (session_id),
  INDEX idx_checkpoints_created (created_at DESC)
);
```

#### 3. session_executions

Tracks individual execution runs within a session.

```sql
CREATE TABLE session_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
  
  -- Execution details
  step_number INTEGER NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  action_data JSONB,
  
  -- Results
  status VARCHAR(50) NOT NULL,
  result JSONB,
  error TEXT,
  
  -- Performance
  duration_ms INTEGER,
  tokens_used INTEGER,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Indexes
  INDEX idx_executions_session (session_id),
  INDEX idx_executions_step (session_id, step_number)
);
```

#### 4. template_prompts

Stores generated prompts for templates with caching.

```sql
CREATE TABLE template_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id VARCHAR(255) NOT NULL REFERENCES agent_templates_v2(id),
  
  -- Prompt data
  system_prompt TEXT NOT NULL,
  initial_context JSONB NOT NULL,
  capabilities JSONB DEFAULT '[]',
  constraints JSONB DEFAULT '[]',
  
  -- Configuration
  model_config JSONB DEFAULT '{}',
  integration_config JSONB DEFAULT '{}',
  
  -- Caching
  cache_key VARCHAR(255) UNIQUE,
  expires_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_template_prompts_template (template_id),
  INDEX idx_template_prompts_cache (cache_key),
  INDEX idx_template_prompts_expires (expires_at)
);
```

### Modified Tables

#### 1. conversations

Add session tracking to conversations.

```sql
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES agent_sessions(id),
ADD COLUMN IF NOT EXISTS session_context JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_session_active BOOLEAN DEFAULT FALSE;

-- Add index for session lookups
CREATE INDEX IF NOT EXISTS idx_conversations_session 
ON conversations(session_id) 
WHERE session_id IS NOT NULL;
```

#### 2. agent_templates_v2

Enhance templates with session configuration.

```sql
ALTER TABLE agent_templates_v2
ADD COLUMN IF NOT EXISTS session_config JSONB DEFAULT '{
  "autoStart": false,
  "allowPause": true,
  "maxDuration": 3600000,
  "checkpointInterval": 300000
}',
ADD COLUMN IF NOT EXISTS prompt_template TEXT,
ADD COLUMN IF NOT EXISTS execution_strategy VARCHAR(50) DEFAULT 'sequential',
ADD COLUMN IF NOT EXISTS max_concurrent_sessions INTEGER DEFAULT 5;
```

#### 3. user_agents

Link user agents to active sessions.

```sql
ALTER TABLE user_agents
ADD COLUMN IF NOT EXISTS active_session_id UUID REFERENCES agent_sessions(id),
ADD COLUMN IF NOT EXISTS total_sessions_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_session_at TIMESTAMPTZ;
```

## Indexes

### Performance Indexes

```sql
-- Fast session lookups by user and status
CREATE INDEX idx_agent_sessions_user_status 
ON agent_sessions(user_id, status) 
WHERE status IN ('RUNNING', 'PAUSED', 'WAITING_FOR_INPUT');

-- Active sessions for monitoring
CREATE INDEX idx_agent_sessions_active
ON agent_sessions(status, updated_at DESC)
WHERE status NOT IN ('COMPLETED', 'FAILED', 'CANCELLED');

-- Template usage tracking
CREATE INDEX idx_agent_sessions_template_metrics
ON agent_sessions(template_id, created_at DESC)
INCLUDE (tokens_used, execution_time_ms);

-- Checkpoint recovery
CREATE INDEX idx_checkpoints_recovery
ON session_checkpoints(session_id, step_number DESC)
WHERE checkpoint_type = 'recovery';
```

## Migrations

### Migration 001: Create Session Tables

```sql
-- Create all new tables
CREATE TABLE agent_sessions (...);
CREATE TABLE session_checkpoints (...);
CREATE TABLE session_executions (...);
CREATE TABLE template_prompts (...);

-- Modify existing tables
ALTER TABLE conversations ...;
ALTER TABLE agent_templates_v2 ...;
ALTER TABLE user_agents ...;

-- Create indexes
CREATE INDEX ...;
```

### Migration 002: Migrate Existing Data

```sql
-- Migrate existing agent conversations to sessions
INSERT INTO agent_sessions (
  template_id,
  user_id,
  status,
  conversation_ids,
  created_at
)
SELECT 
  c.agent_context->>'agentId' as template_id,
  c.user_id,
  'COMPLETED' as status,
  ARRAY[c.id] as conversation_ids,
  c.created_at
FROM conversations c
WHERE c.agent_context IS NOT NULL
  AND c.agent_context->>'agentId' IS NOT NULL;

-- Link conversations to sessions
UPDATE conversations c
SET session_id = s.id
FROM agent_sessions s
WHERE c.id = ANY(s.conversation_ids);
```

## Data Integrity Rules

### Cascade Rules

1. **User Deletion**: Cascades to agent_sessions
2. **Session Deletion**: Cascades to checkpoints and executions
3. **Template Deletion**: Restricts if active sessions exist

### Constraints

1. **Session Status Transitions**
   ```sql
   CREATE OR REPLACE FUNCTION validate_status_transition()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Define valid transitions
     IF OLD.status = 'COMPLETED' AND NEW.status != 'COMPLETED' THEN
       RAISE EXCEPTION 'Cannot change status of completed session';
     END IF;
     
     IF OLD.status = 'CANCELLED' AND NEW.status != 'CANCELLED' THEN
       RAISE EXCEPTION 'Cannot change status of cancelled session';
     END IF;
     
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   
   CREATE TRIGGER check_status_transition
   BEFORE UPDATE ON agent_sessions
   FOR EACH ROW
   EXECUTE FUNCTION validate_status_transition();
   ```

2. **Checkpoint Ordering**
   ```sql
   ALTER TABLE session_checkpoints
   ADD CONSTRAINT check_step_sequence
   CHECK (step_number >= 0);
   ```

## Performance Considerations

### Partitioning Strategy

For high-volume deployments, partition agent_sessions by created_at:

```sql
-- Create partitioned table
CREATE TABLE agent_sessions_partitioned (
  LIKE agent_sessions INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE agent_sessions_2025_01 
PARTITION OF agent_sessions_partitioned
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### Data Retention

```sql
-- Archive completed sessions older than 90 days
CREATE OR REPLACE FUNCTION archive_old_sessions()
RETURNS void AS $$
BEGIN
  INSERT INTO agent_sessions_archive
  SELECT * FROM agent_sessions
  WHERE status IN ('COMPLETED', 'FAILED', 'CANCELLED')
    AND completed_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM agent_sessions
  WHERE status IN ('COMPLETED', 'FAILED', 'CANCELLED')
    AND completed_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule daily cleanup
SELECT cron.schedule('archive-sessions', '0 2 * * *', 'SELECT archive_old_sessions()');
```

### Query Optimization

```sql
-- Materialized view for session analytics
CREATE MATERIALIZED VIEW session_analytics AS
SELECT 
  template_id,
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as session_count,
  AVG(execution_time_ms) as avg_duration,
  SUM(tokens_used) as total_tokens,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_count
FROM agent_sessions
GROUP BY template_id, DATE_TRUNC('day', created_at);

-- Refresh daily
CREATE INDEX ON session_analytics (template_id, day DESC);
```