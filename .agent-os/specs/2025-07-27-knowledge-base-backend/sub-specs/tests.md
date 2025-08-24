# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-07-27-knowledge-base-backend/spec.md

> Created: 2025-07-27
> Version: 1.0.0

## Test Coverage

### Unit Tests

**KnowledgeService**
- Document validation (file type, size limits)
- S3 key generation uniqueness
- Text extraction for different file types
- Document chunking algorithm
- Embedding generation error handling
- Search query validation

**CategoryService**
- Category name uniqueness per user
- Category deletion doesn't delete documents
- Default category assignment

**SearchService**
- Vector similarity search accuracy
- Full-text search with stemming
- Hybrid search result merging
- Result ranking algorithm
- Search history tracking

### Integration Tests

**Document Upload Flow**
- Get presigned URL → Upload to S3 → Confirm upload
- Document processing pipeline end-to-end
- Error handling for failed uploads
- Cleanup of orphaned S3 objects

**Knowledge-Enhanced Chat**
- Chat queries trigger knowledge search
- Relevant context included in AI prompts
- Document citations in responses
- Performance with large knowledge bases

**Search Functionality**
- Vector search returns semantically similar content
- Full-text search handles typos and variations
- Category filtering works correctly
- Pagination maintains result consistency

### E2E Tests

**Complete Document Lifecycle**
```typescript
test('User can upload and search documents', async ({ page }) => {
  // 1. Navigate to Knowledge Base
  // 2. Create a category
  // 3. Upload a PDF document
  // 4. Wait for processing completion
  // 5. Search for content from the document
  // 6. Verify search results
  // 7. Ask AI chat about document content
  // 8. Verify AI references the document
});
```

**Team Knowledge Sharing**
```typescript
test('Team members can access shared documents', async ({ page }) => {
  // 1. User A uploads document and marks as shared
  // 2. User B searches and finds shared document
  // 3. AI chat for User B can reference shared document
});
```

**Error Scenarios**
```typescript
test('Handles invalid file uploads gracefully', async ({ page }) => {
  // 1. Attempt to upload oversized file
  // 2. Verify error message
  // 3. Attempt to upload unsupported file type
  // 4. Verify error message
});
```

### Performance Tests

**Search Performance**
- Search response time < 500ms for 10k documents
- Concurrent search handling (10 simultaneous queries)
- Memory usage remains stable during bulk operations

**Upload Performance**
- Presigned URL generation < 100ms
- Document processing scales with file size
- Concurrent upload handling

### Mocking Requirements

**AWS S3:**
- Mock S3 client for unit tests
- Use localstack for integration tests
- Mock presigned URL generation
- Simulate upload failures

**OpenAI API:**
- Mock embedding generation
- Return consistent embeddings for tests
- Simulate API rate limits
- Mock different embedding models

**Database:**
- Use test database for integration tests
- Mock pgvector operations for unit tests
- Seed test data for search tests

### Test Data

**Sample Documents:**
- Small text file (< 1KB)
- Medium PDF (1-5MB)
- Large DOCX (5-10MB)
- Document with special characters
- Multi-language document

**Expected Search Queries:**
- Exact phrase matches
- Semantic similarity queries
- Typos and misspellings
- Multi-word searches
- Questions for AI context

### Test Utilities

Create test helpers in `__tests__/utils/knowledge-test-utils.ts`:
```typescript
export async function uploadTestDocument(fileName: string, content: string);
export async function waitForProcessing(documentId: string);
export async function createTestCategory(name: string);
export async function generateTestEmbedding(text: string);
```

### Coverage Requirements

- Unit test coverage: > 80%
- Integration test coverage: > 70%
- E2E coverage of all user flows
- Performance benchmarks established
- Error scenarios fully tested