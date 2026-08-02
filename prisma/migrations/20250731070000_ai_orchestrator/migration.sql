-- Busal AI Orchestrator models

CREATE TYPE "WorkflowStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DRAFT', 'ARCHIVED');
CREATE TYPE "WorkflowExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'WAITING', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE "ai_workflows" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_workflows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_workflow_steps" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "agent_id" TEXT,
    "skill_id" TEXT,
    "condition" TEXT,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_workflow_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_workflow_executions" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "status" "WorkflowExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER,
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_workflow_executions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_workflows_business_id_status_idx" ON "ai_workflows"("business_id", "status");
CREATE INDEX "ai_workflow_steps_workflow_id_order_idx" ON "ai_workflow_steps"("workflow_id", "order");
CREATE INDEX "ai_workflow_executions_business_id_status_created_at_idx" ON "ai_workflow_executions"("business_id", "status", "created_at");
CREATE INDEX "ai_workflow_executions_workflow_id_created_at_idx" ON "ai_workflow_executions"("workflow_id", "created_at");

ALTER TABLE "ai_workflows" ADD CONSTRAINT "ai_workflows_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_workflow_steps" ADD CONSTRAINT "ai_workflow_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "ai_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_workflow_steps" ADD CONSTRAINT "ai_workflow_steps_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_platform_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_workflow_steps" ADD CONSTRAINT "ai_workflow_steps_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "ai_skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_workflow_executions" ADD CONSTRAINT "ai_workflow_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "ai_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_workflow_executions" ADD CONSTRAINT "ai_workflow_executions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_workflow_executions" ADD CONSTRAINT "ai_workflow_executions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
