-- AI Voice Agent

CREATE TYPE "VoiceSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "VoiceCommandStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

CREATE TABLE "ai_voice_sessions" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "customer_id" TEXT,
    "conversation_id" TEXT,
    "status" "VoiceSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "language" TEXT NOT NULL DEFAULT 'en',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_voice_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_voice_commands" (
    "id" TEXT NOT NULL,
    "voice_session_id" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "intent" TEXT,
    "confidence_score" DOUBLE PRECISION,
    "action" TEXT,
    "status" "VoiceCommandStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_voice_commands_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_voice_sessions_business_id_status_started_at_idx" ON "ai_voice_sessions"("business_id", "status", "started_at");
CREATE INDEX "ai_voice_sessions_business_id_staff_id_idx" ON "ai_voice_sessions"("business_id", "staff_id");
CREATE INDEX "ai_voice_sessions_business_id_conversation_id_idx" ON "ai_voice_sessions"("business_id", "conversation_id");
CREATE INDEX "ai_voice_commands_voice_session_id_created_at_idx" ON "ai_voice_commands"("voice_session_id", "created_at");
CREATE INDEX "ai_voice_commands_voice_session_id_status_idx" ON "ai_voice_commands"("voice_session_id", "status");

ALTER TABLE "ai_voice_sessions" ADD CONSTRAINT "ai_voice_sessions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_voice_sessions" ADD CONSTRAINT "ai_voice_sessions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_voice_sessions" ADD CONSTRAINT "ai_voice_sessions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_voice_sessions" ADD CONSTRAINT "ai_voice_sessions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_voice_commands" ADD CONSTRAINT "ai_voice_commands_voice_session_id_fkey" FOREIGN KEY ("voice_session_id") REFERENCES "ai_voice_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
