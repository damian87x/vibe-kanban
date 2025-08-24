# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-07-30-knowledge-base-rag-system/spec.md

> Created: 2025-07-30
> Version: 1.0.0

## Technical Requirements

### Core Architecture Components

1. **Vector Database Layer**
   - PostgreSQL 17 with pgvector extension v0.8.0+
   - Vector dimension: 1536 (OpenAI ada-002)
   - Index type: HNSW (Hierarchical Navigable Small World)
   - Distance metric: Cosine similarity
   - Hybrid search combining vector and full-text

2. **Embedding Pipeline**
   - Model: OpenAI text-embedding-ada-002 ($0.10 per 1M tokens)
   - Chunking: 1000 tokens with 200 token overlap
   - Batch size: 100 documents per API call
   - Rate limiting: 3000 requests/minute
   - Retry strategy: Exponential backoff

3. **Document Processing**
   - Smart chunking with sentence boundaries
   - Context preservation (document title + section headers)
   - Metadata extraction (page numbers, sections, dates)
   - Support for PDF, DOCX, TXT, MD formats
   - Maximum file size: 50MB

4. **Search & Retrieval**
   - Hybrid search: 70% vector similarity + 30% BM25 full-text
   - Top-K retrieval: 20 initial candidates
   - Re-ranking with cross-encoder (optional)
   - Query enhancement with hypothetical answers
   - Result caching with 15-minute TTL

5. **Tool Integration**
   - OpenRouter tool schema for knowledge_search
   - Streaming response support
   - Context window management (8K tokens max)
   - Citation tracking and source attribution

### Performance Requirements

- Search latency: < 500ms for vector search
- Embedding generation: < 2s for 1000 tokens
- Concurrent users: Support 100+ simultaneous searches
- Index build time: < 10 minutes for 100K documents
- Memory usage: < 2GB for vector index

## Approach Options

### Option A: Full LlamaIndex Integration
- Pros: 
  - Comprehensive RAG framework
  - Built-in document loaders
  - Advanced retrieval strategies
  - Active community support
- Cons: 
  - Additional dependency complexity
  - Learning curve for team
  - Potential over-engineering

### Option B: Custom Lightweight Implementation (Selected)
- Pros: 
  - Full control over implementation
  - Minimal dependencies
  - Easier debugging and optimization
  - Better integration with existing code
- Cons: 
  - More development time
  - Need to implement chunking strategies
  - Manual optimization required

**Rationale:** Selected Option B because we have a clear use case, existing infrastructure, and need tight integration with our current knowledge service. The custom implementation will be more maintainable and aligned with our codebase patterns.

## Implementation Architecture

### 1. Knowledge Service Enhancement
```typescript
// Singleton pattern with enhanced capabilities
export class KnowledgeService {
  private vectorStore: PgVectorStore;
  private embeddingService: EmbeddingService;
  private chunkingService: ChunkingService;
  private searchService: HybridSearchService;
  
  // New methods
  async searchKnowledge(query: string, options: SearchOptions): Promise<SearchResult>
  async processDocumentWithVectors(documentId: string): Promise<void>
  async generateQueryEmbedding(query: string): Promise<Float32Array>
}

export const knowledgeService = new KnowledgeService(config);
```

### 2. Embedding Service Architecture
```typescript
interface EmbeddingService {
  generateEmbeddings(texts: string[]): Promise<Float32Array[]>
  generateSingleEmbedding(text: string): Promise<Float32Array>
  estimateTokens(text: string): number
  batchProcess(texts: string[], batchSize: number): AsyncGenerator<Float32Array[]>
}
```

### 3. Chunking Strategy
```typescript
interface ChunkingOptions {
  chunkSize: 1000,
  chunkOverlap: 200,
  splitMethod: 'recursive' | 'sentence' | 'semantic',
  preserveContext: boolean,
  includeMetadata: boolean
}
```

### 4. Hybrid Search Implementation
```typescript
interface HybridSearchService {
  vectorSearch(embedding: Float32Array, limit: number): Promise<VectorResult[]>
  fullTextSearch(query: string, limit: number): Promise<TextResult[]>
  fuseResults(vectorResults: VectorResult[], textResults: TextResult[]): SearchResult[]
  rerank(results: SearchResult[], query: string): Promise<SearchResult[]>
}
```

## External Dependencies

- **pgvector** v0.8.0 - PostgreSQL extension for vector operations
  - **Justification:** Native PostgreSQL integration, no additional infrastructure, proven performance at scale

- **openai** v4.x - OpenAI SDK for embeddings
  - **Justification:** Already in use, best-in-class embeddings, cost-effective for our scale

- **gpt-3-encoder** - Token counting for OpenAI models
  - **Justification:** Accurate token estimation for chunking, prevents API errors

- **pdf-parse** - PDF text extraction
  - **Justification:** Already implemented, reliable extraction

- **mammoth** - DOCX text extraction  
  - **Justification:** Already implemented, maintains formatting

## Integration Points

### 1. Chat Service Integration
```typescript
// In chat-service.ts
private async getKnowledgeContext(query: string, userId: string): Promise<KnowledgeContext> {
  const searchResult = await knowledgeService.searchKnowledge({
    query,
    userId,
    type: 'all',
    limit: 5,
    includeEmbeddings: false
  });
  
  return this.formatKnowledgeContext(searchResult);
}
```

### 2. Tool Definition
```typescript
const knowledgeSearchTool = {
  type: 'function',
  function: {
    name: 'search_knowledge_base',
    description: 'Search user documents and notes for relevant information',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find relevant documents or notes'
        },
        type: {
          type: 'string',
          enum: ['documents', 'notes', 'all'],
          description: 'Type of content to search',
          default: 'all'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 5,
          minimum: 1,
          maximum: 20
        }
      },
      required: ['query']
    }
  }
};
```

## Security Considerations

1. **Access Control**: Row-level security ensuring users only search their own documents
2. **Input Sanitization**: Query validation to prevent injection attacks
3. **Rate Limiting**: Per-user limits on embedding generation and searches
4. **Data Privacy**: Embeddings stored encrypted at rest
5. **Audit Logging**: Track all knowledge base searches for compliance

## Monitoring & Observability

1. **Metrics to Track**:
   - Search latency (p50, p95, p99)
   - Embedding generation time
   - Cache hit rate
   - Result relevance scores
   - User satisfaction (click-through rate)

2. **Logging Strategy**:
   ```typescript
   logger.info('Knowledge search performed', {
     userId,
     query,
     resultCount,
     searchLatency,
     cacheHit,
     vectorScore,
     textScore
   });
   ```

## Migration Strategy

1. **Phase 1**: Enable pgvector extension (Day 1)
2. **Phase 2**: Implement embedding pipeline (Days 2-3)
3. **Phase 3**: Migrate existing documents (Days 4-5)
4. **Phase 4**: Enable hybrid search (Days 6-7)
5. **Phase 5**: Integrate with chat service (Days 8-9)
6. **Phase 6**: Testing and optimization (Days 10-14)