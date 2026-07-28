-- Implementation permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'implementation.view', 'View Implementation', 'View implementation projects and delivery records', 'implementation', NOW(), NOW()),
  (gen_random_uuid(), 'implementation.manage', 'Manage Implementation', 'Manage implementation projects, templates, and tasks', 'implementation', NOW(), NOW()),
  (gen_random_uuid(), 'implementation.assign', 'Assign Implementation', 'Assign implementation projects and tasks', 'implementation', NOW(), NOW()),
  (gen_random_uuid(), 'implementation.complete', 'Complete Implementation', 'Complete implementation tasks and checklist items', 'implementation', NOW(), NOW()),
  (gen_random_uuid(), 'implementation.approve', 'Approve Implementation', 'Approve go-live and change requests', 'implementation', NOW(), NOW()),
  (gen_random_uuid(), 'implementation.close', 'Close Implementation', 'Close implementation projects after hypercare', 'implementation', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- Extend implementation project status
ALTER TYPE "ImplementationProjectStatus" ADD VALUE IF NOT EXISTS 'LIVE';
ALTER TYPE "ImplementationProjectStatus" ADD VALUE IF NOT EXISTS 'HYPERCARE';
ALTER TYPE "ImplementationProjectStatus" ADD VALUE IF NOT EXISTS 'CLOSED';

-- New enums
CREATE TYPE "ImplementationTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED');
CREATE TYPE "ImplementationMilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "ImplementationTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');
CREATE TYPE "ImplementationRiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "ImplementationRiskStatus" AS ENUM ('OPEN', 'MITIGATED', 'CLOSED');
CREATE TYPE "ImplementationIssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "ImplementationChangeRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'IMPLEMENTED');
CREATE TYPE "GoLiveChecklistItemStatus" AS ENUM ('PENDING', 'COMPLETED', 'WAIVED');
CREATE TYPE "HypercareStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- Extend implementation_projects
ALTER TABLE "implementation_projects" ADD COLUMN "template_id" TEXT;
ALTER TABLE "implementation_projects" ADD COLUMN "industry" TEXT;
ALTER TABLE "implementation_projects" ADD COLUMN "portal_token" TEXT;
ALTER TABLE "implementation_projects" ADD COLUMN "go_live_at" TIMESTAMP(3);
ALTER TABLE "implementation_projects" ADD COLUMN "closed_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "implementation_projects_portal_token_key" ON "implementation_projects"("portal_token");

-- Project templates
CREATE TABLE "project_templates" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_template_milestones" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "offset_days" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "project_template_milestones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_template_tasks" (
    "id" TEXT NOT NULL,
    "milestone_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_mandatory_for_go_live" BOOLEAN NOT NULL DEFAULT false,
    "visible_to_customer" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "project_template_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "implementation_milestones" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "ImplementationMilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "implementation_milestones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "implementation_tasks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "milestone_id" TEXT,
    "assigned_staff_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ImplementationTaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "ImplementationTaskPriority" NOT NULL DEFAULT 'NORMAL',
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "is_mandatory_for_go_live" BOOLEAN NOT NULL DEFAULT false,
    "visible_to_customer" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "implementation_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "implementation_risks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "ImplementationRiskSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "ImplementationRiskStatus" NOT NULL DEFAULT 'OPEN',
    "mitigation_plan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "implementation_risks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "implementation_issues" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ImplementationIssueStatus" NOT NULL DEFAULT 'OPEN',
    "reported_by_customer" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "implementation_issues_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "implementation_change_requests" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ImplementationChangeRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "requested_by_name" TEXT,
    "requested_by_email" TEXT,
    "approved_by_staff_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "implementation_change_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "go_live_checklist_items" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "status" "GoLiveChecklistItemStatus" NOT NULL DEFAULT 'PENDING',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "completed_by_staff_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "go_live_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "implementation_hypercare" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "status" "HypercareStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "implementation_hypercare_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "implementation_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "implementation_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "project_templates_business_id_slug_key" ON "project_templates"("business_id", "slug");
CREATE INDEX "implementation_milestones_project_id_sort_order_idx" ON "implementation_milestones"("project_id", "sort_order");
CREATE INDEX "implementation_tasks_project_id_status_idx" ON "implementation_tasks"("project_id", "status");
CREATE INDEX "implementation_risks_project_id_status_idx" ON "implementation_risks"("project_id", "status");
CREATE INDEX "implementation_issues_project_id_status_idx" ON "implementation_issues"("project_id", "status");
CREATE INDEX "implementation_change_requests_project_id_status_idx" ON "implementation_change_requests"("project_id", "status");
CREATE INDEX "go_live_checklist_items_project_id_status_idx" ON "go_live_checklist_items"("project_id", "status");
CREATE UNIQUE INDEX "implementation_hypercare_project_id_key" ON "implementation_hypercare"("project_id");

-- Foreign keys
ALTER TABLE "implementation_projects" ADD CONSTRAINT "implementation_projects_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "project_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_templates" ADD CONSTRAINT "project_templates_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_template_milestones" ADD CONSTRAINT "project_template_milestones_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "project_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_template_tasks" ADD CONSTRAINT "project_template_tasks_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "project_template_milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "implementation_milestones" ADD CONSTRAINT "implementation_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "implementation_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "implementation_tasks" ADD CONSTRAINT "implementation_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "implementation_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "implementation_tasks" ADD CONSTRAINT "implementation_tasks_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "implementation_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "implementation_tasks" ADD CONSTRAINT "implementation_tasks_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "implementation_risks" ADD CONSTRAINT "implementation_risks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "implementation_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "implementation_issues" ADD CONSTRAINT "implementation_issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "implementation_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "implementation_change_requests" ADD CONSTRAINT "implementation_change_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "implementation_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "go_live_checklist_items" ADD CONSTRAINT "go_live_checklist_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "implementation_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "implementation_hypercare" ADD CONSTRAINT "implementation_hypercare_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "implementation_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "implementation_audit_logs" ADD CONSTRAINT "implementation_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "implementation_audit_logs" ADD CONSTRAINT "implementation_audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
