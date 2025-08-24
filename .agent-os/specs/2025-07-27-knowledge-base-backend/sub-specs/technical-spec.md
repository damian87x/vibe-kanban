# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-07-27-knowledge-base-backend/spec.md

> Created: 2025-07-27
> Version: 1.0.0

## Technical Requirements

- PostgreSQL database tables for documents metadata and categories
- pgvector extension for vector similarity search
- AWS S3 integration for file storage with presigned URLs
- Document processing pipeline for text extraction and embedding generation
- Integration with existing chat system for knowledge-augmented responses
- Support for multiple file types (PDF, DOCX, TXT, MD)
- Full-text search combined with semantic search
- Efficient caching strategy for frequently accessed documents

## Approach Options

**Option A:** Separate Vector Database (Pinecone/Weaviate)
- Pros: Purpose-built for vector search, better performance at scale
- Cons: Additional infrastructure, increased complexity, higher cost

**Option B:** PostgreSQL with pgvector extension (Selected)
- Pros: Single database, simpler architecture, good performance for our scale, already in tech stack
- Cons: Less optimized than dedicated vector DBs for very large scale

**Rationale:** We're choosing PostgreSQL with pgvector because it provides sufficient performance for our expected scale (thousands of documents per user), maintains architectural simplicity, and leverages our existing database infrastructure.

## External Dependencies

- **pgvector** - PostgreSQL extension for vector similarity search
- **Justification:** Native PostgreSQL integration for vector operations without external services

- **@aws-sdk/client-s3** - AWS S3 client (already in package.json)
- **Justification:** Already integrated for file storage needs

- **pdf-parse** - PDF text extraction
- **Justification:** Extract text content from PDF documents for indexing

- **mammoth** - DOCX text extraction  
- **Justification:** Extract text from Word documents for indexing

- **openai** - Embeddings generation (already in package.json)
- **Justification:** Generate vector embeddings for semantic search

## Architecture Design

### Document Processing Flow
1. User uploads document through UI
2. Backend validates file type and size
3. File uploaded to S3 with unique key
4. Text extraction based on file type
5. Text chunked into searchable segments
6. Embeddings generated for each chunk
7. Metadata and vectors stored in PostgreSQL

### Knowledge Retrieval Flow
1. User asks question in chat
2. System generates embedding for the question
3. Vector similarity search finds relevant document chunks
4. Full-text search adds keyword matches
5. Results ranked by relevance score
6. Top results included in AI prompt context
7. AI generates response with document citations

### Integration Points
- Modify `backend/trpc/routes/chat/send-message.ts` to include knowledge search
- Add new routes in `backend/trpc/routes/knowledge/`
- Extend `backend/services/ai-chat-service.ts` with knowledge context
- Create new `backend/services/knowledge-service.ts` for document operations

## Performance Considerations

- Chunk size: 1000 tokens (optimal for context and search accuracy)
- Embedding model: text-embedding-ada-002 (cost-effective and accurate)
- Index on vector column for fast similarity search
- Implement pagination for large result sets
- Cache frequently accessed embeddings
- Background processing for large documents

## Security Considerations

- S3 bucket with proper IAM policies
- Presigned URLs with 1-hour expiration
- Document access validated against user permissions
- Sanitize file names and content
- Virus scanning for uploaded files (future enhancement)
- Rate limiting on upload endpoints