-- AI Customer Support Agent

CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "SupportRecommendationStatus" AS ENUM ('NEW', 'VIEWED', 'IMPLEMENTED', 'DISMISSED');

CREATE TABLE "ai_support_insights" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "ticket_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "SupportPriority" NOT NULL DEFAULT 'MEDIUM',
    "recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_support_insights_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_support_recommendations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "customer_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "action" TEXT NOT NULL,
    "confidence_score" DOUBLE PRECISION,
    "status" "SupportRecommendationStatus" NOT NULL DEFAULT 'NEW',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_support_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_support_insights_business_id_status_created_at_idx" ON "ai_support_insights"("business_id", "status", "created_at");
CREATE INDEX "ai_support_insights_business_id_priority_idx" ON "ai_support_insights"("business_id", "priority");
CREATE INDEX "ai_support_insights_business_id_ticket_id_idx" ON "ai_support_insights"("business_id", "ticket_id");
CREATE INDEX "ai_support_insights_business_id_customer_id_idx" ON "ai_support_insights"("business_id", "customer_id");
CREATE INDEX "ai_support_recommendations_business_id_status_created_at_idx" ON "ai_support_recommendations"("business_id", "status", "created_at");
CREATE INDEX "ai_support_recommendations_business_id_ticket_id_idx" ON "ai_support_recommendations"("business_id", "ticket_id");
CREATE INDEX "ai_support_recommendations_business_id_customer_id_idx" ON "ai_support_recommendations"("business_id", "customer_id");

ALTER TABLE "ai_support_insights" ADD CONSTRAINT "ai_support_insights_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_support_insights" ADD CONSTRAINT "ai_support_insights_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_support_insights" ADD CONSTRAINT "ai_support_insights_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "communication_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_support_recommendations" ADD CONSTRAINT "ai_support_recommendations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_support_recommendations" ADD CONSTRAINT "ai_support_recommendations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_support_recommendations" ADD CONSTRAINT "ai_support_recommendations_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "communication_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
