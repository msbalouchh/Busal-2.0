-- AI Tool permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'ai.tool.execute', 'Execute AI Tools', 'Execute AI callable tools', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.tool.register', 'Register AI Tools', 'Register AI tools for the business', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.tool.disable', 'Disable AI Tools', 'Disable AI tools for the business', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.tool.admin', 'Administer AI Tools', 'Full AI tool administration access', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "AiToolCategory" AS ENUM ('CRM', 'RESTAURANT', 'POS', 'ORDERS', 'RESERVATIONS', 'INVENTORY', 'REPORTING', 'STAFF', 'COMMERCIAL', 'REVENUE', 'AI', 'MARKETING', 'FINANCE', 'ADMINISTRATION');

-- CreateEnum
CREATE TYPE "AiToolStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "AiToolRiskLevel" AS ENUM ('READ_ONLY', 'STANDARD', 'HIGH_RISK');

-- CreateEnum
CREATE TYPE "AiToolExecutionStatus" AS ENUM ('PENDING', 'AWAITING_CONFIRMATION', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED', 'DRY_RUN');

-- CreateTable
CREATE TABLE "ai_tools" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "tool_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "category" "AiToolCategory" NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "input_schema" JSONB NOT NULL,
    "output_schema" JSONB NOT NULL,
    "required_permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supported_industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "AiToolStatus" NOT NULL DEFAULT 'ACTIVE',
    "risk_level" "AiToolRiskLevel" NOT NULL DEFAULT 'STANDARD',
    "dry_run_supported" BOOLEAN NOT NULL DEFAULT false,
    "confirmation_required" BOOLEAN NOT NULL DEFAULT false,
    "read_only" BOOLEAN NOT NULL DEFAULT false,
    "rollback_capable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_tool_executions" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "tool_record_id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "user_id" TEXT,
    "staff_id" TEXT,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "status" "AiToolExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "error_details" TEXT,
    "execution_time_ms" INTEGER,
    "tokens_used" INTEGER,
    "model_used" TEXT,
    "dry_run" BOOLEAN NOT NULL DEFAULT false,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "parent_execution_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_tool_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_tools_category_status_idx" ON "ai_tools"("category", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ai_tools_business_id_tool_id_key" ON "ai_tools"("business_id", "tool_id");

-- CreateIndex
CREATE INDEX "ai_tool_executions_business_id_created_at_idx" ON "ai_tool_executions"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_tool_executions_tool_id_status_idx" ON "ai_tool_executions"("tool_id", "status");

-- AddForeignKey
ALTER TABLE "ai_tools" ADD CONSTRAINT "ai_tools_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tool_executions" ADD CONSTRAINT "ai_tool_executions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tool_executions" ADD CONSTRAINT "ai_tool_executions_tool_record_id_fkey" FOREIGN KEY ("tool_record_id") REFERENCES "ai_tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tool_executions" ADD CONSTRAINT "ai_tool_executions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tool_executions" ADD CONSTRAINT "ai_tool_executions_parent_execution_id_fkey" FOREIGN KEY ("parent_execution_id") REFERENCES "ai_tool_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
