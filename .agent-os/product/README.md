# Vibe Kanban Product Overview

## Mission
Vibe Kanban is a sophisticated task orchestration platform that maximizes productivity when working with AI coding agents. It acts as a central control plane for managing, executing, and reviewing tasks performed by various AI assistants.

## Core Value Propositions

### 1. Universal AI Agent Integration
- Seamlessly switch between Claude Code, Gemini CLI, Amp, Codex, Cursor, and other agents
- Maintain context across different coding assistants
- Standardized executor interface for consistent behavior

### 2. Parallel Task Orchestration
- Execute multiple AI agents concurrently on different tasks
- Sequential task chains with dependency management
- Isolated git worktrees prevent conflicts between parallel executions

### 3. Streamlined Review Process
- Real-time diff visualization of AI-generated changes
- Integrated pull request creation and management
- Quick merge workflows with conflict detection

### 4. Real-time Monitoring
- Server-Sent Events for live log streaming
- Task status tracking through lifecycle (todo → inprogress → inreview → done)
- Process execution monitoring with exit code tracking

### 5. MCP Server Integration
- Acts as a Model Context Protocol server
- Enables programmatic task management by AI agents
- Supports tool-based interaction patterns

## Target Users

### Primary Users
- Software engineers leveraging AI coding assistants
- Teams adopting AI-assisted development workflows
- Developers managing multiple concurrent AI tasks

### Use Cases
1. **Feature Development**: Break down features into tasks for AI execution
2. **Code Reviews**: Use AI agents to review and improve code
3. **Bug Fixes**: Assign bugs to AI agents for investigation and fixes
4. **Refactoring**: Orchestrate large-scale refactoring with AI assistance
5. **Documentation**: Generate and maintain documentation using AI

## Product Architecture

### Three-Layer Design
1. **Presentation Layer**: React frontend with real-time updates
2. **Orchestration Layer**: Rust backend managing executors and workflows
3. **Execution Layer**: AI agent executors with isolated environments

### Key Differentiators
- **Git Worktree Isolation**: Each task runs in its own worktree
- **Executor Abstraction**: Unified interface for diverse AI agents
- **Event Streaming**: Real-time updates without polling
- **Profile System**: Customizable AI agent configurations
- **Database-Backed**: Persistent task history and tracking

## Success Metrics

### Technical Metrics
- Task execution success rate
- Average task completion time
- Parallel execution efficiency
- Merge success rate

### User Metrics
- Tasks completed per developer
- Time saved vs manual development
- Code quality improvements
- Review cycle reduction

## Future Vision

### Short-term (3-6 months)
- Enhanced multi-agent coordination
- Improved context persistence
- Advanced workflow templates
- IDE plugin integrations

### Long-term (6-12 months)
- Cloud deployment with team collaboration
- Learning from feedback mechanisms
- Custom model training support
- Enterprise security features

## Product Principles

1. **Developer First**: Optimize for developer productivity and experience
2. **AI Agnostic**: Support any AI coding assistant without lock-in
3. **Reliability**: Ensure robust execution and error recovery
4. **Transparency**: Clear visibility into AI agent actions
5. **Efficiency**: Minimize overhead and maximize throughput