# Workflow: Adding a New AI Executor

## Overview
This workflow guides you through adding support for a new AI coding agent to Vibe Kanban.

## Steps

### 1. Create Executor Implementation

Create a new file in `crates/executors/src/`:

```rust
// crates/executors/src/newagent.rs
use crate::{StandardCodingAgentExecutor, ExecutorError, NormalizedEntry};
use async_trait::async_trait;
use std::path::PathBuf;

pub struct NewAgentExecutor {
    command: String,
    args: Vec<String>,
}

#[async_trait]
impl StandardCodingAgentExecutor for NewAgentExecutor {
    async fn spawn(
        &self,
        current_dir: &PathBuf,
        prompt: &str,
    ) -> Result<AsyncGroupChild, ExecutorError> {
        // Build command
        let mut cmd = Command::new(&self.command);
        cmd.current_dir(current_dir)
           .args(&self.args)
           .arg(prompt);
        
        // Spawn process
        let child = cmd.group_spawn()?;
        Ok(child)
    }
    
    async fn spawn_follow_up(
        &self,
        current_dir: &PathBuf,
        prompt: &str,
        session_id: &str,
    ) -> Result<AsyncGroupChild, ExecutorError> {
        // Similar to spawn but with session resumption
    }
    
    async fn normalize_conversation(
        // parameters
    ) -> Vec<NormalizedEntry> {
        // Parse agent output into normalized entries
    }
}
```

### 2. Add to Executor Factory

Update `crates/executors/src/factory.rs`:

```rust
pub fn create_executor(executor_type: &str) -> Box<dyn StandardCodingAgentExecutor> {
    match executor_type {
        "CLAUDE_CODE" => Box::new(ClaudeCodeExecutor::new()),
        "GEMINI" => Box::new(GeminiExecutor::new()),
        "NEW_AGENT" => Box::new(NewAgentExecutor::new()), // Add this
        _ => panic!("Unknown executor type"),
    }
}
```

### 3. Update TypeScript Types

Add to `shared/types.ts` or regenerate:

```typescript
export enum ExecutorType {
  CLAUDE_CODE = "CLAUDE_CODE",
  GEMINI = "GEMINI",
  NEW_AGENT = "NEW_AGENT", // Add this
}
```

Run type generation:
```bash
npm run generate-types
```

### 4. Add Frontend Support

Update `frontend/src/components/ExecutorSelector.tsx`:

```typescript
const EXECUTOR_OPTIONS = [
  { value: 'CLAUDE_CODE', label: 'Claude Code' },
  { value: 'GEMINI', label: 'Gemini' },
  { value: 'NEW_AGENT', label: 'New Agent' }, // Add this
];
```

### 5. Create Profile Configuration

Add to `profiles.json`:

```json
{
  "profiles": [
    {
      "label": "NewAgent",
      "NEW_AGENT": {
        "command": {
          "base": "newagent",
          "params": ["--interactive"]
        }
      },
      "mcp_config_path": "~/.config/newagent/mcp.json",
      "variants": []
    }
  ]
}
```

### 6. Add Log Normalization

Implement output parsing in the executor:

```rust
impl NewAgentExecutor {
    fn parse_output(&self, output: &str) -> Vec<NormalizedEntry> {
        let mut entries = Vec::new();
        
        // Parse agent-specific output format
        // Convert to NormalizedEntry types:
        // - TEXT
        // - TOOL_USE
        // - FILE_CHANGE
        // - TODO
        
        entries
    }
}
```

### 7. Test the Integration

#### Unit Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_spawn() {
        let executor = NewAgentExecutor::new();
        let result = executor.spawn(&PathBuf::from("."), "test prompt").await;
        assert!(result.is_ok());
    }
}
```

#### Integration Test
1. Start dev server: `pnpm run dev`
2. Create a project
3. Create a task
4. Select the new executor
5. Run the task
6. Verify logs stream correctly
7. Check conversation normalization

### 8. Update Documentation

Add to `CLAUDE.md`:
```markdown
### Supported Executors
- Claude Code
- Gemini
- New Agent - Description of the new agent
```

### 9. Verify Checklist

- [ ] Executor implements StandardCodingAgentExecutor trait
- [ ] Added to executor factory
- [ ] TypeScript types updated
- [ ] Frontend UI updated
- [ ] Profile configuration created
- [ ] Log normalization working
- [ ] Unit tests passing
- [ ] Integration test successful
- [ ] Documentation updated
- [ ] Error handling comprehensive

## Common Issues

### Process Spawning Fails
- Check command exists in PATH
- Verify arguments format
- Test command manually first

### Log Parsing Issues
- Review agent output format
- Update normalization logic
- Handle edge cases

### Session Resumption
- Ensure session ID is passed correctly
- Verify agent supports resumption
- Test follow-up commands