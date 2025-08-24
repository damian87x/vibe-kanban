# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-07-30-knowledge-base-rag-system/spec.md

> Created: 2025-07-30
> Version: 1.0.0

## Schema Changes

### 1. Enable pgvector Extension

```sql
-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 2. Modify knowledge_chunks Table

```sql
-- Add vector column to existing knowledge_chunks table
ALTER TABLE knowledge_chunks 
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(50) DEFAULT 'text-embedding-ada-002',
ADD COLUMN IF NOT EXISTS embedding_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding_hnsw 
ON knowledge_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create index for hybrid search optimization
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document_embedding 
ON knowledge_chunks(document_id, chunk_index) 
WHERE embedding IS NOT NULL;
```

### 3. Add Knowledge Search Metadata Table

```sql
-- Table to store search quality metrics and user interactions
CREATE TABLE IF NOT EXISTS knowledge_search_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL REFERENCES knowledge_search_history(id),
  result_document_id UUID REFERENCES knowledge_documents(id),
  result_chunk_id UUID REFERENCES knowledge_chunks(id),
  
  -- Scoring metrics
  vector_score FLOAT NOT NULL,
  text_score FLOAT,
  combined_score FLOAT NOT NULL,
  rank_position INTEGER NOT NULL,
  
  -- User interaction
  was_clicked BOOLEAN DEFAULT FALSE,
  click_timestamp TIMESTAMP,
  feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_metrics_search_id 
ON knowledge_search_metrics(search_id);

CREATE INDEX IF NOT EXISTS idx_search_metrics_feedback 
ON knowledge_search_metrics(feedback_rating) 
WHERE feedback_rating IS NOT NULL;
```

### 4. Create Embedding Queue Table

```sql
-- Queue for managing embedding generation
CREATE TABLE IF NOT EXISTS embedding_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id),
  chunk_id UUID REFERENCES knowledge_chunks(id),
  
  -- Queue management
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Processing metadata
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  processing_time_ms INTEGER,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_embedding_queue_status_priority 
ON embedding_generation_queue(status, priority DESC) 
WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_embedding_queue_document 
ON embedding_generation_queue(document_id);
```

### 5. Migrate Existing JSONB Embeddings

```sql
-- Function to migrate JSONB embeddings to vector type
CREATE OR REPLACE FUNCTION migrate_jsonb_to_vector()
RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER := 0;
  chunk_record RECORD;
  embedding_array FLOAT4[];
BEGIN
  FOR chunk_record IN 
    SELECT id, embedding_data::text 
    FROM knowledge_chunks 
    WHERE embedding_data IS NOT NULL 
    AND embedding IS NULL
  LOOP
    BEGIN
      -- Convert JSONB array to FLOAT4 array
      embedding_array := ARRAY(
        SELECT (value::text)::float4 
        FROM jsonb_array_elements(chunk_record.embedding_data::jsonb)
      );
      
      -- Update the record with vector type
      UPDATE knowledge_chunks 
      SET embedding = embedding_array::vector(1536),
          embedding_created_at = CURRENT_TIMESTAMP
      WHERE id = chunk_record.id;
      
      migrated_count := migrated_count + 1;
      
      -- Log progress every 100 records
      IF migrated_count % 100 = 0 THEN
        RAISE NOTICE 'Migrated % embeddings', migrated_count;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to migrate embedding for chunk %: %', chunk_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Execute migration
SELECT migrate_jsonb_to_vector();

-- After successful migration, the embedding_data column can be dropped
-- ALTER TABLE knowledge_chunks DROP COLUMN embedding_data;
```

### 6. Optimize Full-Text Search

```sql
-- Add custom text search configuration for better results
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS english_stem (COPY = english);

-- Update search vector generation for better relevance
ALTER TABLE knowledge_chunks 
DROP COLUMN IF EXISTS search_vector;

ALTER TABLE knowledge_chunks 
ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english_stem', 
    COALESCE(
      (SELECT title FROM knowledge_documents WHERE id = document_id), 
      ''
    )
  ), 'A') ||
  setweight(to_tsvector('english_stem', COALESCE(content, '')), 'B')
) STORED;

