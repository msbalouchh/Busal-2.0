-- Automation permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'ai.automation.view', 'View Automations', 'View automation workflows and executions', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.automation.create', 'Create Automations', 'Create automation workflows and templates', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.automation.edit', 'Edit Automations', 'Edit automation workflows', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.automation.delete', 'Delete Automations', 'Delete or archive automation workflows', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.automation.admin', 'Administer Automations', 'Full automation engine administration', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.automation.execute', 'Execute Automations', 'Trigger and run automation workflows', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.automation.approve', 'Approve Automations', 'Approve automation workflow steps', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "AutomationEventCategory" AS ENUM ('BUSINESS', 'STAFF', 'CUSTOMER', 'ORDER', 'RESERVATION', 'INVENTORY', 'POS', 'COMMERCIAL', 'REVENUE', 'CONTRACT', 'IMPLEMENTATION', 'MARKETING', 'AI', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AutomationTriggerType" AS ENUM ('SYSTEM_EVENT', 'SCHEDULED', 'MANUAL', 'WEBHOOK', 'API');

-- CreateEnum
CREATE TYPE "AutomationWorkflowStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AutomationExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING');

-- CreateEnum
CREATE TYPE "AutomationNodeType" AS ENUM ('TRIGGER', 'CONDITION', 'AI_DECISION', 'ACTION', 'APPROVAL', 'COMPLETION');

-- CreateEnum
CREATE TYPE "AutomationApprovalType" AS ENUM ('MANAGER', 'FINANCE', 'OWNER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AutomationActionType" AS ENUM ('CREATE_RECORD', 'UPDATE_RECORD', 'DELETE_RECORD', 'SEND_EMAIL', 'SEND_WHATSAPP', 'GENERATE_PROPOSAL', 'GENERATE_INVOICE', 'CREATE_TASK', 'NOTIFY_STAFF', 'CALL_AI_AGENT', 'RUN_WORKFLOW');

-- CreateTable
CREATE TABLE "automation_workflows" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "current_version_id" TEXT,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_workflow_versions" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" "AutomationWorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "trigger_type" "AutomationTriggerType" NOT NULL,
    "trigger_config" JSONB NOT NULL,
    "nodes" JSONB NOT NULL,
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_workflow_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_events" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "category" "AutomationEventCategory" NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "source_module" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_workflow_executions" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "workflow_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "trigger_type" "AutomationTriggerType" NOT NULL,
    "status" "AutomationExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "event_id" TEXT,
    "input" JSONB,
    "output" JSONB,
    "error_details" TEXT,
    "duration_ms" INTEGER,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "ai_decision_count" INTEGER NOT NULL DEFAULT 0,
    "ai_cost_tokens" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_execution_steps" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "node_type" "AutomationNodeType" NOT NULL,
    "status" "AutomationExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "input" JSONB,
    "output" JSONB,
    "confidence_score" DOUBLE PRECISION,
    "reasoning" TEXT,
    "error_details" TEXT,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_execution_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_approval_requests" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "approval_type" "AutomationApprovalType" NOT NULL,
    "approver_role" TEXT,
    "status" "AutomationExecutionStatus" NOT NULL DEFAULT 'AWAITING_APPROVAL',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "notes" TEXT,

    CONSTRAINT "automation_approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automation_workflows_business_id_is_template_idx" ON "automation_workflows"("business_id", "is_template");

-- CreateIndex
CREATE UNIQUE INDEX "automation_workflows_current_version_id_key" ON "automation_workflows"("current_version_id");

-- CreateIndex
CREATE INDEX "automation_workflow_versions_business_id_status_idx" ON "automation_workflow_versions"("business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "automation_workflow_versions_workflow_id_version_number_key" ON "automation_workflow_versions"("workflow_id", "version_number");

-- CreateIndex
CREATE INDEX "automation_events_business_id_event_type_created_at_idx" ON "automation_events"("business_id", "event_type", "created_at");

-- CreateIndex
CREATE INDEX "automation_events_business_id_category_idx" ON "automation_events"("business_id", "category");

-- CreateIndex
CREATE INDEX "automation_workflow_executions_business_id_created_at_idx" ON "automation_workflow_executions"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "automation_workflow_executions_workflow_id_status_idx" ON "automation_workflow_executions"("workflow_id", "status");

-- CreateIndex
CREATE INDEX "automation_execution_steps_execution_id_node_type_idx" ON "automation_execution_steps"("execution_id", "node_type");

-- CreateIndex
CREATE INDEX "automation_approval_requests_business_id_status_idx" ON "automation_approval_requests"("business_id", "status");

-- CreateIndex
CREATE INDEX "automation_audit_logs_business_id_created_at_idx" ON "automation_audit_logs"("business_id", "created_at");

-- AddForeignKey
ALTER TABLE "automation_workflows" ADD CONSTRAINT "automation_workflows_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_workflow_versions" ADD CONSTRAINT "automation_workflow_versions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "automation_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_events" ADD CONSTRAINT "automation_events_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_workflow_executions" ADD CONSTRAINT "automation_workflow_executions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_workflow_executions" ADD CONSTRAINT "automation_workflow_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "automation_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_workflow_executions" ADD CONSTRAINT "automation_workflow_executions_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "automation_workflow_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_execution_steps" ADD CONSTRAINT "automation_execution_steps_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "automation_workflow_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_approval_requests" ADD CONSTRAINT "automation_approval_requests_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "automation_workflow_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_audit_logs" ADD CONSTRAINT "automation_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
