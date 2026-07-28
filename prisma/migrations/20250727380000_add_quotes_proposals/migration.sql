-- Quotes & Proposals permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'quotes.view', 'View Quotes', 'View quotes and proposals', 'quotes', NOW(), NOW()),
  (gen_random_uuid(), 'quotes.create', 'Create Quotes', 'Create new quotes', 'quotes', NOW(), NOW()),
  (gen_random_uuid(), 'quotes.edit', 'Edit Quotes', 'Edit quotes and create revisions', 'quotes', NOW(), NOW()),
  (gen_random_uuid(), 'quotes.send', 'Send Quotes', 'Send quotes and proposals to clients', 'quotes', NOW(), NOW()),
  (gen_random_uuid(), 'quotes.approve', 'Approve Quotes', 'Approve or reject quote approvals', 'quotes', NOW(), NOW()),
  (gen_random_uuid(), 'quotes.accept', 'Accept Quotes', 'Record client quote and proposal acceptance', 'quotes', NOW(), NOW()),
  (gen_random_uuid(), 'proposals.manage', 'Manage Proposals', 'Manage proposal templates and generation', 'quotes', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- Enums
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');
CREATE TYPE "QuoteLineType" AS ENUM ('PRODUCT', 'BUNDLE', 'IMPLEMENTATION_PACKAGE', 'MANAGED_SERVICE', 'PROFESSIONAL_SERVICE', 'CUSTOM');
CREATE TYPE "QuoteBillingCycle" AS ENUM ('ONE_TIME', 'MONTHLY', 'ANNUAL');
CREATE TYPE "QuoteApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED');
CREATE TYPE "ProposalAcceptanceStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- Tables
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "quote_number" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "current_version_id" TEXT,
    "valid_until" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "sent_to_email" TEXT,
    "delivery_token" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quote_versions" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "subtotal_pence" INTEGER NOT NULL,
    "discount_pence" INTEGER NOT NULL DEFAULT 0,
    "tax_pence" INTEGER NOT NULL DEFAULT 0,
    "recurring_total_pence" INTEGER NOT NULL DEFAULT 0,
    "one_time_total_pence" INTEGER NOT NULL DEFAULT 0,
    "total_pence" INTEGER NOT NULL,
    "tax_rate_bps" INTEGER NOT NULL DEFAULT 2000,
    "created_by_staff_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quote_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quote_line_items" (
    "id" TEXT NOT NULL,
    "quote_version_id" TEXT NOT NULL,
    "line_type" "QuoteLineType" NOT NULL,
    "product_version_id" TEXT,
    "bundle_version_id" TEXT,
    "custom_name" TEXT,
    "custom_description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price_pence" INTEGER NOT NULL,
    "line_discount_pence" INTEGER NOT NULL DEFAULT 0,
    "tax_rate_bps" INTEGER NOT NULL DEFAULT 2000,
    "billing_cycle" "QuoteBillingCycle" NOT NULL DEFAULT 'ONE_TIME',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "quote_line_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quote_approvals" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "status" "QuoteApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requested_by_staff_id" TEXT,
    "reviewed_by_staff_id" TEXT,
    "request_notes" TEXT,
    "review_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    CONSTRAINT "quote_approvals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proposal_templates" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "introduction" TEXT,
    "terms_template" TEXT,
    "footer_template" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "proposal_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "template_id" TEXT,
    "current_version_id" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "delivery_token" TEXT,
    "sent_at" TIMESTAMP(3),
    "sent_to_email" TEXT,
    "prepared_contract_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proposal_versions" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "introduction" TEXT,
    "terms" TEXT,
    "footer" TEXT,
    "quote_version_id" TEXT NOT NULL,
    "quote_snapshot" JSONB,
    "created_by_staff_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "proposal_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proposal_view_history" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "viewer_email" TEXT,
    "viewer_ip" TEXT,
    "user_agent" TEXT,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "proposal_view_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proposal_acceptances" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "status" "ProposalAcceptanceStatus" NOT NULL DEFAULT 'PENDING',
    "accepted_by_name" TEXT,
    "accepted_by_email" TEXT,
    "signature_notes" TEXT,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "proposal_acceptances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quote_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quote_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "quotes_current_version_id_key" ON "quotes"("current_version_id");
CREATE UNIQUE INDEX "quotes_delivery_token_key" ON "quotes"("delivery_token");
CREATE UNIQUE INDEX "quotes_business_id_quote_number_key" ON "quotes"("business_id", "quote_number");
CREATE INDEX "quotes_business_id_status_idx" ON "quotes"("business_id", "status");
CREATE UNIQUE INDEX "quote_versions_quote_id_version_number_key" ON "quote_versions"("quote_id", "version_number");
CREATE INDEX "quote_approvals_quote_id_status_idx" ON "quote_approvals"("quote_id", "status");
CREATE UNIQUE INDEX "proposal_templates_business_id_slug_key" ON "proposal_templates"("business_id", "slug");
CREATE UNIQUE INDEX "proposals_current_version_id_key" ON "proposals"("current_version_id");
CREATE UNIQUE INDEX "proposals_delivery_token_key" ON "proposals"("delivery_token");
CREATE INDEX "proposals_business_id_status_idx" ON "proposals"("business_id", "status");
CREATE UNIQUE INDEX "proposal_versions_proposal_id_version_number_key" ON "proposal_versions"("proposal_id", "version_number");
CREATE INDEX "proposal_view_history_proposal_id_viewed_at_idx" ON "proposal_view_history"("proposal_id", "viewed_at");
CREATE UNIQUE INDEX "proposal_acceptances_proposal_id_key" ON "proposal_acceptances"("proposal_id");

-- Opportunity prepared links
CREATE UNIQUE INDEX "sales_opportunities_prepared_quote_id_key" ON "sales_opportunities"("prepared_quote_id");
CREATE UNIQUE INDEX "sales_opportunities_prepared_proposal_id_key" ON "sales_opportunities"("prepared_proposal_id");

-- Foreign keys
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quote_versions" ADD CONSTRAINT "quote_versions_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quote_versions" ADD CONSTRAINT "quote_versions_created_by_staff_id_fkey" FOREIGN KEY ("created_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quote_version_id_fkey" FOREIGN KEY ("quote_version_id") REFERENCES "quote_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_product_version_id_fkey" FOREIGN KEY ("product_version_id") REFERENCES "commercial_product_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_bundle_version_id_fkey" FOREIGN KEY ("bundle_version_id") REFERENCES "commercial_bundle_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quote_approvals" ADD CONSTRAINT "quote_approvals_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quote_approvals" ADD CONSTRAINT "quote_approvals_requested_by_staff_id_fkey" FOREIGN KEY ("requested_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quote_approvals" ADD CONSTRAINT "quote_approvals_reviewed_by_staff_id_fkey" FOREIGN KEY ("reviewed_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "proposal_templates" ADD CONSTRAINT "proposal_templates_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "proposal_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "proposal_versions" ADD CONSTRAINT "proposal_versions_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proposal_versions" ADD CONSTRAINT "proposal_versions_quote_version_id_fkey" FOREIGN KEY ("quote_version_id") REFERENCES "quote_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proposal_versions" ADD CONSTRAINT "proposal_versions_created_by_staff_id_fkey" FOREIGN KEY ("created_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "proposal_view_history" ADD CONSTRAINT "proposal_view_history_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proposal_acceptances" ADD CONSTRAINT "proposal_acceptances_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quote_audit_logs" ADD CONSTRAINT "quote_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quote_audit_logs" ADD CONSTRAINT "quote_audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "quote_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "proposal_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_prepared_quote_id_fkey" FOREIGN KEY ("prepared_quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_prepared_proposal_id_fkey" FOREIGN KEY ("prepared_proposal_id") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
