-- Add orchestrator columns to tasks table
ALTER TABLE tasks ADD COLUMN orchestrator_stage TEXT DEFAULT 'pending'
    CHECK (orchestrator_stage IN ('pending', 'specification', 'implementation', 'review_qa', 'completed'));

ALTER TABLE tasks ADD COLUMN orchestrator_context TEXT DEFAULT '{}';

ALTER TABLE tasks ADD COLUMN container_id INTEGER CHECK (container_id IN (1, 2, 3));

-- Create new table for stage outputs
CREATE TABLE IF NOT EXISTS orchestrator_stage_outputs (
    id BLOB PRIMARY KEY,
    task_id BLOB NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    stage TEXT NOT NULL CHECK (stage IN ('specification', 'implementation', 'review_qa')),
    command_used TEXT,
    output TEXT,
    success INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    UNIQUE(task_id, stage)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_orchestrator_stage ON tasks(orchestrator_stage);
CREATE INDEX IF NOT EXISTS idx_orchestrator_stage_outputs_task_id ON orchestrator_stage_outputs(task_id);