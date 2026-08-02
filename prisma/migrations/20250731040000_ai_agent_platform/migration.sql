-- Busal AI Agent Platform models

CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DRAFT', 'ARCHIVED');
CREATE TYPE "AgentCategory" AS ENUM ('BUSINESS', 'OPERATIONS', 'SUPPORT', 'MARKETING', 'FINANCE', 'CUSTOM');
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE "ai_platform_agents" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" "AgentCategory" NOT NULL DEFAULT 'CUSTOM',
    "status" "AgentStatus" NOT NULL DEFAULT 'DRAFT',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "icon" TEXT,
    "color" TEXT,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_platform_agents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_platform_agent_tools" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tool_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_platform_agent_tools_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_platform_agent_capabilities" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ai_platform_agent_capabilities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_platform_agent_executions" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER,
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_platform_agent_executions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_platform_agents_business_id_slug_key" ON "ai_platform_agents"("business_id", "slug");
CREATE INDEX "ai_platform_agents_business_id_status_category_idx" ON "ai_platform_agents"("business_id", "status", "category");
CREATE UNIQUE INDEX "ai_platform_agent_tools_agent_id_tool_key_key" ON "ai_platform_agent_tools"("agent_id", "tool_key");
CREATE UNIQUE INDEX "ai_platform_agent_capabilities_agent_id_name_key" ON "ai_platform_agent_capabilities"("agent_id", "name");
CREATE INDEX "ai_platform_agent_executions_business_id_status_created_at_idx" ON "ai_platform_agent_executions"("business_id", "status", "created_at");
CREATE INDEX "ai_platform_agent_executions_agent_id_created_at_idx" ON "ai_platform_agent_executions"("agent_id", "created_at");

ALTER TABLE "ai_platform_agents" ADD CONSTRAINT "ai_platform_agents_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_platform_agent_tools" ADD CONSTRAINT "ai_platform_agent_tools_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_platform_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_platform_agent_capabilities" ADD CONSTRAINT "ai_platform_agent_capabilities_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_platform_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_platform_agent_executions" ADD CONSTRAINT "ai_platform_agent_executions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_platform_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_platform_agent_executions" ADD CONSTRAINT "ai_platform_agent_executions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_platform_agent_executions" ADD CONSTRAINT "ai_platform_agent_executions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
