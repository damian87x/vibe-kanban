# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-07-27-knowledge-base-backend/spec.md

> Created: 2025-07-27
> Version: 1.0.0

## API Overview

All endpoints will be implemented as tRPC routes under the `knowledge` namespace. The API provides CRUD operations for documents and categories, search functionality, and integration with the chat system.

## Endpoints

### Category Management

#### GET /api/trpc/knowledge.categories.list
**Purpose:** List all categories for the authenticated user
**Parameters:** None
**Response:** Array of category objects
**Errors:** 401 Unauthorized

#### POST /api/trpc/knowledge.categories.create
**Purpose:** Create a new category
**Parameters:** 
```typescript
{
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}
```
**Response:** Created category object
**Errors:** 400 Bad Request (duplicate name), 401 Unauthorized

#### PUT /api/trpc/knowledge.categories.update
**Purpose:** Update an existing category
**Parameters:**
```typescript
{
  id: string;
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}
```
**Response:** Updated category object
**Errors:** 404 Not Found, 401 Unauthorized, 403 Forbidden

#### DELETE /api/trpc/knowledge.categories.delete
**Purpose:** Delete a category (documents remain uncategorized)
**Parameters:** `{ id: string }`
**Response:** `{ success: boolean }`
**Errors:** 404 Not Found, 401 Unauthorized, 403 Forbidden

### Document Management

#### GET /api/trpc/knowledge.documents.list
**Purpose:** List documents with pagination and filtering
**Parameters:**
```typescript
{
  categoryId?: string;
  search?: string;
  limit?: number; // default: 20
  offset?: number; // default: 0
  sortBy?: 'created' | 'updated' | 'title'; // default: 'updated'
  sortOrder?: 'asc' | 'desc'; // default: 'desc'
}
```
**Response:** 
```typescript
{
  documents: Document[];
  total: number;
  hasMore: boolean;
}
```
**Errors:** 401 Unauthorized

#### POST /api/trpc/knowledge.documents.getUploadUrl
**Purpose:** Get a presigned URL for document upload
**Parameters:**
```typescript
{
  fileName: string;
  fileType: string;
  fileSize: number;
  categoryId?: string;
}
```
**Response:**
```typescript
{
  uploadUrl: string;
  documentId: string;
  s3Key: string;
  expiresAt: string;
}
```
**Errors:** 400 Bad Request (invalid file type/size), 401 Unauthorized

#### POST /api/trpc/knowledge.documents.confirmUpload
**Purpose:** Confirm successful upload and trigger processing
**Parameters:**
```typescript
{
  documentId: string;
  title: string;
  description?: string;
}
```
**Response:** Document object with processing status
**Errors:** 404 Not Found, 401 Unauthorized

#### GET /api/trpc/knowledge.documents.get
**Purpose:** Get document details with download URL
**Parameters:** `{ id: string }`
**Response:** Document object with presigned download URL
**Errors:** 404 Not Found, 401 Unauthorized, 403 Forbidden

#### DELETE /api/trpc/knowledge.documents.delete
**Purpose:** Delete a document and its chunks
**Parameters:** `{ id: string }`
**Response:** `{ success: boolean }`
**Errors:** 404 Not Found, 401 Unauthorized, 403 Forbidden

### Search Operations

#### POST /api/trpc/knowledge.search.query
**Purpose:** Search documents using hybrid search (vector + full-text)
**Parameters:**
```typescript
{
  query: string;
  limit?: number; // default: 10
  categoryIds?: string[];
  searchType?: 'vector' | 'fulltext' | 'hybrid'; // default: 'hybrid'
}
```
**Response:**
```typescript
{
  results: Array<{
    documentId: string;
    documentTitle: string;
    chunkId: string;
    content: string;
    score: number;
    highlightedContent?: string;
    page?: number;
  }>;
  totalResults: number;
}
```
**Errors:** 400 Bad Request (empty query), 401 Unauthorized

### Chat Integration

#### POST /api/trpc/knowledge.chat.searchContext
**Purpose:** Internal endpoint for chat to get relevant knowledge context
**Parameters:**
```typescript
{
  query: string;
  conversationId: string;
  limit?: number; // default: 5
}
```
**Response:**
```typescript
{
  contexts: Array<{
    documentId: string;
    documentTitle: string;
    content: string;
    relevanceScore: number;
  }>;
  documentIds: string[]; // For tracking
}
```
**Errors:** 401 Unauthorized

### Processing Status

#### GET /api/trpc/knowledge.documents.processingStatus
**Purpose:** Check processing status of documents
**Parameters:** `{ documentIds: string[] }`
**Response:**
```typescript
{
  statuses: Record<string, {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    error?: string;
    chunksProcessed?: number;
    totalChunks?: number;
  }>;
}
```
**Errors:** 401 Unauthorized

## Controllers

### KnowledgeController
Main controller handling document and category operations

**Actions:**
- `validateFileUpload()` - Validate file type and size
- `generateS3Key()` - Generate unique S3 key for document
- `processDocument()` - Queue document for processing
- `extractText()` - Extract text based on file type
- `chunkDocument()` - Split document into searchable chunks
- `generateEmbeddings()` - Create vector embeddings for chunks
- `hybridSearch()` - Combine vector and full-text search

### KnowledgeChatController
Integration controller for chat system

**Actions:**
- `augmentPromptWithKnowledge()` - Add relevant knowledge to chat prompt
- `trackKnowledgeUsage()` - Record which documents were used
- `formatCitations()` - Format document references in responses

## Error Handling

All endpoints return standard error responses:
```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

Common error codes:
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User lacks permission
- `NOT_FOUND` - Resource doesn't exist
- `BAD_REQUEST` - Invalid input
- `FILE_TOO_LARGE` - File exceeds size limit
- `INVALID_FILE_TYPE` - Unsupported file type
- `PROCESSING_FAILED` - Document processing error