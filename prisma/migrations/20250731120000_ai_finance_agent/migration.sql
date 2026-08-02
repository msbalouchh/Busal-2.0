-- AI Finance Agent

CREATE TYPE "FinancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "FinanceRecommendationStatus" AS ENUM ('NEW', 'VIEWED', 'IMPLEMENTED', 'DISMISSED');

CREATE TABLE "ai_finance_insights" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "priority" "FinancePriority" NOT NULL DEFAULT 'MEDIUM',
    "recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_finance_insights_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_finance_recommendations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "action" TEXT NOT NULL,
    "expected_impact" TEXT,
    "confidence_score" DOUBLE PRECISION,
    "status" "FinanceRecommendationStatus" NOT NULL DEFAULT 'NEW',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_finance_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_finance_insights_business_id_status_created_at_idx" ON "ai_finance_insights"("business_id", "status", "created_at");
CREATE INDEX "ai_finance_insights_business_id_priority_idx" ON "ai_finance_insights"("business_id", "priority");
CREATE INDEX "ai_finance_insights_business_id_category_idx" ON "ai_finance_insights"("business_id", "category");
CREATE INDEX "ai_finance_recommendations_business_id_status_created_at_idx" ON "ai_finance_recommendations"("business_id", "status", "created_at");

ALTER TABLE "ai_finance_insights" ADD CONSTRAINT "ai_finance_insights_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_finance_recommendations" ADD CONSTRAINT "ai_finance_recommendations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
