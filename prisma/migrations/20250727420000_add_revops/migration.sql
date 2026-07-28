-- RevOps permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'revenue.view', 'View Revenue', 'View revenue dashboards and analytics', 'revenue', NOW(), NOW()),
  (gen_random_uuid(), 'revenue.manage', 'Manage Revenue', 'Manage revenue operations workflows', 'revenue', NOW(), NOW()),
  (gen_random_uuid(), 'invoices.manage', 'Manage Invoices', 'Create, issue, and manage invoices', 'revenue', NOW(), NOW()),
  (gen_random_uuid(), 'payments.manage', 'Manage RevOps Payments', 'Record and track invoice payments', 'revenue', NOW(), NOW()),
  (gen_random_uuid(), 'expenses.manage', 'Manage Expenses', 'Manage revenue-related expenses', 'revenue', NOW(), NOW()),
  (gen_random_uuid(), 'forecasting.view', 'View Forecasting', 'View revenue forecasts and projections', 'revenue', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- Enums
CREATE TYPE "RevenueInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID', 'WRITTEN_OFF');
CREATE TYPE "RevenueInvoiceSourceType" AS ENUM ('CONTRACT', 'IMPLEMENTATION_PROJECT', 'MANAGED_SERVICE', 'PROFESSIONAL_SERVICE', 'MILESTONE');
CREATE TYPE "RevopsPaymentMethod" AS ENUM ('STRIPE', 'GOCARDLESS', 'BANK_TRANSFER', 'PAYPAL', 'MANUAL');
CREATE TYPE "RevopsPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "RevenueRecognitionStatus" AS ENUM ('SCHEDULED', 'RECOGNIZED', 'DEFERRED');
CREATE TYPE "RevenueExpenseCategory" AS ENUM ('DELIVERY', 'SUPPORT', 'INFRASTRUCTURE', 'SALES', 'MARKETING', 'OTHER');
CREATE TYPE "RevenueCollectionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'WRITTEN_OFF');
CREATE TYPE "RevenueForecastSource" AS ENUM ('ACTIVE_CONTRACTS', 'RENEWALS', 'SALES_PIPELINE');

-- Unique prepared invoice per activation
CREATE UNIQUE INDEX "customer_activations_prepared_first_invoice_id_key" ON "customer_activations"("prepared_first_invoice_id");

-- Tables
CREATE TABLE "revenue_invoices" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "status" "RevenueInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "source_type" "RevenueInvoiceSourceType" NOT NULL,
    "customer_id" TEXT,
    "contract_id" TEXT,
    "implementation_project_id" TEXT,
    "milestone_id" TEXT,
    "industry" TEXT,
    "service_type" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "subtotal_pence" INTEGER NOT NULL,
    "tax_pence" INTEGER NOT NULL DEFAULT 0,
    "total_pence" INTEGER NOT NULL,
    "amount_paid_pence" INTEGER NOT NULL DEFAULT 0,
    "issued_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "revenue_invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "revenue_invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price_pence" INTEGER NOT NULL,
    "total_pence" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "revenue_invoice_line_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "revenue_invoice_payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount_pence" INTEGER NOT NULL,
    "payment_method" "RevopsPaymentMethod" NOT NULL,
    "status" "RevopsPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider_reference" TEXT,
    "recorded_by_staff_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "revenue_invoice_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "revenue_recognition_entries" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount_pence" INTEGER NOT NULL,
    "status" "RevenueRecognitionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "recognized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "revenue_recognition_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "revenue_expenses" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "category" "RevenueExpenseCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT NOT NULL,
    "amount_pence" INTEGER NOT NULL,
    "incurred_at" TIMESTAMP(3) NOT NULL,
    "customer_id" TEXT,
    "implementation_project_id" TEXT,
    "industry" TEXT,
    "service_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "revenue_expenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "revenue_forecast_snapshots" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "forecast_month" TIMESTAMP(3) NOT NULL,
    "source" "RevenueForecastSource" NOT NULL,
    "projected_revenue_pence" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revenue_forecast_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "revenue_collection_cases" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "status" "RevenueCollectionStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "next_follow_up_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "revenue_collection_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "revops_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revops_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "revenue_invoices_business_id_invoice_number_key" ON "revenue_invoices"("business_id", "invoice_number");
CREATE INDEX "revenue_invoices_business_id_status_idx" ON "revenue_invoices"("business_id", "status");
CREATE INDEX "revenue_invoices_business_id_source_type_idx" ON "revenue_invoices"("business_id", "source_type");
CREATE INDEX "revenue_invoice_payments_invoice_id_status_idx" ON "revenue_invoice_payments"("invoice_id", "status");
CREATE INDEX "revenue_recognition_entries_invoice_id_status_idx" ON "revenue_recognition_entries"("invoice_id", "status");
CREATE INDEX "revenue_expenses_business_id_incurred_at_idx" ON "revenue_expenses"("business_id", "incurred_at");
CREATE INDEX "revenue_forecast_snapshots_business_id_forecast_month_idx" ON "revenue_forecast_snapshots"("business_id", "forecast_month");
CREATE INDEX "revenue_collection_cases_invoice_id_status_idx" ON "revenue_collection_cases"("invoice_id", "status");

-- Foreign keys
ALTER TABLE "customer_activations" ADD CONSTRAINT "customer_activations_prepared_first_invoice_id_fkey" FOREIGN KEY ("prepared_first_invoice_id") REFERENCES "revenue_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "revenue_invoices" ADD CONSTRAINT "revenue_invoices_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "revenue_invoices" ADD CONSTRAINT "revenue_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "revenue_invoices" ADD CONSTRAINT "revenue_invoices_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "revenue_invoices" ADD CONSTRAINT "revenue_invoices_implementation_project_id_fkey" FOREIGN KEY ("implementation_project_id") REFERENCES "implementation_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "revenue_invoices" ADD CONSTRAINT "revenue_invoices_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "implementation_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "revenue_invoice_line_items" ADD CONSTRAINT "revenue_invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "revenue_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "revenue_invoice_payments" ADD CONSTRAINT "revenue_invoice_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "revenue_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "revenue_invoice_payments" ADD CONSTRAINT "revenue_invoice_payments_recorded_by_staff_id_fkey" FOREIGN KEY ("recorded_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "revenue_recognition_entries" ADD CONSTRAINT "revenue_recognition_entries_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "revenue_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "revenue_expenses" ADD CONSTRAINT "revenue_expenses_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "revenue_forecast_snapshots" ADD CONSTRAINT "revenue_forecast_snapshots_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "revenue_collection_cases" ADD CONSTRAINT "revenue_collection_cases_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "revenue_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "revops_audit_logs" ADD CONSTRAINT "revops_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "revops_audit_logs" ADD CONSTRAINT "revops_audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
