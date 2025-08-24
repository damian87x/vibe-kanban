# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-17-fix-integration-gaps/spec.md

> Created: 2025-08-17
> Version: 2.0.0
> Updated: Using Prisma ORM

## Prisma Schema Changes

### New Models

#### AgentSession Model
```prisma
model AgentSession {
  id            String   @id @default(cuid())
  userId        String
  agentId       String
  conversationId String?
  
  // Session state
  status        SessionStatus @default(RUNNING)
  
  // Context and state (JSON fields)
  context       Json      @default("{}")
  checkpoints   Json      @default("[]")
  variables     Json      @default("{}")
  
  // Template reference
  templateId    String?
  templateVersion String?
  
  // Metrics
  messagesCount Int       @default(0)
  toolsUsed     Json      @default("[]")
  errorLogs     Json      @default("[]")
  
  // Timestamps
  startedAt     DateTime  @default(now())
  lastActiveAt  DateTime  @default(now())
  completedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  agent         Agent     @relation(fields: [agentId], references: [id], onDelete: Cascade)
  conversation  Conversation? @relation(fields: [conversationId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([agentId])
  @@index([status])
  @@index([conversationId])
  @@index([lastActiveAt(sort: Desc)])
}

enum SessionStatus {
  RUNNING
  PAUSED
  COMPLETED
  FAILED
}
```

#### IntegrationEvent Model
```prisma
model IntegrationEvent {
  id             String   @id @default(cuid())
  userId         String
  integrationId  String
  
  // Event details
  eventType      EventType
  eventData      Json     @default("{}")
  
  // Tool tracking
  toolName       String?
  toolParameters Json?
  toolResult     Json?
  
  // Error tracking
  errorMessage   String?
  errorCode      String?
  
  // Timestamps
  occurredAt     DateTime @default(now())
  createdAt      DateTime @default(now())
  
  // Relations
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  integration    IntegrationConnection @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([integrationId])
  @@index([eventType])
  @@index([occurredAt(sort: Desc)])
}

enum EventType {
  CONNECTED
  DISCONNECTED
  TOOL_USED
  ERROR
  REFRESHED
}
```

### Modified Models

#### KnowledgeBase Model (Add Vector Search Support)
```prisma
model KnowledgeBase {
  id                String   @id @default(cuid())
  userId            String
  title             String
  content           String   @db.Text
  contentType       String?
  source            String?
  tags              String[]
  metadata          Json?
  
  // Vector search fields
  embedding         Unsupported("vector(1536)")?  // Requires prisma-field-encryption or raw queries
  chunkIndex        Int      @default(0)
  totalChunks       Int      @default(1)
  parentDocumentId  String?
  processingStatus  ProcessingStatus @default(PENDING)
  
  // S3 storage
  s3Key             String?
  s3Bucket          String?
  fileSize          Int?
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  parentDocument    KnowledgeBase? @relation("DocumentChunks", fields: [parentDocumentId], references: [id], onDelete: Cascade)
  chunks            KnowledgeBase[] @relation("DocumentChunks")
  
  @@index([userId])
  @@index([parentDocumentId])
  @@index([processingStatus])
  @@index([tags])
}

enum ProcessingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

#### Conversation Model (Add Session Tracking)
```prisma
model Conversation {
  id             String   @id @default(cuid())
  userId         String
  title          String?
  
  // Session tracking
  sessionId      String?  @unique
  sessionContext Json     @default("{}")
  
  // Existing fields
  messages       Message[]
  metadata       Json?
  lastMessageAt  DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  // Relations
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  session        AgentSession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([sessionId])
  @@index([lastMessageAt(sort: Desc)])
}
```

## Prisma Migrations

### Creating Migrations
```bash
# Generate migration for new models
npx prisma migrate dev --name add_agent_sessions

# Generate migration for vector search
npx prisma migrate dev --name add_vector_search_support

