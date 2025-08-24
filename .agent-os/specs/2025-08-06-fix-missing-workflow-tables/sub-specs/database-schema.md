# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-06-fix-missing-workflow-tables/spec.md

> Created: 2025-08-06
> Version: 1.0.0

## Required Tables

### 1. workflow_templates
```sql
CREATE TABLE IF NOT EXISTS workflow_templates (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  goal TEXT,
  steps JSONB NOT NULL,
  conditions JSONB,
  outputs JSONB,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_is_active ON workflow_templates(is_active);
```

### 2. user_workflows
```sql
CREATE TABLE IF NOT EXISTS user_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id VARCHAR(255) REFERENCES workflow_templates(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  definition JSONB NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  last_used TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_workflows_user_id ON user_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workflows_template_id ON user_workflows(template_id);
CREATE INDEX IF NOT EXISTS idx_user_workflows_category ON user_workflows(category);
CREATE INDEX IF NOT EXISTS idx_user_workflows_is_active ON user_workflows(is_active);
```

### 3. workflow_executions (modifications)
```sql
-- Add user_workflow_id column
ALTER TABLE workflow_executions 
ADD COLUMN IF NOT EXISTS user_workflow_id UUID REFERENCES user_workflows(id) ON DELETE CASCADE;

-- Make template_id nullable
ALTER TABLE workflow_executions 
ALTER COLUMN template_id DROP NOT NULL;

-- Add constraint for source validation
ALTER TABLE workflow_executions 
DROP CONSTRAINT IF EXISTS workflow_executions_source_check;

ALTER TABLE workflow_executions 
ADD CONSTRAINT workflow_executions_source_check CHECK (
  (template_id IS NOT NULL AND user_workflow_id IS NULL) OR
  (template_id IS NULL AND user_workflow_id IS NOT NULL)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_workflow_id ON workflow_executions(user_workflow_id);
```

## Triggers

### Updated At Trigger
```sql
-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to user_workflows
DROP TRIGGER IF EXISTS update_user_workflows_updated_at ON user_workflows;
CREATE TRIGGER update_user_workflows_updated_at BEFORE UPDATE ON user_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to workflow_templates
DROP TRIGGER IF EXISTS update_workflow_templates_updated_at ON workflow_templates;
CREATE TRIGGER update_workflow_templates_updated_at BEFORE UPDATE
    ON workflow_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Migration Dependencies

1. **users** table must exist (for foreign key reference)
2. **workflow_executions** table must exist (for alterations)
3. Migration order is critical:
   - First: workflow_templates
   - Second: user_workflows
   - Third: workflow_executions modifications

## Data Types and Constraints

- **UUIDs**: Used for user_workflows.id for guaranteed uniqueness
- **VARCHAR(255)**: Used for template IDs to support custom string identifiers
- **JSONB**: Used for flexible schema storage (definition, config, steps, etc.)
- **Foreign Keys**: Cascade delete for user data, SET NULL for templates
- **Indexes**: Optimized for common query patterns (user_id, category, is_active)