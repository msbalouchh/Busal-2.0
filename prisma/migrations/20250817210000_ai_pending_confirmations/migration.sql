-- CreateTable
CREATE TABLE "customer_ai_pending_confirmations" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "session_id" TEXT,
    "action_id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'website',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_ai_pending_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_ai_pending_confirmations_business_id_action_id_key" ON "customer_ai_pending_confirmations"("business_id", "action_id");

-- CreateIndex
CREATE INDEX "customer_ai_pending_confirmations_business_id_conversation_id_status_idx" ON "customer_ai_pending_confirmations"("business_id", "conversation_id", "status");

-- CreateIndex
CREATE INDEX "customer_ai_pending_confirmations_business_id_expires_at_idx" ON "customer_ai_pending_confirmations"("business_id", "expires_at");

-- AddForeignKey
ALTER TABLE "customer_ai_pending_confirmations" ADD CONSTRAINT "customer_ai_pending_confirmations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
