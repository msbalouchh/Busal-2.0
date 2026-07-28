-- Sales CRM permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'sales.view', 'View Sales CRM', 'View sales pipeline, leads, and opportunities', 'sales', NOW(), NOW()),
  (gen_random_uuid(), 'sales.create', 'Create Sales Records', 'Create leads, companies, contacts, and opportunities', 'sales', NOW(), NOW()),
  (gen_random_uuid(), 'sales.update', 'Update Sales Records', 'Update sales CRM records and activities', 'sales', NOW(), NOW()),
  (gen_random_uuid(), 'sales.manage', 'Manage Sales Pipeline', 'Configure pipeline stages and sales settings', 'sales', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- Enums
CREATE TYPE "SalesLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED');
CREATE TYPE "SalesLeadSource" AS ENUM ('WEBSITE', 'REFERRAL', 'COLD_OUTREACH', 'EVENT', 'OTHER');
CREATE TYPE "SalesActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'NOTE', 'DEMO', 'TASK', 'STAGE_CHANGE');
CREATE TYPE "SalesTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "SalesTaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');
CREATE TYPE "SalesDemoStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "OpportunityCatalogueLinkType" AS ENUM ('PRODUCT', 'BUNDLE', 'IMPLEMENTATION_PACKAGE', 'MANAGED_SERVICE');

-- Tables
CREATE TABLE "sales_pipelines" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sales_pipelines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_pipeline_stages" (
    "id" TEXT NOT NULL,
    "pipeline_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "probability_bps" INTEGER NOT NULL DEFAULT 0,
    "is_won" BOOLEAN NOT NULL DEFAULT false,
    "is_lost" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sales_pipeline_stages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_companies" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sales_companies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_contacts" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "company_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "job_title" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sales_contacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_leads" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "company_id" TEXT,
    "contact_id" TEXT,
    "assigned_staff_id" TEXT,
    "title" TEXT NOT NULL,
    "status" "SalesLeadStatus" NOT NULL DEFAULT 'NEW',
    "source" "SalesLeadSource" NOT NULL DEFAULT 'OTHER',
    "estimated_value_pence" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "converted_opportunity_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sales_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_opportunities" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "pipeline_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "company_id" TEXT,
    "contact_id" TEXT,
    "assigned_staff_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "value_pence" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "expected_close_date" TIMESTAMP(3),
    "prepared_quote_id" TEXT,
    "prepared_proposal_id" TEXT,
    "prepared_contract_id" TEXT,
    "prepared_invoice_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sales_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_opportunity_catalogue_links" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "link_type" "OpportunityCatalogueLinkType" NOT NULL,
    "product_version_id" TEXT,
    "bundle_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_opportunity_catalogue_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_activities" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "opportunity_id" TEXT,
    "lead_id" TEXT,
    "company_id" TEXT,
    "contact_id" TEXT,
    "staff_id" TEXT,
    "activity_type" "SalesActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_tasks" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "opportunity_id" TEXT,
    "lead_id" TEXT,
    "assigned_staff_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_at" TIMESTAMP(3),
    "status" "SalesTaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "SalesTaskPriority" NOT NULL DEFAULT 'NORMAL',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sales_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_demos" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "opportunity_id" TEXT,
    "lead_id" TEXT,
    "staff_id" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "status" "SalesDemoStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sales_demos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "sales_pipelines_business_id_is_default_idx" ON "sales_pipelines"("business_id", "is_default");
CREATE UNIQUE INDEX "sales_pipeline_stages_pipeline_id_slug_key" ON "sales_pipeline_stages"("pipeline_id", "slug");
CREATE INDEX "sales_companies_business_id_deleted_at_idx" ON "sales_companies"("business_id", "deleted_at");
CREATE INDEX "sales_contacts_business_id_deleted_at_idx" ON "sales_contacts"("business_id", "deleted_at");
CREATE UNIQUE INDEX "sales_leads_converted_opportunity_id_key" ON "sales_leads"("converted_opportunity_id");
CREATE INDEX "sales_leads_business_id_status_idx" ON "sales_leads"("business_id", "status");
CREATE INDEX "sales_opportunities_business_id_stage_id_idx" ON "sales_opportunities"("business_id", "stage_id");
CREATE INDEX "sales_activities_business_id_created_at_idx" ON "sales_activities"("business_id", "created_at");
CREATE INDEX "sales_tasks_business_id_status_idx" ON "sales_tasks"("business_id", "status");
CREATE INDEX "sales_demos_business_id_scheduled_at_idx" ON "sales_demos"("business_id", "scheduled_at");

-- Foreign keys
ALTER TABLE "sales_pipelines" ADD CONSTRAINT "sales_pipelines_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_pipeline_stages" ADD CONSTRAINT "sales_pipeline_stages_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "sales_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_companies" ADD CONSTRAINT "sales_companies_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_contacts" ADD CONSTRAINT "sales_contacts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_contacts" ADD CONSTRAINT "sales_contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "sales_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "sales_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "sales_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_leads" ADD CONSTRAINT "sales_leads_converted_opportunity_id_fkey" FOREIGN KEY ("converted_opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "sales_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "sales_pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "sales_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "sales_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_opportunity_catalogue_links" ADD CONSTRAINT "sales_opportunity_catalogue_links_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_opportunity_catalogue_links" ADD CONSTRAINT "sales_opportunity_catalogue_links_product_version_id_fkey" FOREIGN KEY ("product_version_id") REFERENCES "commercial_product_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_opportunity_catalogue_links" ADD CONSTRAINT "sales_opportunity_catalogue_links_bundle_version_id_fkey" FOREIGN KEY ("bundle_version_id") REFERENCES "commercial_bundle_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "sales_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "sales_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "sales_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_tasks" ADD CONSTRAINT "sales_tasks_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_tasks" ADD CONSTRAINT "sales_tasks_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_tasks" ADD CONSTRAINT "sales_tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "sales_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_tasks" ADD CONSTRAINT "sales_tasks_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_demos" ADD CONSTRAINT "sales_demos_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_demos" ADD CONSTRAINT "sales_demos_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_demos" ADD CONSTRAINT "sales_demos_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "sales_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_demos" ADD CONSTRAINT "sales_demos_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_audit_logs" ADD CONSTRAINT "sales_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_audit_logs" ADD CONSTRAINT "sales_audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
