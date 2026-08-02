-- AI Marketing Agent

CREATE TYPE "MarketingPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "CampaignStatus" AS ENUM ('PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

CREATE TABLE "ai_marketing_insights" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "priority" "MarketingPriority" NOT NULL DEFAULT 'MEDIUM',
    "recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_marketing_insights_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_marketing_campaigns" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'PLANNED',
    "objective" TEXT,
    "target_audience" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "budget" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_marketing_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_marketing_insights_business_id_category_status_idx" ON "ai_marketing_insights"("business_id", "category", "status");
CREATE INDEX "ai_marketing_insights_business_id_priority_created_at_idx" ON "ai_marketing_insights"("business_id", "priority", "created_at");
CREATE INDEX "ai_marketing_campaigns_business_id_status_idx" ON "ai_marketing_campaigns"("business_id", "status");
CREATE INDEX "ai_marketing_campaigns_business_id_type_created_at_idx" ON "ai_marketing_campaigns"("business_id", "type", "created_at");

ALTER TABLE "ai_marketing_insights" ADD CONSTRAINT "ai_marketing_insights_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_marketing_campaigns" ADD CONSTRAINT "ai_marketing_campaigns_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
