-- Busal AI Memory Engine models

CREATE TYPE "MemoryType" AS ENUM (
    'SHORT_TERM',
    'LONG_TERM',
    'SESSION',
    'BUSINESS',
    'CUSTOMER',
    'STAFF',
    'KNOWLEDGE',
    'SEMANTIC'
);

CREATE TABLE "ai_memories" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "staff_id" TEXT,
    "customer_id" TEXT,
    "conversation_id" TEXT,
    "memory_type" "MemoryType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding_reference" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "importance_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_memories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_memory_collections" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_memory_collections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_memory_references" (
    "id" TEXT NOT NULL,
    "memory_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,

    CONSTRAINT "ai_memory_references_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_memories_business_id_memory_type_importance_score_idx" ON "ai_memories"("business_id", "memory_type", "importance_score");
CREATE INDEX "ai_memories_business_id_agent_id_created_at_idx" ON "ai_memories"("business_id", "agent_id", "created_at");
CREATE INDEX "ai_memories_business_id_conversation_id_idx" ON "ai_memories"("business_id", "conversation_id");
CREATE INDEX "ai_memories_business_id_customer_id_idx" ON "ai_memories"("business_id", "customer_id");
CREATE INDEX "ai_memories_business_id_staff_id_idx" ON "ai_memories"("business_id", "staff_id");
CREATE INDEX "ai_memories_business_id_expires_at_idx" ON "ai_memories"("business_id", "expires_at");
CREATE UNIQUE INDEX "ai_memory_collections_business_id_name_key" ON "ai_memory_collections"("business_id", "name");
CREATE INDEX "ai_memory_collections_business_id_updated_at_idx" ON "ai_memory_collections"("business_id", "updated_at");
CREATE INDEX "ai_memory_references_memory_id_idx" ON "ai_memory_references"("memory_id");
CREATE INDEX "ai_memory_references_entity_type_entity_id_idx" ON "ai_memory_references"("entity_type", "entity_id");

ALTER TABLE "ai_memories" ADD CONSTRAINT "ai_memories_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_memories" ADD CONSTRAINT "ai_memories_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_platform_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_memories" ADD CONSTRAINT "ai_memories_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_memories" ADD CONSTRAINT "ai_memories_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_memories" ADD CONSTRAINT "ai_memories_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_memory_collections" ADD CONSTRAINT "ai_memory_collections_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_memory_references" ADD CONSTRAINT "ai_memory_references_memory_id_fkey" FOREIGN KEY ("memory_id") REFERENCES "ai_memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
