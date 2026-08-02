-- Busal Automation Platform (shared business process automation)

CREATE TYPE "PlatformWorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "PlatformAutomationTriggerType" AS ENUM ('EVENT', 'SCHEDULE', 'MANUAL', 'WEBHOOK', 'API');

CREATE TABLE "automation_platform_workflows" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "PlatformWorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "trigger_type" "PlatformAutomationTriggerType" NOT NULL,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_platform_workflows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "automation_platform_triggers" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_platform_triggers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "automation_platform_conditions" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_platform_conditions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "automation_platform_actions" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_platform_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "automation_platform_executions" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER,
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT "automation_platform_executions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "automation_platform_workflows_business_id_status_idx" ON "automation_platform_workflows"("business_id", "status");
CREATE INDEX "automation_platform_workflows_business_id_enabled_idx" ON "automation_platform_workflows"("business_id", "enabled");
CREATE INDEX "automation_platform_triggers_workflow_id_idx" ON "automation_platform_triggers"("workflow_id");
CREATE INDEX "automation_platform_conditions_workflow_id_idx" ON "automation_platform_conditions"("workflow_id");
CREATE INDEX "automation_platform_actions_workflow_id_order_idx" ON "automation_platform_actions"("workflow_id", "order");
CREATE INDEX "automation_platform_executions_business_id_status_idx" ON "automation_platform_executions"("business_id", "status");
CREATE INDEX "automation_platform_executions_workflow_id_started_at_idx" ON "automation_platform_executions"("workflow_id", "started_at");

ALTER TABLE "automation_platform_workflows" ADD CONSTRAINT "automation_platform_workflows_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_platform_triggers" ADD CONSTRAINT "automation_platform_triggers_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "automation_platform_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_platform_conditions" ADD CONSTRAINT "automation_platform_conditions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "automation_platform_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_platform_actions" ADD CONSTRAINT "automation_platform_actions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "automation_platform_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_platform_executions" ADD CONSTRAINT "automation_platform_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "automation_platform_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_platform_executions" ADD CONSTRAINT "automation_platform_executions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
