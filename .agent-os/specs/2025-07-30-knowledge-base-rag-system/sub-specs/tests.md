# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-07-30-knowledge-base-rag-system/spec.md

> Created: 2025-07-30
> Version: 1.0.0

## Test Coverage

### Unit Tests

**KnowledgeService**
- `searchKnowledge()` returns results matching query
- `searchKnowledge()` respects user access control
- `searchKnowledge()` handles empty results gracefully
- `processDocumentWithVectors()` generates correct number of chunks
- `processDocumentWithVectors()` handles large documents with batching
- `generateQueryEmbedding()` returns 1536-dimension vector
- `generateQueryEmbedding()` caches repeated queries

**EmbeddingService**
- `generateEmbeddings()` batches requests correctly
- `generateEmbeddings()` handles API rate limits with retry
- `generateEmbeddings()` validates token limits
- `estimateTokens()` accurately counts OpenAI tokens
- `batchProcess()` yields results as async generator

**ChunkingService**
- `chunkDocument()` respects sentence boundaries
- `chunkDocument()` maintains context with overlap
- `chunkDocument()` preserves document metadata
- `chunkDocument()` handles different file formats
- Smart chunking doesn't exceed token limits

**HybridSearchService**
- `vectorSearch()` returns top-K similar results
- `fullTextSearch()` finds keyword matches
- `fuseResults()` correctly weights vector vs text scores
- `rerank()` improves result ordering
- Handles edge cases (empty query, no results)

### Integration Tests

**Document Processing Pipeline**
- Upload document → chunk → embed → store workflow
- Verify embeddings stored in pgvector format
- Check HNSW index is used for search
- Validate chunk metadata preservation
- Test concurrent document processing

**Search Integration**
- End-to-end search from query to results
- Verify hybrid search combines vector and text
- Test search result caching
- Validate user access control in search
- Performance: search completes < 500ms

**Chat Service Integration**
- Chat queries trigger knowledge search
- Tool calling format is correct for OpenRouter
- Results incorporated into AI responses
- Citations properly formatted
- Context window limits respected

### Feature Tests

**Knowledge-Enhanced Chat Workflow**
```typescript
test('User asks question about uploaded document', async () => {
  // Given: User has uploaded Q4 sales report
  await uploadDocument('q4-sales-report.pdf');
  await waitForProcessing();
  
  // When: User asks specific question
  const response = await chat.send('What were our top regions last quarter?');
  
  // Then: AI uses knowledge base
  expect(response).toContain('According to your Q4 Sales Report');
  expect(response).toContain('Northeast region: 35% growth');
  expect(response.citations).toHaveLength(1);
  expect(response.citations[0]).toMatchObject({
    document: 'q4-sales-report.pdf',
    page: 5
  });
});
```

**Multi-Document Search**
```typescript
test('Search across multiple documents', async () => {
  // Given: Multiple related documents
  await uploadDocuments(['project-proposal.pdf', 'project-update.docx']);
  
  // When: Complex query requiring synthesis
  const results = await knowledge.search('project timeline vs original plan');
  
  // Then: Results from multiple sources
  expect(results.documents).toHaveLength(2);
  expect(results.documents[0].relevanceScore).toBeGreaterThan(0.8);
});
```

**Performance Under Load**
```typescript
test('Concurrent searches maintain performance', async () => {
  // Given: 100K documents indexed
  await seedLargeKnowledgeBase();
  
  // When: 50 concurrent searches
  const searches = Array(50).fill(null).map(() => 
    knowledge.search('random query ' + Math.random())
  );
  
  const start = Date.now();
  await Promise.all(searches);
  const duration = Date.now() - start;
  
  // Then: All complete within SLA
  expect(duration).toBeLessThan(5000); // 5 seconds for all
});
```

### Mocking Requirements

**OpenAI API Mocking**
- Mock embedding generation responses
- Simulate rate limiting (429 responses)
- Variable response times (50-200ms)
- Token counting validation

**Database Mocking**
- Mock pgvector operations for unit tests
- Simulate vector similarity calculations
- Mock HNSW index behavior
- Transaction rollback scenarios

**S3 Mocking**
- Mock document retrieval
- Simulate network delays
- Handle large file scenarios
- Error cases (403, 404)

### E2E Test Scenarios

**Complete RAG Workflow**
1. User uploads PDF document
2. System chunks and generates embeddings
3. User asks question in chat
4. AI searches knowledge base
5. User receives answer with citations
6. User provides feedback on relevance

**Migration Testing**
1. System with existing JSONB embeddings
2. Run migration to pgvector
3. Verify all embeddings converted
4. Test search works on migrated data
5. Rollback and verify restoration

### Performance Benchmarks

**Target Metrics**
- Embedding generation: < 2s for 1000 tokens
- Vector search: < 50ms for 100K documents
- Hybrid search: < 100ms end-to-end
- Document processing: < 30s for 10MB PDF
- Concurrent users: 100+ simultaneous searches

### Error Scenario Testing

**API Failures**
- OpenAI API timeout during embedding
- Rate limit exceeded scenarios
- Invalid API key handling
- Network interruption recovery

**Data Integrity**
- Partial embedding generation failure
- Database transaction failures
- Concurrent document updates
- Index corruption recovery

### Security Testing

**Access Control**
- User can only search own documents
- Cross-user search prevention
- Admin access validation
- Token-based auth in searches

**Input Validation**
- SQL injection in search queries
- XSS in document content
- File type validation
- Size limit enforcement

### Monitoring & Metrics Tests

**Metric Collection**
- Search latency tracking
- Relevance score distribution
- Cache hit rate calculation
- Error rate monitoring

**Analytics Accuracy**
- Click-through rate calculation
- Top queries aggregation
- User satisfaction scoring
- Performance trend analysis

## Test Data Requirements

### Sample Documents
- Technical documentation (PDF, 50 pages)
- Meeting notes (DOCX, 10 pages)
- Code documentation (Markdown, 100 files)
- Financial reports (PDF with tables)
- Mixed language documents

### Query Test Set
- Single keyword queries
- Natural language questions
- Technical jargon searches
- Multi-intent queries
- Negative test cases (no results expected)

### Expected Coverage

- Unit test coverage: 95%+
- Integration test coverage: 90%+
- E2E critical paths: 100%
- Performance benchmarks: All passing
- Security scenarios: All validated