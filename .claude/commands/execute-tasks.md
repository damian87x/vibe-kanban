# Execute Task

Execute the next task with automatic work log tracking.

## Pre-execution Hook
Before starting task execution:
1. Update `specs/work_log.md` with task start timestamp
2. Extract task details from specification
3. Set status to "In Progress"

## Task Execution
Refer to the instructions located in .agent-os/instructions/execute-tasks.md

## Post-execution Hook
After completing task execution:
1. Update task status to "✅ Completed"
2. Add completion timestamp
3. Include results summary

## Usage
```
/execute-tasks path/to/spec.md
```

The hooks automatically maintain a work log at `specs/work_log.md` with:
- Task start/completion timestamps
- Specification file references
- Status tracking
- Results documentation