-- Create GIN index for full-text search
DROP INDEX IF EXISTS idx_knowledge_chunks_search_vector;
CREATE INDEX idx_knowledge_chunks_search_vector_gin 
ON knowledge_chunks 
USING GIN(search_vector);
```

### 7. Create Hybrid Search Function

```sql
-- Function for hybrid search combining vector and full-text
CREATE OR REPLACE FUNCTION hybrid_search_knowledge(
  query_embedding vector(1536),
  query_text TEXT,
  user_id_param UUID,
  search_limit INTEGER DEFAULT 20,
  vector_weight FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  document_title VARCHAR(255),
  chunk_content TEXT,
  chunk_index INTEGER,
  vector_similarity FLOAT,
  text_rank FLOAT,
  combined_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH vector_search AS (
    SELECT 
      c.id as chunk_id,
      c.document_id,
      1 - (c.embedding <=> query_embedding) as similarity
    FROM knowledge_chunks c
    JOIN knowledge_documents d ON c.document_id = d.id
    WHERE d.user_id = user_id_param
    AND c.embedding IS NOT NULL
    ORDER BY c.embedding <=> query_embedding
    LIMIT search_limit * 2  -- Get more candidates for fusion
  ),
  text_search AS (
    SELECT 
      c.id as chunk_id,
      c.document_id,
      ts_rank(c.search_vector, plainto_tsquery('english_stem', query_text)) as rank
    FROM knowledge_chunks c
    JOIN knowledge_documents d ON c.document_id = d.id
    WHERE d.user_id = user_id_param
    AND c.search_vector @@ plainto_tsquery('english_stem', query_text)
    ORDER BY rank DESC
    LIMIT search_limit * 2
  ),
  combined AS (
    SELECT 
      COALESCE(v.chunk_id, t.chunk_id) as chunk_id,
      COALESCE(v.document_id, t.document_id) as document_id,
      COALESCE(v.similarity, 0) as vector_similarity,
      COALESCE(t.rank, 0) as text_rank,
      (COALESCE(v.similarity, 0) * vector_weight + 
       COALESCE(t.rank, 0) * (1 - vector_weight)) as combined_score
    FROM vector_search v
    FULL OUTER JOIN text_search t ON v.chunk_id = t.chunk_id
  )
  SELECT 
    c.chunk_id,
    c.document_id,
    d.title as document_title,
    ch.content as chunk_content,
    ch.chunk_index,
    c.vector_similarity,
    c.text_rank,
    c.combined_score
  FROM combined c
  JOIN knowledge_chunks ch ON c.chunk_id = ch.id
  JOIN knowledge_documents d ON c.document_id = d.id
  ORDER BY c.combined_score DESC
  LIMIT search_limit;
END;
$$ LANGUAGE plpgsql;
```

### 8. Performance Optimization Settings

```sql
-- Configure pgvector for optimal performance
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
ALTER SYSTEM SET max_parallel_workers = 8;
ALTER SYSTEM SET effective_cache_size = '4GB';
ALTER SYSTEM SET shared_buffers = '1GB';

-- Configure HNSW index parameters
ALTER INDEX idx_knowledge_chunks_embedding_hnsw SET (ef = 40);

-- Update table statistics for query planner
ANALYZE knowledge_chunks;
ANALYZE knowledge_documents;
```

## Rollback Plan

```sql
-- Rollback script if needed
-- ALTER TABLE knowledge_chunks DROP COLUMN IF EXISTS embedding;
-- ALTER TABLE knowledge_chunks DROP COLUMN IF EXISTS embedding_model;
-- ALTER TABLE knowledge_chunks DROP COLUMN IF EXISTS embedding_created_at;
-- DROP TABLE IF EXISTS knowledge_search_metrics;
-- DROP TABLE IF EXISTS embedding_generation_queue;
-- DROP FUNCTION IF EXISTS hybrid_search_knowledge;
-- DROP FUNCTION IF EXISTS migrate_jsonb_to_vector;
-- DROP EXTENSION IF EXISTS vector;
```

## Migration Notes

1. **pgvector Installation**: Requires PostgreSQL 11+ and may need server restart
2. **Index Building**: HNSW index creation can take 5-10 minutes for 100K+ vectors
3. **Migration Time**: JSONB to vector migration processes ~1000 records/second
4. **Disk Space**: Vector index requires ~1.5x the size of vector data
5. **Memory Usage**: HNSW index loads into memory for performance

## Performance Benchmarks

Expected performance with proper indexing:
- Vector similarity search: < 50ms for 1M vectors
- Hybrid search: < 100ms combining vector and text
- Embedding migration: ~1 hour for 1M chunks
- Index build time: ~10 minutes for 500K vectors