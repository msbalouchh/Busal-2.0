-- CreateTable
CREATE TABLE "customer_ai_action_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "conversation_id" TEXT,
    "session_id" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'website',
    "tool_id" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "permission_granted" BOOLEAN NOT NULL,
    "confirmation_required" BOOLEAN NOT NULL,
    "confirmation_status" TEXT NOT NULL,
    "execution_status" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "input_summary" TEXT NOT NULL DEFAULT '',
    "output_summary" TEXT NOT NULL DEFAULT '',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_ai_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_ai_action_logs_business_id_created_at_idx" ON "customer_ai_action_logs"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "customer_ai_action_logs_business_id_tool_id_created_at_idx" ON "customer_ai_action_logs"("business_id", "tool_id", "created_at");

-- CreateIndex
CREATE INDEX "customer_ai_action_logs_business_id_conversation_id_idx" ON "customer_ai_action_logs"("business_id", "conversation_id");

-- AddForeignKey
ALTER TABLE "customer_ai_action_logs" ADD CONSTRAINT "customer_ai_action_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
