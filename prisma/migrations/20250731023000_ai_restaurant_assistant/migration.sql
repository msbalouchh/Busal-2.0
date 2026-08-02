-- AI Restaurant Assistant models

CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "MessageRole" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT');
CREATE TYPE "RecommendationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RecommendationStatus" AS ENUM ('NEW', 'VIEWED', 'IMPLEMENTED', 'DISMISSED');

CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "title" TEXT NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_recommendations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" "RecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "action" TEXT,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'NEW',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_conversations_business_id_status_updated_at_idx" ON "ai_conversations"("business_id", "status", "updated_at");
CREATE INDEX "ai_conversations_business_id_staff_id_idx" ON "ai_conversations"("business_id", "staff_id");
CREATE INDEX "ai_messages_conversation_id_created_at_idx" ON "ai_messages"("conversation_id", "created_at");
CREATE INDEX "ai_recommendations_business_id_status_priority_idx" ON "ai_recommendations"("business_id", "status", "priority");

ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
