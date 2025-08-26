# Feature Specification: Orchestrator Manager

## Metadata
- **Date Created**: 2025-01-26
- **Author**: Agent OS
- **Status**: Draft
- **Version**: 1.0.0

## Executive Summary
The Orchestrator Manager is a control layer that sits on top of Claude Code CLI, managing task progression through three distinct stages (specification, implementation, and QA) with automatic context passing and concurrent execution management.

## Problem Statement
### Current Situation
Currently, task execution in Vibe Kanban requires manual stage transitions and context management. Users must manually move tasks between specification, implementation, and QA stages, leading to inefficient workflows and lost context between stages.

### Desired Outcome
An automated orchestration system that manages task progression through stages, maintains context between stages, and efficiently allocates resources for concurrent task execution.

## Solution Overview
### Approach
Build a lightweight orchestrator service that integrates with Claude Code CLI, managing task lifecycle through automated stage transitions while maintaining full context and audit trails.

### Key Components
1. Stage Manager - Controls task progression through spec/impl/QA stages
2. Context Manager - Maintains and passes context between stages
3. Resource Allocator - Manages concurrent execution with container pool
4. Claude CLI Integration - Executes different command modes per stage

## User Stories
### Primary User Story
As a developer, I want my tasks to automatically progress through specification, implementation, and QA stages so that I can focus on high-level guidance rather than manual transitions.

### Additional User Stories
- As a developer, I want context from the specification stage to be available during implementation
- As a QA engineer, I want to see implementation details when reviewing code
- As a team lead, I want to limit concurrent executions to manage resource usage

## Acceptance Criteria
- [ ] Tasks automatically progress from spec to implementation to QA
- [ ] Context is preserved and passed between stages
- [ ] Maximum 2 concurrent task executions
- [ ] Each stage uses appropriate Claude command mode
- [ ] Container pool manages isolated environments
- [ ] Real-time status updates via SSE
- [ ] Audit trail for all stage transitions

## Technical Requirements
### Architecture
Service layer architecture with OrchestratorService managing stage transitions, integrated with existing WorktreeManager and container pool.

### Dependencies
- Claude Code CLI (external process)
- Docker containers for isolation
- SQLite for state persistence
- Server-Sent Events for real-time updates

### Constraints
- Maximum 2 concurrent task executions
- Fixed pool of 3 containers (ports 8081-8083)
- Must preserve existing task table schema
- Cannot modify Claude Code CLI behavior

## Implementation Phases
### Phase 1: Foundation
- Description: Core orchestrator service and database schema
- Timeline: 3 days
- Deliverables: OrchestratorService, stage tracking, database migrations

### Phase 2: Claude Integration
- Description: Integrate with Claude Code CLI for each stage
- Timeline: 4 days
- Deliverables: Command execution, context passing, output capture

### Phase 3: Container Management
- Description: Container pool and resource allocation
- Timeline: 3 days
- Deliverables: Container pool, port management, cleanup routines

### Phase 4: UI Integration
- Description: Frontend components for stage visualization
- Timeline: 4 days
- Deliverables: Stage progress UI, real-time updates, context viewer

## Success Metrics
- Task completion rate: > 90%
- Average time per stage: < 30 minutes
- Container utilization: > 70%
- Context preservation: 100%
- User intervention required: < 10% of tasks

## Risks & Mitigations
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Claude CLI failures | Medium | High | Implement retry logic with exponential backoff |
| Container resource exhaustion | Low | High | Fixed pool size with queue management |
| Context data loss | Low | Medium | Persist context to database at each stage |
| Stage transition deadlocks | Low | Medium | Timeout mechanism with manual override |

## References
- Original Mini MVP Specification: specs/ORCHESTRATOR_MINI_MVP_SPEC.md
- Vibe Kanban Architecture: CLAUDE.md
- Claude Code CLI Documentation: External