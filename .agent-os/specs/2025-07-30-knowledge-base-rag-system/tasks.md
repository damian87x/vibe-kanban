# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-07-30-knowledge-base-rag-system/spec.md

> Created: 2025-07-30
> Status: Ready for Implementation

## Tasks

- [ ] 1. Enable pgvector Extension and Database Migration
  - [ ] 1.1 Write tests for pgvector installation verification
  - [ ] 1.2 Create migration script to enable pgvector extension
  - [ ] 1.3 Add vector column to knowledge_chunks table
  - [ ] 1.4 Create HNSW index for vector similarity search
  - [ ] 1.5 Implement JSONB to vector migration function
  - [ ] 1.6 Create rollback migration script
  - [ ] 1.7 Verify all tests pass

- [ ] 2. Implement Knowledge Service Enhancements
  - [ ] 2.1 Write tests for KnowledgeService singleton and searchKnowledge method
  - [ ] 2.2 Create knowledge service singleton export
  - [ ] 2.3 Implement searchKnowledge method with hybrid search
  - [ ] 2.4 Add generateQueryEmbedding method
  - [ ] 2.5 Implement processDocumentWithVectors method
  - [ ] 2.6 Add caching layer for embeddings
  - [ ] 2.7 Verify all tests pass

- [ ] 3. Build Embedding Service and Pipeline
  - [ ] 3.1 Write tests for EmbeddingService class
  - [ ] 3.2 Implement OpenAI embedding generation with batching
  - [ ] 3.3 Add rate limiting and retry logic
  - [ ] 3.4 Create token estimation utilities
  - [ ] 3.5 Implement async generator for batch processing
  - [ ] 3.6 Add embedding queue management
  - [ ] 3.7 Verify all tests pass

- [ ] 4. Implement Document Chunking Strategy
  - [ ] 4.1 Write tests for smart chunking with context preservation
  - [ ] 4.2 Implement recursive text splitter with sentence boundaries
  - [ ] 4.3 Add context preservation (title + section headers)
  - [ ] 4.4 Create chunking strategies for different file types
  - [ ] 4.5 Implement chunk overlap logic
  - [ ] 4.6 Add metadata extraction for chunks
  - [ ] 4.7 Verify all tests pass

- [ ] 5. Create Chat Service Integration
  - [ ] 5.1 Write tests for knowledge tool integration
  - [ ] 5.2 Define OpenRouter tool schema for knowledge search
  - [ ] 5.3 Implement tool execution handler in chat service
  - [ ] 5.4 Add knowledge context formatting for AI
  - [ ] 5.5 Implement citation tracking in responses
  - [ ] 5.6 Add tool to available tools list
  - [ ] 5.7 Create E2E tests for chat with knowledge
  - [ ] 5.8 Verify all tests pass