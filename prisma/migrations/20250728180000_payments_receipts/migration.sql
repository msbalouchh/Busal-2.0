-- Order Payments & Receipts (Restaurant Order Management)

CREATE TYPE "OrderPaymentMethod" AS ENUM (
  'CASH',
  'CARD',
  'CONTACTLESS',
  'APPLE_PAY',
  'GOOGLE_PAY',
  'BANK_TRANSFER',
  'GIFT_CARD',
  'STORE_CREDIT',
  'OTHER'
);

CREATE TYPE "OrderPaymentStatus" AS ENUM (
  'PENDING',
  'PARTIALLY_PAID',
  'PAID',
  'FAILED',
  'REFUNDED',
  'VOIDED'
);

CREATE TYPE "PaymentTransactionType" AS ENUM (
  'SALE',
  'REFUND',
  'VOID',
  'TIP'
);

CREATE TABLE "order_payments" (
  "id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "branch_id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "payment_number" TEXT NOT NULL,
  "payment_method" "OrderPaymentMethod" NOT NULL,
  "payment_provider" TEXT,
  "status" "OrderPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "subtotal" DECIMAL(10,2) NOT NULL,
  "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "service_charge" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "tip_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "amount_paid" DECIMAL(10,2) NOT NULL,
  "change_given" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "exchange_rate" DECIMAL(12,6),
  "transaction_reference" TEXT,
  "gateway_reference" TEXT,
  "processed_by_staff_id" TEXT,
  "paid_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "order_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_payment_transactions" (
  "id" TEXT NOT NULL,
  "payment_id" TEXT NOT NULL,
  "transaction_type" "PaymentTransactionType" NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "status" "OrderPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "reference" TEXT,
  "provider_response" JSONB,
  "processed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "order_payment_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_receipt_sequences" (
  "business_id" TEXT NOT NULL,
  "last_number" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "order_receipt_sequences_pkey" PRIMARY KEY ("business_id")
);

CREATE TABLE "order_receipts" (
  "id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "payment_id" TEXT NOT NULL,
  "receipt_number" TEXT NOT NULL,
  "receipt_url" TEXT,
  "printed_count" INTEGER NOT NULL DEFAULT 0,
  "emailed_at" TIMESTAMP(3),
  "sms_sent_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "order_receipts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "order_payments_business_id_payment_number_key" ON "order_payments"("business_id", "payment_number");
CREATE INDEX "order_payments_business_id_branch_id_status_idx" ON "order_payments"("business_id", "branch_id", "status");
CREATE INDEX "order_payments_order_id_status_idx" ON "order_payments"("order_id", "status");
CREATE INDEX "order_payments_transaction_reference_idx" ON "order_payments"("transaction_reference");
CREATE INDEX "order_payment_transactions_payment_id_transaction_type_idx" ON "order_payment_transactions"("payment_id", "transaction_type");
CREATE UNIQUE INDEX "order_receipts_payment_id_key" ON "order_receipts"("payment_id");
CREATE UNIQUE INDEX "order_receipts_business_id_receipt_number_key" ON "order_receipts"("business_id", "receipt_number");

ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "restaurant_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_processed_by_staff_id_fkey" FOREIGN KEY ("processed_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_payment_transactions" ADD CONSTRAINT "order_payment_transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "order_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_receipt_sequences" ADD CONSTRAINT "order_receipt_sequences_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_receipts" ADD CONSTRAINT "order_receipts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_receipts" ADD CONSTRAINT "order_receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "order_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