# Generate migration for integration events
npx prisma migrate dev --name add_integration_events
```

### pgvector Extension Setup
Since Prisma doesn't natively support pgvector, we need a custom migration:

```typescript
// prisma/migrations/[timestamp]_add_pgvector/migration.sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to knowledge_base
ALTER TABLE "KnowledgeBase" 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create vector similarity index
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding 
ON "KnowledgeBase" 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Vector Search Query with Prisma
```typescript
// Since Prisma doesn't support vector operations natively, use raw queries
async function searchSimilarDocuments(embedding: number[], limit: number = 10) {
  return await prisma.$queryRaw`
    SELECT 
      id, 
      title, 
      content,
      1 - (embedding <=> ${embedding}::vector) as similarity
    FROM "KnowledgeBase"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${embedding}::vector
    LIMIT ${limit}
  `;
}
```

## Data Migration Scripts

### Migrate Existing Conversations to Sessions
```typescript
// scripts/migrate-conversations-to-sessions.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateConversationsToSessions() {
  const conversations = await prisma.conversation.findMany({
    where: {
      metadata: {
        path: ['agent_id'],
        not: null
      }
    }
  });
  
  for (const conv of conversations) {
    const metadata = conv.metadata as any;
    
    await prisma.agentSession.create({
      data: {
        userId: conv.userId,
        agentId: metadata.agent_id,
        conversationId: conv.id,
        status: 'COMPLETED',
        context: metadata.agent_context || {},
        completedAt: conv.updatedAt
      }
    });
  }
}
```

### Process Documents for Embeddings
```typescript
// scripts/generate-embeddings.ts
async function processDocumentsForEmbeddings() {
  const documents = await prisma.knowledgeBase.findMany({
    where: {
      processingStatus: 'PENDING',
      parentDocumentId: null
    }
  });
  
  for (const doc of documents) {
    // Generate embedding using OpenAI
    const embedding = await generateEmbedding(doc.content);
    
    // Update using raw query due to vector type
    await prisma.$executeRaw`
      UPDATE "KnowledgeBase"
      SET embedding = ${embedding}::vector,
          "processingStatus" = 'COMPLETED'
      WHERE id = ${doc.id}
    `;
  }
}
```

## Prisma Client Extensions for Vector Operations

```typescript
// lib/prisma-vector.ts
import { Prisma } from '@prisma/client';

export const vectorExtension = Prisma.defineExtension({
  name: 'vector',
  model: {
    knowledgeBase: {
      async findSimilar(embedding: number[], options?: {
        limit?: number;
        threshold?: number;
      }) {
        const limit = options?.limit || 10;
        const threshold = options?.threshold || 0.7;
        
        return await this.$queryRaw`
          SELECT 
            id,
            title,
            content,
            1 - (embedding <=> ${embedding}::vector) as similarity
          FROM "KnowledgeBase"
          WHERE embedding IS NOT NULL
            AND 1 - (embedding <=> ${embedding}::vector) > ${threshold}
          ORDER BY embedding <=> ${embedding}::vector
          LIMIT ${limit}
        `;
      }
    }
  }
});

// Usage
const prismaWithVector = prisma.$extends(vectorExtension);
const similar = await prismaWithVector.knowledgeBase.findSimilar(queryEmbedding);
```

## Cleanup Deprecated Tables

```typescript
// prisma/migrations/[timestamp]_cleanup_deprecated/migration.sql
-- Remove deprecated tables (if they exist)
DROP TABLE IF EXISTS migration_history_backup CASCADE;
DROP TABLE IF EXISTS _migrations_old CASCADE;
DROP TABLE IF EXISTS agent_template_versions CASCADE;
DROP TABLE IF EXISTS agent_template_history CASCADE;
```

## Performance Considerations

- Vector indexes use IVFFlat for approximate nearest neighbor search
- JSON fields in Prisma automatically get GIN indexes in PostgreSQL
- Session queries optimized with appropriate indexes
- Consider database connection pooling for high volume
- Use Prisma's query batching for bulk operations

## Data Integrity Rules

1. Agent sessions must reference valid agents and users (enforced by relations)
2. Integration events must reference active connections (enforced by relations)
3. Knowledge base chunks must reference parent documents (self-referential relation)
4. Conversation sessionId must be unique or NULL
5. Vector embeddings must be 1536 dimensions (OpenAI standard)

## Prisma Schema Configuration

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [vector]
}
```