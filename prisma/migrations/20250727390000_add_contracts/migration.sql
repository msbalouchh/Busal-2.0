-- Contracts permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'contracts.view', 'View Contracts', 'View contracts and activation records', 'contracts', NOW(), NOW()),
  (gen_random_uuid(), 'contracts.create', 'Create Contracts', 'Generate and create contracts', 'contracts', NOW(), NOW()),
  (gen_random_uuid(), 'contracts.edit', 'Edit Contracts', 'Edit contracts, signatures, and documents', 'contracts', NOW(), NOW()),
  (gen_random_uuid(), 'contracts.approve', 'Approve Contracts', 'Approve or reject contract approvals', 'contracts', NOW(), NOW()),
  (gen_random_uuid(), 'contracts.activate', 'Activate Contracts', 'Activate contracts and onboard customers', 'contracts', NOW(), NOW()),
  (gen_random_uuid(), 'contracts.archive', 'Archive Contracts', 'Archive completed or expired contracts', 'contracts', NOW(), NOW()),
  (gen_random_uuid(), 'clauses.manage', 'Manage Legal Clauses', 'Manage reusable legal clauses library', 'contracts', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- Enums
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PENDING_SIGNATURE', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'ARCHIVED');
CREATE TYPE "ContractApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ContractSignatureStatus" AS ENUM ('PENDING', 'SIGNED', 'DECLINED');
CREATE TYPE "ContractSignatureProvider" AS ENUM ('MANUAL', 'DOCUSIGN', 'ADOBE_SIGN', 'HELLOSIGN');
CREATE TYPE "ContractSignatureParty" AS ENUM ('INTERNAL', 'CUSTOMER', 'WITNESS');
CREATE TYPE "ImplementationProjectStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');
CREATE TYPE "ContractRenewalStatus" AS ENUM ('SCHEDULED', 'RENEWED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "ActivatedProductStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- Tables
CREATE TABLE "contract_types" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contract_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "legal_clauses" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "legal_clauses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "contract_type_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "contract_number" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "current_version_id" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "renewal_date" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_versions" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "commercial_snapshot" JSONB,
    "subtotal_pence" INTEGER NOT NULL,
    "discount_pence" INTEGER NOT NULL DEFAULT 0,
    "tax_pence" INTEGER NOT NULL DEFAULT 0,
    "total_pence" INTEGER NOT NULL,
    "created_by_staff_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contract_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_line_items" (
    "id" TEXT NOT NULL,
    "contract_version_id" TEXT NOT NULL,
    "line_type" "QuoteLineType" NOT NULL,
    "product_version_id" TEXT,
    "bundle_version_id" TEXT,
    "custom_name" TEXT,
    "custom_description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price_pence" INTEGER NOT NULL,
    "billing_cycle" "QuoteBillingCycle" NOT NULL DEFAULT 'ONE_TIME',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "contract_line_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_clauses" (
    "id" TEXT NOT NULL,
    "contract_version_id" TEXT NOT NULL,
    "legal_clause_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "contract_clauses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_approvals" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "status" "ContractApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requested_by_staff_id" TEXT,
    "reviewed_by_staff_id" TEXT,
    "request_notes" TEXT,
    "review_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    CONSTRAINT "contract_approvals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_signatures" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "party" "ContractSignatureParty" NOT NULL,
    "status" "ContractSignatureStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "ContractSignatureProvider" NOT NULL DEFAULT 'MANUAL',
    "external_reference" TEXT,
    "signed_by_name" TEXT,
    "signed_by_email" TEXT,
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contract_signatures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_documents" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "uploaded_by_staff_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contract_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_renewals" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "status" "ContractRenewalStatus" NOT NULL DEFAULT 'SCHEDULED',
    "renewal_date" TIMESTAMP(3) NOT NULL,
    "previous_end_date" TIMESTAMP(3),
    "new_end_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contract_renewals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "implementation_projects" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ImplementationProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "assigned_staff_id" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "implementation_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_activations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "implementation_project_id" TEXT NOT NULL,
    "customer_success_manager_id" TEXT,
    "prepared_first_invoice_id" TEXT,
    "activated_at" TIMESTAMP(3) NOT NULL,
    "activated_by_staff_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_activations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_activated_products" (
    "id" TEXT NOT NULL,
    "activation_id" TEXT NOT NULL,
    "contract_line_item_id" TEXT,
    "line_type" "QuoteLineType" NOT NULL,
    "product_version_id" TEXT,
    "bundle_version_id" TEXT,
    "name" TEXT NOT NULL,
    "status" "ActivatedProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "activated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contract_activated_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contract_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "contract_types_business_id_slug_key" ON "contract_types"("business_id", "slug");
CREATE UNIQUE INDEX "legal_clauses_business_id_slug_key" ON "legal_clauses"("business_id", "slug");
CREATE UNIQUE INDEX "contracts_current_version_id_key" ON "contracts"("current_version_id");
CREATE UNIQUE INDEX "contracts_business_id_contract_number_key" ON "contracts"("business_id", "contract_number");
CREATE INDEX "contracts_business_id_status_idx" ON "contracts"("business_id", "status");
CREATE UNIQUE INDEX "contract_versions_contract_id_version_number_key" ON "contract_versions"("contract_id", "version_number");
CREATE INDEX "contract_approvals_contract_id_status_idx" ON "contract_approvals"("contract_id", "status");
CREATE INDEX "contract_signatures_contract_id_status_idx" ON "contract_signatures"("contract_id", "status");
CREATE INDEX "contract_documents_contract_id_created_at_idx" ON "contract_documents"("contract_id", "created_at");
CREATE INDEX "contract_renewals_contract_id_renewal_date_idx" ON "contract_renewals"("contract_id", "renewal_date");
CREATE UNIQUE INDEX "implementation_projects_contract_id_key" ON "implementation_projects"("contract_id");
CREATE INDEX "implementation_projects_business_id_status_idx" ON "implementation_projects"("business_id", "status");
CREATE UNIQUE INDEX "customer_activations_contract_id_key" ON "customer_activations"("contract_id");
CREATE UNIQUE INDEX "customer_activations_implementation_project_id_key" ON "customer_activations"("implementation_project_id");
CREATE UNIQUE INDEX "sales_opportunities_prepared_contract_id_key" ON "sales_opportunities"("prepared_contract_id");
CREATE UNIQUE INDEX "proposals_prepared_contract_id_key" ON "proposals"("prepared_contract_id");

-- Foreign keys
ALTER TABLE "contract_types" ADD CONSTRAINT "contract_types_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "legal_clauses" ADD CONSTRAINT "legal_clauses_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_contract_type_id_fkey" FOREIGN KEY ("contract_type_id") REFERENCES "contract_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contract_versions" ADD CONSTRAINT "contract_versions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contract_versions" ADD CONSTRAINT "contract_versions_created_by_staff_id_fkey" FOREIGN KEY ("created_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contract_line_items" ADD CONSTRAINT "contract_line_items_contract_version_id_fkey" FOREIGN KEY ("contract_version_id") REFERENCES "contract_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contract_line_items" ADD CONSTRAINT "contract_line_items_product_version_id_fkey" FOREIGN KEY ("product_version_id") REFERENCES "commercial_product_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contract_line_items" ADD CONSTRAINT "contract_line_items_bundle_version_id_fkey" FOREIGN KEY ("bundle_version_id") REFERENCES "commercial_bundle_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contract_clauses" ADD CONSTRAINT "contract_clauses_contract_version_id_fkey" FOREIGN KEY ("contract_version_id") REFERENCES "contract_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contract_clauses" ADD CONSTRAINT "contract_clauses_legal_clause_id_fkey" FOREIGN KEY ("legal_clause_id") REFERENCES "legal_clauses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contract_approvals" ADD CONSTRAINT "contract_approvals_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contract_approvals" ADD CONSTRAINT "contract_approvals_requested_by_staff_id_fkey" FOREIGN KEY ("requested_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contract_approvals" ADD CONSTRAINT "contract_approvals_reviewed_by_staff_id_fkey" FOREIGN KEY ("reviewed_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contract_documents" ADD CONSTRAINT "contract_documents_uploaded_by_staff_id_fkey" FOREIGN KEY ("uploaded_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contract_renewals" ADD CONSTRAINT "contract_renewals_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "implementation_projects" ADD CONSTRAINT "implementation_projects_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "implementation_projects" ADD CONSTRAINT "implementation_projects_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "implementation_projects" ADD CONSTRAINT "implementation_projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "implementation_projects" ADD CONSTRAINT "implementation_projects_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_activations" ADD CONSTRAINT "customer_activations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_activations" ADD CONSTRAINT "customer_activations_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_activations" ADD CONSTRAINT "customer_activations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_activations" ADD CONSTRAINT "customer_activations_implementation_project_id_fkey" FOREIGN KEY ("implementation_project_id") REFERENCES "implementation_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_activations" ADD CONSTRAINT "customer_activations_customer_success_manager_id_fkey" FOREIGN KEY ("customer_success_manager_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contract_activated_products" ADD CONSTRAINT "contract_activated_products_activation_id_fkey" FOREIGN KEY ("activation_id") REFERENCES "customer_activations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contract_activated_products" ADD CONSTRAINT "contract_activated_products_contract_line_item_id_fkey" FOREIGN KEY ("contract_line_item_id") REFERENCES "contract_line_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contract_activated_products" ADD CONSTRAINT "contract_activated_products_product_version_id_fkey" FOREIGN KEY ("product_version_id") REFERENCES "commercial_product_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contract_activated_products" ADD CONSTRAINT "contract_activated_products_bundle_version_id_fkey" FOREIGN KEY ("bundle_version_id") REFERENCES "commercial_bundle_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contract_audit_logs" ADD CONSTRAINT "contract_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contract_audit_logs" ADD CONSTRAINT "contract_audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "contract_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_prepared_contract_id_fkey" FOREIGN KEY ("prepared_contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_prepared_contract_id_fkey" FOREIGN KEY ("prepared_contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
