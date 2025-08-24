# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-08-17-fix-integration-gaps/spec.md

> Created: 2025-08-17
> Status: Ready for Implementation

## Tasks

- [ ] 1. **Simplify Database Architecture**
  - [ ] 1.1 Write tests for consolidated database service
  - [ ] 1.2 Merge database.ts, enhanced-database.ts, and postgres-database.ts into single service
  - [ ] 1.3 Remove deprecated migration systems and consolidate to backend/database/migrations/
  - [ ] 1.4 Clean up duplicate app/ directory structure
  - [ ] 1.5 Remove deprecated methods from provider factory
  - [ ] 1.6 Simplify OAuth configuration to single file
  - [ ] 1.7 Replace complex error hierarchy with standard errors
  - [ ] 1.8 Run migration to convert legacy templates
  - [ ] 1.9 Remove template-converter.ts after migration
  - [ ] 1.10 Verify all database operations work with MCP browser tools
  - [ ] 1.11 Verify all tests pass

- [ ] 2. **Enable Knowledge Base Vector Search**
  - [ ] 2.1 Write tests for vector search functionality
  - [ ] 2.2 Update Prisma schema to include vector fields (with Unsupported type)
  - [ ] 2.3 Create Prisma migration with custom SQL for pgvector extension
  - [ ] 2.4 Implement embedding generation service using OpenAI
  - [ ] 2.5 Create document chunking with overlap strategy
  - [ ] 2.6 Implement vector similarity search using Prisma raw queries
  - [ ] 2.7 Add embedding generation to file upload flow
  - [ ] 2.8 Process existing documents to generate embeddings
  - [ ] 2.9 Verify vector search works using MCP browser tools
  - [ ] 2.10 Verify all tests pass

- [ ] 3. **Implement Agent Session Management**
  - [ ] 3.1 Write tests for AgentSessionManager
  - [ ] 3.2 Add AgentSession model to Prisma schema
  - [ ] 3.3 Generate and run Prisma migration for agent_sessions
  - [ ] 3.4 Implement AgentSessionManager service using Prisma client
  - [ ] 3.5 Create session status transition validation with Prisma enums
  - [ ] 3.6 Implement checkpoint saving during conversations
  - [ ] 3.7 Add session grouping in conversation history
  - [ ] 3.8 Create useAgentSessionStore for frontend
  - [ ] 3.9 Verify session persistence using MCP browser tools
  - [ ] 3.10 Verify all tests pass

- [ ] 4. **Build Dynamic Template-Chat Bridge**
  - [ ] 4.1 Write tests for DynamicPromptGenerator
  - [ ] 4.2 Implement template parsing and structure extraction
  - [ ] 4.3 Create variable interpolation system
  - [ ] 4.4 Build integration capability mapping
  - [ ] 4.5 Implement prompt composition with caching
  - [ ] 4.6 Create initializeChatFromTemplate method
  - [ ] 4.7 Replace URL parameter passing with session IDs
  - [ ] 4.8 Add auto-execution for high-confidence templates
  - [ ] 4.9 Verify template to chat flow using MCP browser tools
  - [ ] 4.10 Verify all tests pass

- [ ] 5. **Create Integration Event System**
  - [ ] 5.1 Write tests for real-time integration events
  - [ ] 5.2 Add IntegrationEvent model to Prisma schema
  - [ ] 5.3 Generate and run Prisma migration for integration_events
  - [ ] 5.4 Implement WebSocket event bus for real-time updates
  - [ ] 5.5 Create integration discovery service using Prisma
  - [ ] 5.6 Add dynamic tool registry maintenance
  - [ ] 5.7 Implement event recording and history with Prisma
  - [ ] 5.8 Update chat service to use real-time integration status
  - [ ] 5.9 Add integration status indicators to UI
  - [ ] 5.10 Verify real-time updates using MCP browser tools
  - [ ] 5.11 Verify all tests pass

- [ ] 6. **Fix Broken Features and TODOs**
  - [ ] 6.1 Write tests for health check endpoints
  - [ ] 6.2 Implement actual MCP health checks (replace TODO)
  - [ ] 6.3 Implement workflow health monitoring (replace TODO)
  - [ ] 6.4 Fix user workflow execution logic (replace TODO)
  - [ ] 6.5 Add proper SSL certificate verification
  - [ ] 6.6 Implement workflow template filtering by userId
  - [ ] 6.7 Fix cost tracking display in chat
  - [ ] 6.8 Add proper error handling for S3 uploads
  - [ ] 6.9 Verify all features work using MCP browser tools
  - [ ] 6.10 Verify all tests pass

- [ ] 7. **Migration and Data Cleanup**
  - [ ] 7.1 Write Prisma-based migration scripts for existing data
  - [ ] 7.2 Use Prisma client to migrate existing conversations to sessions
  - [ ] 7.3 Convert legacy templates to unified format using Prisma transactions
  - [ ] 7.4 Remove duplicate scripts and organize remaining
  - [ ] 7.5 Update all references to removed code
  - [ ] 7.6 Archive old unused files
  - [ ] 7.7 Run Prisma migrations on test database first
  - [ ] 7.8 Verify data integrity after migration using Prisma queries
  - [ ] 7.9 Document Prisma migration process
  - [ ] 7.10 Verify system works post-migration using MCP browser tools

## Implementation Order

Tasks should be completed in the listed order as they build upon each other:

1. **Simplify Database Architecture** - Clean foundation for other changes
2. **Enable Knowledge Base Vector Search** - Critical missing feature
3. **Agent Session Management** - Foundation for template-chat bridge
4. **Dynamic Template-Chat Bridge** - Core integration functionality
5. **Integration Event System** - Real-time capabilities
6. **Fix Broken Features** - Clean up technical debt
7. **Migration and Cleanup** - Final consolidation

## Success Criteria

- [ ] Database services consolidated from 3 to 1
- [ ] Knowledge base supports semantic vector search
- [ ] Agent sessions persist across browser restarts
- [ ] Templates dynamically generate prompts with context
- [ ] Integrations update status in real-time
- [ ] All TODO comments replaced with implementations
- [ ] Codebase reduced by ~30% through consolidation
- [ ] All tests pass with > 90% coverage
- [ ] Performance metrics meet targets (< 500ms session init, < 100ms prompt gen, < 200ms vector search)

## Technical Notes

- Each major task includes MCP browser tool verification
- Follow TDD approach - write tests first
- Use Prisma for all database operations (no raw SQL except for vector operations)
- Maintain backward compatibility during migration
- Use feature flags for gradual rollout
- Document all breaking changes
- Monitor performance impact of vector operations
- Implement proper error handling and recovery
- Use Prisma transactions for data consistency
- Leverage Prisma's type safety for all database operations

## Risk Mitigation

- **pgvector Installation**: May require database admin privileges, use custom Prisma migration
- **Prisma Vector Support**: Limited native support, use raw queries for vector operations
- **Migration Risk**: Test Prisma migrations thoroughly on staging before production
- **Performance Risk**: Vector operations may impact database performance, monitor with Prisma metrics
- **WebSocket Scaling**: May need connection pooling for many users
- **Breaking Changes**: Use feature flags and gradual rollout