# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-07-30-knowledge-base-rag-system/spec.md

> Created: 2025-07-30
> Version: 1.0.0

## Endpoints

### Knowledge Service Endpoints

#### POST /api/trpc/knowledge.processDocument

**Purpose:** Process a document to generate embeddings and store in vector database
**Parameters:**
- `documentId` (string, required): UUID of the document to process
- `priority` (number, optional): Processing priority (1-10, default: 5)
- `forceReprocess` (boolean, optional): Force regeneration of embeddings

**Response:**
```json
{
  "success": true,
  "documentId": "uuid",
  "chunksProcessed": 45,
  "embeddingsGenerated": 45,
  "processingTime": 2340,
  "status": "completed"
}
```

**Errors:**
- 404: Document not found
- 403: Unauthorized access to document
- 429: Rate limit exceeded for embedding generation
- 500: Processing failed

#### GET /api/trpc/knowledge.searchVector

**Purpose:** Perform vector similarity search on knowledge base
**Parameters:**
- `query` (string, required): Search query text
- `limit` (number, optional): Maximum results (1-50, default: 10)
- `threshold` (number, optional): Minimum similarity score (0-1, default: 0.7)
- `includeMetadata` (boolean, optional): Include document metadata

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "documentId": "uuid",
      "chunkId": "uuid",
      "title": "Q4 Sales Report",
      "content": "Regional performance shows...",
      "similarity": 0.92,
      "metadata": {
        "page": 5,
        "section": "Regional Analysis"
      }
    }
  ],
  "total": 10,
  "searchTime": 45
}
```

### Chat Service Integration Endpoints

#### POST /api/trpc/chat.searchKnowledge

**Purpose:** Search knowledge base with hybrid search optimized for chat context
**Parameters:**
- `query` (string, required): Search query from chat
- `type` (enum, optional): 'documents' | 'notes' | 'all' (default: 'all')
- `limit` (number, optional): Result limit (1-20, default: 5)
- `includeContent` (boolean, optional): Include full content (default: true)

**Response:**
```json
{
  "success": true,
  "results": {
    "documents": [
      {
        "id": "uuid",
        "name": "Project Plan.pdf",
        "type": "application/pdf",
        "content": "Relevant excerpt...",
        "relevanceScore": 0.89,
        "uploadedAt": "2025-07-01T10:00:00Z"
      }
    ],
    "notes": [
      {
        "id": "uuid",
        "title": "Meeting Notes",
        "content": "Key decisions...",
        "relevanceScore": 0.85,
        "tags": ["project", "planning"],
        "createdAt": "2025-07-15T14:30:00Z"
      }
    ]
  },
  "total": 8,
  "metadata": {
    "timestamp": "2025-07-30T10:00:00Z",
    "query": "project timeline",
    "userId": "uuid"
  }
}
```

### Embedding Management Endpoints

#### POST /api/trpc/knowledge.generateEmbeddings

**Purpose:** Generate embeddings for specific text (admin/testing)
**Parameters:**
- `text` (string, required): Text to embed
- `model` (string, optional): Embedding model (default: 'text-embedding-ada-002')

**Response:**
```json
{
  "success": true,
  "embedding": [0.0234, -0.0156, ...], // 1536 dimensions
  "model": "text-embedding-ada-002",
  "tokens": 156
}
```

#### GET /api/trpc/knowledge.embeddingStatus

**Purpose:** Check embedding generation status for documents
**Parameters:**
- `documentId` (string, optional): Specific document ID
- `status` (enum, optional): Filter by status ('pending', 'processing', 'completed', 'failed')

**Response:**
```json
{
  "success": true,
  "queue": [
    {
      "documentId": "uuid",
      "documentName": "Report.pdf",
      "status": "processing",
      "progress": 67,
      "chunksTotal": 30,
      "chunksProcessed": 20,
      "startedAt": "2025-07-30T10:00:00Z"
    }
  ],
  "summary": {
    "pending": 5,
    "processing": 2,
    "completed": 150,
    "failed": 1
  }
}
```

### Search Analytics Endpoints

#### POST /api/trpc/knowledge.trackSearchInteraction

**Purpose:** Track user interactions with search results for relevance improvement
**Parameters:**
- `searchId` (string, required): Search session ID
- `resultId` (string, required): Clicked result ID
- `action` (enum, required): 'click' | 'view' | 'dismiss'
- `feedback` (number, optional): Rating 1-5

**Response:**
```json
{
  "success": true,
  "message": "Interaction tracked"
}
```

#### GET /api/trpc/knowledge.searchAnalytics

**Purpose:** Get search quality metrics and insights
**Parameters:**
- `timeRange` (enum, optional): 'day' | 'week' | 'month' (default: 'week')
- `metric` (enum, optional): 'relevance' | 'performance' | 'usage'

**Response:**
```json
{
  "success": true,
  "metrics": {
    "averageRelevanceScore": 0.82,
    "clickThroughRate": 0.65,
    "averageSearchTime": 89,
    "topSearchQueries": [
      {"query": "project timeline", "count": 45},
      {"query": "budget report", "count": 32}
    ],
    "searchVolume": {
      "total": 1250,
      "trend": "+15%"
    }
  }
}
```

## Tool Integration

### OpenRouter Tool Definition

The knowledge search capability is exposed as a tool for AI assistants:

```typescript
{
  type: 'function',
  function: {
    name: 'search_knowledge_base',
    description: 'Search user documents and notes for relevant information. Use this when users ask questions about their uploaded files or stored knowledge.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find relevant information'
        },
        type: {
          type: 'string',
          enum: ['documents', 'notes', 'all'],
          description: 'Type of content to search',
          default: 'all'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (1-20)',
          default: 5,
          minimum: 1,
          maximum: 20
        }
      },
      required: ['query']
    }
  }
}
```

### Tool Execution Flow

1. AI detects need for knowledge retrieval
2. Calls `search_knowledge_base` tool with query
3. System performs hybrid search
4. Results formatted with citations
5. AI incorporates results into response

## Rate Limiting

- Embedding generation: 100 requests/hour/user
- Vector search: 1000 requests/hour/user
- Document processing: 10 concurrent/user
- Knowledge tool calls: 500/hour/user

## Caching Strategy

- Query embeddings: 1 hour TTL
- Search results: 15 minute TTL
- Document metadata: 24 hour TTL
- Invalidation on document update

## Error Handling

All endpoints follow standard error response format:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Embedding generation limit exceeded",
    "details": {
      "limit": 100,
      "reset": "2025-07-30T11:00:00Z"
    }
  }
}
```

## Migration Endpoints

### POST /api/trpc/knowledge.migrateEmbeddings

**Purpose:** Migrate existing JSONB embeddings to pgvector format
**Parameters:**
- `batchSize` (number, optional): Documents per batch (default: 100)
- `startFrom` (string, optional): Document ID to start from

**Response:**
```json
{
  "success": true,
  "migrated": 1500,
  "failed": 2,
  "remaining": 500,
  "estimatedTime": 300
}
```