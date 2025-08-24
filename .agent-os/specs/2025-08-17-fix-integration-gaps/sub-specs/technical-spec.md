# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-17-fix-integration-gaps/spec.md

> Created: 2025-08-17
> Version: 1.0.0

## Technical Requirements

### 1. Dynamic Template-Chat Bridge
- **Template Prompt Engine**: Convert workflow templates to dynamic system prompts
- **Variable Interpolation**: Replace template variables with actual context values
- **Integration Mapping**: Automatically include available tools based on connected integrations
- **Context Building**: Generate agent context from template structure
- **Caching Layer**: Cache generated prompts for performance

### 2. Agent Session Management
- **Session Store**: PostgreSQL table for agent_sessions with state persistence
- **Session Context**: JSON field for flexible context storage
- **Checkpoint System**: Save conversation state at key points
- **Recovery Mechanism**: Resume sessions after interruptions
- **Status Tracking**: Running, paused, completed, failed states
- **Session Grouping**: Link multiple conversations to single session

### 3. Integration Event System
- **Event Bus**: WebSocket-based real-time updates
- **Integration Discovery**: Dynamic tool availability checking
- **Status Monitoring**: Track connection health and usage
- **Tool Registry**: Maintain available tools per integration
- **Event Types**: connected, disconnected, tool_used, error
- **Context Updates**: Push integration changes to active chats

### 4. Knowledge Base Vector Search
- **pgvector Extension**: Enable and configure for PostgreSQL
- **Embedding Service**: Use OpenAI embeddings API
- **Vector Dimensions**: 1536 (OpenAI text-embedding-ada-002)
- **Similarity Search**: Cosine similarity for document matching
- **Chunking Strategy**: 500 token chunks with 50 token overlap
- **Metadata Storage**: Track source, upload date, user

### 5. Architecture Simplification
- **Database Service**: Merge 3 services into single postgres-database.ts
- **Migration System**: Use only backend/database/migrations/
- **Provider Factory**: Remove all deprecated methods
- **OAuth Config**: Single configuration file
- **File Structure**: Remove duplicate app/ directory
- **Error Classes**: Use standard Error with codes

## Approach Options

### Template-Chat Integration Approach

**Option A:** URL Parameters (Current - Broken)
- Pros: Simple implementation
- Cons: Limited data size, security issues, doesn't persist

**Option B:** Session-Based Architecture (Selected)
- Pros: Persistent state, secure, unlimited context
- Cons: Requires database changes

**Rationale:** Session-based approach provides proper state management and enables complex agent workflows

### Vector Search Implementation

**Option A:** Disable pgvector migrations (Current)
- Pros: Simpler deployment
- Cons: No semantic search capability

**Option B:** Enable pgvector with OpenAI embeddings (Selected)
- Pros: Full semantic search, industry standard
- Cons: Requires pgvector extension, API costs

**Rationale:** Vector search is essential for intelligent knowledge base functionality

## External Dependencies

### Required Libraries
- **pgvector**: PostgreSQL extension for vector operations
  - Version: 0.5.0+
  - Justification: Industry standard for vector search in PostgreSQL

- **openai**: OpenAI SDK for embeddings
  - Version: ^4.0.0
  - Justification: Already in use, provides embedding API

- **ws**: WebSocket library for real-time events
  - Version: ^8.0.0
  - Justification: Lightweight, well-maintained WebSocket implementation

### Services
- **OpenAI API**: For text embeddings
  - Justification: Already integrated, high-quality embeddings

## Performance Criteria

- Session initialization: < 500ms
- Prompt generation: < 100ms
- Vector search query: < 200ms
- Integration discovery: < 50ms
- WebSocket latency: < 100ms

## Security Considerations

- Session tokens use cryptographically secure random generation
- Agent contexts sanitized before storage
- Integration credentials never exposed to frontend
- Vector embeddings don't contain sensitive data
- WebSocket connections authenticated

## Migration Strategy

1. **Phase 1**: Enable pgvector and run migrations
2. **Phase 2**: Implement session management
3. **Phase 3**: Add template-chat bridge
4. **Phase 4**: Deploy integration events
5. **Phase 5**: Simplify architecture (can run parallel)

## Rollback Plan

- Database migrations are reversible
- Feature flags for new functionality
- Old code paths maintained during transition
- Comprehensive backup before deployment