-- AI Sales Agent

CREATE TYPE "SalesPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE "ai_sales_insights" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "SalesPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL,
    "recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_sales_insights_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_sales_recommendations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "action" TEXT NOT NULL,
    "priority" "SalesPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RecommendationStatus" NOT NULL DEFAULT 'NEW',
    "expected_impact" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_sales_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_sales_insights_business_id_category_status_idx" ON "ai_sales_insights"("business_id", "category", "status");
CREATE INDEX "ai_sales_insights_business_id_priority_created_at_idx" ON "ai_sales_insights"("business_id", "priority", "created_at");
CREATE INDEX "ai_sales_recommendations_business_id_status_created_at_idx" ON "ai_sales_recommendations"("business_id", "status", "created_at");
CREATE INDEX "ai_sales_recommendations_business_id_customer_id_idx" ON "ai_sales_recommendations"("business_id", "customer_id");
CREATE INDEX "ai_sales_recommendations_business_id_priority_idx" ON "ai_sales_recommendations"("business_id", "priority");

ALTER TABLE "ai_sales_insights" ADD CONSTRAINT "ai_sales_insights_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_sales_recommendations" ADD CONSTRAINT "ai_sales_recommendations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_sales_recommendations" ADD CONSTRAINT "ai_sales_recommendations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
