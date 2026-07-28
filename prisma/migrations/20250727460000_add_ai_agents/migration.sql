-- AI Agent permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'ai.agent.view', 'View AI Agents', 'View AI agents, executions, and dashboards', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.agent.create', 'Create AI Agents', 'Create AI agents and templates', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.agent.edit', 'Edit AI Agents', 'Edit AI agent profiles and versions', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.agent.deploy', 'Deploy AI Agents', 'Publish and deploy AI agents', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.agent.disable', 'Disable AI Agents', 'Pause or disable AI agents', 'ai', NOW(), NOW()),
  (gen_random_uuid(), 'ai.agent.admin', 'Administer AI Agents', 'Full AI agent platform administration', 'ai', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "AiAgentStatus" AS ENUM ('DRAFT', 'TESTING', 'PUBLISHED', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AiAgentScheduleType" AS ENUM ('CONTINUOUS', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'EVENT_DRIVEN', 'MANUAL');

-- CreateEnum
CREATE TYPE "AiAgentMemoryType" AS ENUM ('SHORT_TERM', 'LONG_TERM', 'BUSINESS', 'CONVERSATION', 'TASK');

-- CreateEnum
CREATE TYPE "AiAgentExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'DELEGATED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ai_agents" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "agent_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatar" TEXT,
    "department" TEXT,
    "role" TEXT,
    "status" "AiAgentStatus" NOT NULL DEFAULT 'DRAFT',
    "current_version_id" TEXT,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_versions" (
    "id" TEXT NOT NULL,
    "agent_record_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "status" "AiAgentStatus" NOT NULL DEFAULT 'DRAFT',
    "personality" TEXT,
    "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "behaviour_rules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowed_tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowed_knowledge_collections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "memory_settings" JSONB,
    "model_config" JSONB,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "token_limit" INTEGER NOT NULL DEFAULT 4096,
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agent_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_skill_assignments" (
    "id" TEXT NOT NULL,
    "agent_record_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_agent_skill_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_schedules" (
    "id" TEXT NOT NULL,
    "agent_record_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "schedule_type" "AiAgentScheduleType" NOT NULL,
    "cron_expression" TEXT,
    "event_type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agent_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_memories" (
    "id" TEXT NOT NULL,
    "agent_record_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "memory_type" "AiAgentMemoryType" NOT NULL,
    "memory_key" TEXT,
    "content" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agent_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_executions" (
    "id" TEXT NOT NULL,
    "agent_record_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "version_id" TEXT NOT NULL,
    "status" "AiAgentExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "trigger_type" "AiAgentScheduleType",
    "input" JSONB,
    "output" JSONB,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "cost_cents" INTEGER NOT NULL DEFAULT 0,
    "knowledge_hits" INTEGER NOT NULL DEFAULT 0,
    "tool_calls" INTEGER NOT NULL DEFAULT 0,
    "automation_runs" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER,
    "error_details" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agent_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_delegations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "from_agent_record_id" TEXT NOT NULL,
    "to_agent_record_id" TEXT NOT NULL,
    "parent_execution_id" TEXT,
    "execution_id" TEXT,
    "task_summary" TEXT NOT NULL,
    "status" "AiAgentExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ai_agent_delegations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_agent_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_agents_current_version_id_key" ON "ai_agents"("current_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_agents_business_id_agent_id_key" ON "ai_agents"("business_id", "agent_id");

-- CreateIndex
CREATE INDEX "ai_agents_business_id_status_idx" ON "ai_agents"("business_id", "status");

-- CreateIndex
CREATE INDEX "ai_agents_business_id_is_template_idx" ON "ai_agents"("business_id", "is_template");

-- CreateIndex
CREATE UNIQUE INDEX "ai_agent_versions_agent_record_id_version_number_key" ON "ai_agent_versions"("agent_record_id", "version_number");

-- CreateIndex
CREATE INDEX "ai_agent_versions_business_id_status_idx" ON "ai_agent_versions"("business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ai_agent_skill_assignments_agent_record_id_skill_id_key" ON "ai_agent_skill_assignments"("agent_record_id", "skill_id");

-- CreateIndex
CREATE INDEX "ai_agent_skill_assignments_business_id_idx" ON "ai_agent_skill_assignments"("business_id");

-- CreateIndex
CREATE INDEX "ai_agent_schedules_business_id_is_active_idx" ON "ai_agent_schedules"("business_id", "is_active");

-- CreateIndex
CREATE INDEX "ai_agent_memories_agent_record_id_memory_type_idx" ON "ai_agent_memories"("agent_record_id", "memory_type");

-- CreateIndex
CREATE INDEX "ai_agent_memories_business_id_memory_type_idx" ON "ai_agent_memories"("business_id", "memory_type");

-- CreateIndex
CREATE INDEX "ai_agent_executions_business_id_created_at_idx" ON "ai_agent_executions"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_agent_executions_agent_record_id_status_idx" ON "ai_agent_executions"("agent_record_id", "status");

-- CreateIndex
CREATE INDEX "ai_agent_delegations_business_id_created_at_idx" ON "ai_agent_delegations"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_agent_delegations_from_agent_record_id_idx" ON "ai_agent_delegations"("from_agent_record_id");

-- CreateIndex
CREATE INDEX "ai_agent_delegations_to_agent_record_id_idx" ON "ai_agent_delegations"("to_agent_record_id");

-- CreateIndex
CREATE INDEX "ai_agent_audit_logs_business_id_created_at_idx" ON "ai_agent_audit_logs"("business_id", "created_at");

-- AddForeignKey
ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "ai_agent_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_versions" ADD CONSTRAINT "ai_agent_versions_agent_record_id_fkey" FOREIGN KEY ("agent_record_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_skill_assignments" ADD CONSTRAINT "ai_agent_skill_assignments_agent_record_id_fkey" FOREIGN KEY ("agent_record_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_schedules" ADD CONSTRAINT "ai_agent_schedules_agent_record_id_fkey" FOREIGN KEY ("agent_record_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_memories" ADD CONSTRAINT "ai_agent_memories_agent_record_id_fkey" FOREIGN KEY ("agent_record_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_executions" ADD CONSTRAINT "ai_agent_executions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_executions" ADD CONSTRAINT "ai_agent_executions_agent_record_id_fkey" FOREIGN KEY ("agent_record_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_executions" ADD CONSTRAINT "ai_agent_executions_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "ai_agent_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_delegations" ADD CONSTRAINT "ai_agent_delegations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_delegations" ADD CONSTRAINT "ai_agent_delegations_from_agent_record_id_fkey" FOREIGN KEY ("from_agent_record_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_delegations" ADD CONSTRAINT "ai_agent_delegations_to_agent_record_id_fkey" FOREIGN KEY ("to_agent_record_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_delegations" ADD CONSTRAINT "ai_agent_delegations_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "ai_agent_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_audit_logs" ADD CONSTRAINT "ai_agent_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
