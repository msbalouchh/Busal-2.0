-- Busal AI Skills Library models

CREATE TYPE "SkillStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DRAFT', 'ARCHIVED');
CREATE TYPE "SkillCategory" AS ENUM (
    'BUSINESS',
    'CUSTOMER',
    'STAFF',
    'REPORTING',
    'MARKETING',
    'OPERATIONS',
    'FINANCE',
    'SYSTEM',
    'CUSTOM'
);
CREATE TYPE "SkillExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE "ai_skill_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,

    CONSTRAINT "ai_skill_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_skills" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "category_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "SkillCategory" NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" "SkillStatus" NOT NULL DEFAULT 'DRAFT',
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "input_schema" JSONB NOT NULL DEFAULT '{}',
    "output_schema" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_skills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_skill_executions" (
    "id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "status" "SkillExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER,
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_skill_executions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_skill_categories_name_key" ON "ai_skill_categories"("name");
CREATE UNIQUE INDEX "ai_skills_business_id_slug_key" ON "ai_skills"("business_id", "slug");
CREATE INDEX "ai_skills_business_id_status_category_idx" ON "ai_skills"("business_id", "status", "category");
CREATE INDEX "ai_skill_executions_business_id_status_created_at_idx" ON "ai_skill_executions"("business_id", "status", "created_at");
CREATE INDEX "ai_skill_executions_skill_id_created_at_idx" ON "ai_skill_executions"("skill_id", "created_at");
CREATE INDEX "ai_skill_executions_agent_id_created_at_idx" ON "ai_skill_executions"("agent_id", "created_at");

ALTER TABLE "ai_skills" ADD CONSTRAINT "ai_skills_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_skills" ADD CONSTRAINT "ai_skills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ai_skill_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_skill_executions" ADD CONSTRAINT "ai_skill_executions_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "ai_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_skill_executions" ADD CONSTRAINT "ai_skill_executions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_platform_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_skill_executions" ADD CONSTRAINT "ai_skill_executions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_skill_executions" ADD CONSTRAINT "ai_skill_executions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "ai_skill_categories" ("id", "name", "description", "icon", "color")
VALUES
    (gen_random_uuid(), 'Business', 'Business intelligence and operations skills', 'briefcase', '#2563eb'),
    (gen_random_uuid(), 'Customer', 'Customer analysis and engagement skills', 'users', '#7c3aed'),
    (gen_random_uuid(), 'Staff', 'Staff and workforce skills', 'user-cog', '#0891b2'),
    (gen_random_uuid(), 'Reporting', 'Reporting and analytics skills', 'bar-chart-3', '#059669'),
    (gen_random_uuid(), 'Marketing', 'Marketing and growth skills', 'megaphone', '#db2777'),
    (gen_random_uuid(), 'Operations', 'Operational workflow skills', 'settings', '#ea580c'),
    (gen_random_uuid(), 'Finance', 'Finance and revenue skills', 'wallet', '#ca8a04'),
    (gen_random_uuid(), 'System', 'Platform and system skills', 'cpu', '#475569'),
    (gen_random_uuid(), 'Custom', 'Custom tenant-defined skills', 'sparkles', '#64748b')
ON CONFLICT ("name") DO NOTHING;
