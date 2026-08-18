-- Phase 27: Customer AI Business Operating System

ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "ai_avatar_url" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "ai_greeting" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "ai_tone" TEXT;

ALTER TABLE "ai_conversations" ADD COLUMN IF NOT EXISTS "customer_id" TEXT;
ALTER TABLE "ai_conversations" ADD COLUMN IF NOT EXISTS "channel" TEXT DEFAULT 'website';
ALTER TABLE "ai_conversations" ADD COLUMN IF NOT EXISTS "audience_type" TEXT NOT NULL DEFAULT 'STAFF';
ALTER TABLE "ai_conversations" ADD COLUMN IF NOT EXISTS "escalated_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "ai_conversations_business_id_customer_id_idx"
  ON "ai_conversations"("business_id", "customer_id");
CREATE INDEX IF NOT EXISTS "ai_conversations_business_id_audience_type_updated_at_idx"
  ON "ai_conversations"("business_id", "audience_type", "updated_at");

DO $$ BEGIN
  ALTER TABLE "ai_conversations"
    ADD CONSTRAINT "ai_conversations_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "customer_ai_sessions" (
  "id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "customer_id" TEXT,
  "session_token" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'website',
  "verified_email" TEXT,
  "verified_phone" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_ai_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_ai_sessions_session_token_key"
  ON "customer_ai_sessions"("session_token");
CREATE INDEX IF NOT EXISTS "customer_ai_sessions_business_id_expires_at_idx"
  ON "customer_ai_sessions"("business_id", "expires_at");
CREATE INDEX IF NOT EXISTS "customer_ai_sessions_business_id_customer_id_idx"
  ON "customer_ai_sessions"("business_id", "customer_id");

DO $$ BEGIN
  ALTER TABLE "customer_ai_sessions"
    ADD CONSTRAINT "customer_ai_sessions_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "customer_ai_sessions"
    ADD CONSTRAINT "customer_ai_sessions_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "customer_ai_events" (
  "id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "conversation_id" TEXT,
  "event_type" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'website',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_ai_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "customer_ai_events_business_id_event_type_created_at_idx"
  ON "customer_ai_events"("business_id", "event_type", "created_at");
CREATE INDEX IF NOT EXISTS "customer_ai_events_business_id_created_at_idx"
  ON "customer_ai_events"("business_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "customer_ai_events"
    ADD CONSTRAINT "customer_ai_events_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "customer_ai_events"
    ADD CONSTRAINT "customer_ai_events_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
