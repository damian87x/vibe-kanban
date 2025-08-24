# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-07-27-knowledge-base-backend/spec.md

> Created: 2025-07-27
> Version: 1.0.0

## Schema Overview

The knowledge base system requires new tables for storing document metadata, content chunks, embeddings, and categories. We'll also need to enable the pgvector extension for vector operations.

## Database Changes

### Enable pgvector Extension

```sql
-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;
```

### New Tables

#### knowledge_categories
Stores document categories for organization

```sql
CREATE TABLE knowledge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280', -- Hex color for UI
  icon VARCHAR(50) DEFAULT 'folder', -- Icon name for UI
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_category_name_per_user UNIQUE (user_id, name)
);

CREATE INDEX idx_knowledge_categories_user_id ON knowledge_categories(user_id);
```

#### knowledge_documents
Stores document metadata and S3 references

```sql
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- pdf, docx, txt, md
  file_size_bytes BIGINT NOT NULL,
  s3_key VARCHAR(500) NOT NULL, -- S3 object key
  s3_bucket VARCHAR(100) NOT NULL,
  
  -- Metadata
  total_chunks INTEGER DEFAULT 0,
  processing_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  processing_error TEXT,
  
  -- Sharing
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with_team UUID REFERENCES teams(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP,
  
  -- Search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B')
  ) STORED
);

CREATE INDEX idx_knowledge_documents_user_id ON knowledge_documents(user_id);
CREATE INDEX idx_knowledge_documents_category_id ON knowledge_documents(category_id);
CREATE INDEX idx_knowledge_documents_search_vector ON knowledge_documents USING GIN(search_vector);
CREATE INDEX idx_knowledge_documents_processing_status ON knowledge_documents(processing_status);
```

#### knowledge_chunks
Stores document content chunks with embeddings

```sql
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL, -- Order within document
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 embedding dimension
  
  -- Metadata for better search
  start_page INTEGER, -- For PDFs
  end_page INTEGER,
  chunk_type VARCHAR(50) DEFAULT 'text', -- text, title, list, table
  
  -- Search optimization
  token_count INTEGER NOT NULL,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', content)
  ) STORED,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_chunk_per_document UNIQUE (document_id, chunk_index)
);

CREATE INDEX idx_knowledge_chunks_document_id ON knowledge_chunks(document_id);
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_knowledge_chunks_search_vector ON knowledge_chunks USING GIN(search_vector);
```

#### knowledge_search_history
Tracks searches for analytics and improvement

```sql
CREATE TABLE knowledge_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  query_embedding vector(1536),
  results_count INTEGER DEFAULT 0,
  clicked_document_id UUID REFERENCES knowledge_documents(id) ON DELETE SET NULL,
  search_type VARCHAR(20) DEFAULT 'hybrid', -- vector, fulltext, hybrid
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_knowledge_search_history_user_id ON knowledge_search_history(user_id);
CREATE INDEX idx_knowledge_search_history_created_at ON knowledge_search_history(created_at);
```

### Modifications to Existing Tables

#### Add to conversations table
```sql
-- Add column to track if knowledge base was used
ALTER TABLE conversations 
ADD COLUMN used_knowledge_base BOOLEAN DEFAULT FALSE,
ADD COLUMN knowledge_document_ids UUID[] DEFAULT '{}';
```

## Migration Strategy

1. Create migration file: `migrations/004_knowledge_base.sql`
2. Run migrations in transaction
3. Create initial categories for existing users
4. Set up S3 bucket with proper permissions
5. Configure pgvector indexes for optimal performance

## Indexes and Performance

- IVFFlat index on embeddings for approximate nearest neighbor search
- GIN indexes on tsvector columns for full-text search
- B-tree indexes on foreign keys and frequently queried columns
- Partial index on processing_status for pending documents

## Data Integrity Rules

- Documents must belong to a user
- Chunks must belong to a document
- Chunk indexes must be unique per document
- Categories must have unique names per user
- S3 keys must be unique
- Embeddings must be 1536-dimensional vectors