-- AI HR Agent

CREATE TYPE "HRPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "HRRecommendationStatus" AS ENUM ('NEW', 'VIEWED', 'IMPLEMENTED', 'DISMISSED');

CREATE TABLE "ai_hr_insights" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "priority" "HRPriority" NOT NULL DEFAULT 'MEDIUM',
    "recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_hr_insights_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_hr_recommendations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "action" TEXT NOT NULL,
    "confidence_score" DOUBLE PRECISION,
    "status" "HRRecommendationStatus" NOT NULL DEFAULT 'NEW',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_hr_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_hr_insights_business_id_status_created_at_idx" ON "ai_hr_insights"("business_id", "status", "created_at");
CREATE INDEX "ai_hr_insights_business_id_priority_idx" ON "ai_hr_insights"("business_id", "priority");
CREATE INDEX "ai_hr_insights_business_id_category_idx" ON "ai_hr_insights"("business_id", "category");
CREATE INDEX "ai_hr_insights_business_id_staff_id_idx" ON "ai_hr_insights"("business_id", "staff_id");
CREATE INDEX "ai_hr_recommendations_business_id_status_created_at_idx" ON "ai_hr_recommendations"("business_id", "status", "created_at");
CREATE INDEX "ai_hr_recommendations_business_id_staff_id_idx" ON "ai_hr_recommendations"("business_id", "staff_id");

ALTER TABLE "ai_hr_insights" ADD CONSTRAINT "ai_hr_insights_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_hr_insights" ADD CONSTRAINT "ai_hr_insights_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_hr_recommendations" ADD CONSTRAINT "ai_hr_recommendations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_hr_recommendations" ADD CONSTRAINT "ai_hr_recommendations_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
