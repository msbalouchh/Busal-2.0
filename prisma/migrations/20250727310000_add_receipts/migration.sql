-- Receipt engine: receipts, items, print logs, audit logs, and permissions

CREATE TYPE "ReceiptTemplateType" AS ENUM ('CUSTOMER', 'KITCHEN');
CREATE TYPE "ReceiptPrintStatus" AS ENUM ('PENDING', 'PRINTED', 'FAILED');
CREATE TYPE "ReceiptPaperSize" AS ENUM ('A4', 'THERMAL_80MM', 'THERMAL_58MM');
CREATE TYPE "ReceiptAuditAction" AS ENUM ('CREATED', 'VIEWED', 'PRINTED', 'REPRINTED');

CREATE TABLE "receipt_sequences" (
    "business_id" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "receipt_sequences_pkey" PRIMARY KEY ("business_id")
);

CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "created_by_staff_id" TEXT,
    "business_name" TEXT NOT NULL,
    "business_address" TEXT,
    "business_phone" TEXT,
    "business_email" TEXT,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "order_number" TEXT NOT NULL,
    "table_name" TEXT,
    "staff_name" TEXT,
    "payment_method" "PaymentMethod" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "locale" TEXT NOT NULL DEFAULT 'en-GB',
    "subtotal_pence" INTEGER NOT NULL,
    "discount_pence" INTEGER NOT NULL DEFAULT 0,
    "tax_pence" INTEGER NOT NULL DEFAULT 0,
    "total_pence" INTEGER NOT NULL,
    "payment_amount_pence" INTEGER NOT NULL,
    "amount_tendered_pence" INTEGER,
    "change_due_pence" INTEGER NOT NULL DEFAULT 0,
    "print_count" INTEGER NOT NULL DEFAULT 0,
    "last_print_status" "ReceiptPrintStatus",
    "last_printed_at" TIMESTAMP(3),
    "delivery_email" TEXT,
    "delivery_phone" TEXT,
    "qr_code_data" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "receipt_items" (
    "id" TEXT NOT NULL,
    "receipt_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_pence" INTEGER NOT NULL,
    "line_total_pence" INTEGER NOT NULL,
    "discount_pence" INTEGER NOT NULL DEFAULT 0,
    "tax_rate_bps" INTEGER,
    CONSTRAINT "receipt_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "receipt_print_logs" (
    "id" TEXT NOT NULL,
    "receipt_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "template_type" "ReceiptTemplateType" NOT NULL,
    "paper_size" "ReceiptPaperSize" NOT NULL,
    "status" "ReceiptPrintStatus" NOT NULL,
    "is_reprint" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "receipt_print_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "receipt_audit_logs" (
    "id" TEXT NOT NULL,
    "receipt_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "action" "ReceiptAuditAction" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "receipt_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "receipts_payment_id_key" ON "receipts"("payment_id");
CREATE UNIQUE INDEX "receipts_business_id_receipt_number_key" ON "receipts"("business_id", "receipt_number");

ALTER TABLE "receipt_sequences" ADD CONSTRAINT "receipt_sequences_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_created_by_staff_id_fkey" FOREIGN KEY ("created_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "receipt_print_logs" ADD CONSTRAINT "receipt_print_logs_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "receipt_print_logs" ADD CONSTRAINT "receipt_print_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "receipt_print_logs" ADD CONSTRAINT "receipt_print_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "receipt_audit_logs" ADD CONSTRAINT "receipt_audit_logs_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "receipt_audit_logs" ADD CONSTRAINT "receipt_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "receipt_audit_logs" ADD CONSTRAINT "receipt_audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at") VALUES
  (gen_random_uuid(), 'receipt.view', 'View Receipts', 'View receipt history and details', 'receipt', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'receipt.print', 'Print Receipts', 'Print and reprint receipts', 'receipt', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
