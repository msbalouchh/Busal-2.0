-- Customer Success permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'success.view', 'View Customer Success', 'View customer success profiles and dashboards', 'success', NOW(), NOW()),
  (gen_random_uuid(), 'success.manage', 'Manage Customer Success', 'Manage playbooks, feedback, and success workflows', 'success', NOW(), NOW()),
  (gen_random_uuid(), 'success.assign', 'Assign Customer Success', 'Assign CSMs and success tasks', 'success', NOW(), NOW()),
  (gen_random_uuid(), 'success.review', 'Review Customer Success', 'Conduct and record executive business reviews', 'success', NOW(), NOW()),
  (gen_random_uuid(), 'success.renew', 'Renew Customer Success', 'Manage customer renewals', 'success', NOW(), NOW()),
  (gen_random_uuid(), 'success.expand', 'Expand Customer Success', 'Create upsell and cross-sell opportunities', 'success', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- Enums
CREATE TYPE "CustomerHealthStatus" AS ENUM ('HEALTHY', 'STABLE', 'AT_RISK', 'CRITICAL');
CREATE TYPE "CustomerSuccessTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "CustomerSuccessTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');
CREATE TYPE "CustomerSuccessTaskType" AS ENUM ('GENERAL', 'RENEWAL', 'ONBOARDING', 'REVIEW', 'EXPANSION', 'FEEDBACK');
CREATE TYPE "SuccessPlaybookTrigger" AS ENUM ('ACTIVATION', 'GO_LIVE', 'RENEWAL_DUE', 'HEALTH_AT_RISK', 'MANUAL');
CREATE TYPE "CustomerFeedbackType" AS ENUM ('CSAT', 'NPS', 'FEATURE_REQUEST', 'COMPLAINT');
CREATE TYPE "CustomerFeedbackStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CLOSED');
CREATE TYPE "CustomerRenewalRecordStatus" AS ENUM ('UPCOMING', 'IN_PROGRESS', 'RENEWED', 'AT_RISK', 'LOST');
CREATE TYPE "CustomerExpansionType" AS ENUM ('UPSELL', 'CROSS_SELL');
CREATE TYPE "CustomerExpansionStatus" AS ENUM ('IDENTIFIED', 'QUALIFIED', 'OPPORTUNITY_CREATED', 'WON', 'LOST');
CREATE TYPE "ExecutiveReviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- Tables
CREATE TABLE "customer_account_profiles" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "activation_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "sales_company_id" TEXT,
    "sales_contact_id" TEXT,
    "customer_success_manager_id" TEXT,
    "health_score" INTEGER NOT NULL DEFAULT 70,
    "health_status" "CustomerHealthStatus" NOT NULL DEFAULT 'STABLE',
    "last_health_calculated_at" TIMESTAMP(3),
    "industry" TEXT,
    "segment" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customer_account_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_health_scores" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "status" "CustomerHealthStatus" NOT NULL,
    "factors" JSONB,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_health_scores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "success_playbooks" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT,
    "trigger" "SuccessPlaybookTrigger" NOT NULL DEFAULT 'MANUAL',
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "success_playbooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "success_playbook_steps" (
    "id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "task_type" "CustomerSuccessTaskType" NOT NULL DEFAULT 'GENERAL',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "offset_days" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "success_playbook_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_success_tasks" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "playbook_step_id" TEXT,
    "assigned_staff_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "task_type" "CustomerSuccessTaskType" NOT NULL DEFAULT 'GENERAL',
    "status" "CustomerSuccessTaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "CustomerSuccessTaskPriority" NOT NULL DEFAULT 'NORMAL',
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customer_success_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_feedback" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "feedback_type" "CustomerFeedbackType" NOT NULL,
    "score" INTEGER,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "status" "CustomerFeedbackStatus" NOT NULL DEFAULT 'OPEN',
    "submitted_by_name" TEXT,
    "submitted_by_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customer_feedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_renewal_records" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "contract_renewal_id" TEXT,
    "renewal_date" TIMESTAMP(3) NOT NULL,
    "status" "CustomerRenewalRecordStatus" NOT NULL DEFAULT 'UPCOMING',
    "notes" TEXT,
    "task_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customer_renewal_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_expansion_opportunities" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "sales_opportunity_id" TEXT,
    "expansion_type" "CustomerExpansionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimated_value_pence" INTEGER NOT NULL DEFAULT 0,
    "status" "CustomerExpansionStatus" NOT NULL DEFAULT 'IDENTIFIED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customer_expansion_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "executive_business_reviews" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "status" "ExecutiveReviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "summary" TEXT,
    "attendees" TEXT,
    "next_review_at" TIMESTAMP(3),
    "conducted_by_staff_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "executive_business_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_success_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_success_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "customer_account_profiles_customer_id_key" ON "customer_account_profiles"("customer_id");
CREATE UNIQUE INDEX "customer_account_profiles_activation_id_key" ON "customer_account_profiles"("activation_id");
CREATE UNIQUE INDEX "customer_account_profiles_contract_id_key" ON "customer_account_profiles"("contract_id");
CREATE INDEX "customer_account_profiles_business_id_health_status_idx" ON "customer_account_profiles"("business_id", "health_status");
CREATE INDEX "customer_health_scores_profile_id_calculated_at_idx" ON "customer_health_scores"("profile_id", "calculated_at");
CREATE UNIQUE INDEX "success_playbooks_business_id_slug_key" ON "success_playbooks"("business_id", "slug");
CREATE INDEX "customer_success_tasks_profile_id_status_idx" ON "customer_success_tasks"("profile_id", "status");
CREATE INDEX "customer_feedback_profile_id_feedback_type_idx" ON "customer_feedback"("profile_id", "feedback_type");
CREATE INDEX "customer_renewal_records_profile_id_renewal_date_idx" ON "customer_renewal_records"("profile_id", "renewal_date");
CREATE UNIQUE INDEX "customer_expansion_opportunities_sales_opportunity_id_key" ON "customer_expansion_opportunities"("sales_opportunity_id");
CREATE INDEX "customer_expansion_opportunities_profile_id_status_idx" ON "customer_expansion_opportunities"("profile_id", "status");
CREATE INDEX "executive_business_reviews_profile_id_scheduled_at_idx" ON "executive_business_reviews"("profile_id", "scheduled_at");

-- Foreign keys
ALTER TABLE "customer_account_profiles" ADD CONSTRAINT "customer_account_profiles_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_account_profiles" ADD CONSTRAINT "customer_account_profiles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_account_profiles" ADD CONSTRAINT "customer_account_profiles_activation_id_fkey" FOREIGN KEY ("activation_id") REFERENCES "customer_activations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_account_profiles" ADD CONSTRAINT "customer_account_profiles_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_account_profiles" ADD CONSTRAINT "customer_account_profiles_sales_company_id_fkey" FOREIGN KEY ("sales_company_id") REFERENCES "sales_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_account_profiles" ADD CONSTRAINT "customer_account_profiles_sales_contact_id_fkey" FOREIGN KEY ("sales_contact_id") REFERENCES "sales_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_account_profiles" ADD CONSTRAINT "customer_account_profiles_customer_success_manager_id_fkey" FOREIGN KEY ("customer_success_manager_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_health_scores" ADD CONSTRAINT "customer_health_scores_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "customer_account_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "success_playbooks" ADD CONSTRAINT "success_playbooks_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "success_playbook_steps" ADD CONSTRAINT "success_playbook_steps_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "success_playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_success_tasks" ADD CONSTRAINT "customer_success_tasks_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "customer_account_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_success_tasks" ADD CONSTRAINT "customer_success_tasks_playbook_step_id_fkey" FOREIGN KEY ("playbook_step_id") REFERENCES "success_playbook_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_success_tasks" ADD CONSTRAINT "customer_success_tasks_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_feedback" ADD CONSTRAINT "customer_feedback_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "customer_account_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_renewal_records" ADD CONSTRAINT "customer_renewal_records_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "customer_account_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_renewal_records" ADD CONSTRAINT "customer_renewal_records_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_renewal_records" ADD CONSTRAINT "customer_renewal_records_contract_renewal_id_fkey" FOREIGN KEY ("contract_renewal_id") REFERENCES "contract_renewals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_expansion_opportunities" ADD CONSTRAINT "customer_expansion_opportunities_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "customer_account_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_expansion_opportunities" ADD CONSTRAINT "customer_expansion_opportunities_sales_opportunity_id_fkey" FOREIGN KEY ("sales_opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "executive_business_reviews" ADD CONSTRAINT "executive_business_reviews_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "customer_account_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "executive_business_reviews" ADD CONSTRAINT "executive_business_reviews_conducted_by_staff_id_fkey" FOREIGN KEY ("conducted_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_success_audit_logs" ADD CONSTRAINT "customer_success_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_success_audit_logs" ADD CONSTRAINT "customer_success_audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
