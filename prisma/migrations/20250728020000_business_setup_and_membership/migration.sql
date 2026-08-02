-- Business setup, membership, and user profile extensions

CREATE TYPE "BusinessMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');
CREATE TYPE "BusinessMemberStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;

ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "business_code" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "industry" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'GBP';
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "business_email" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "business_setup_completed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "business_setup_step" INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS "businesses_business_code_key" ON "businesses"("business_code");

CREATE TABLE IF NOT EXISTS "business_members" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "BusinessMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "BusinessMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "business_members_business_id_user_id_key" ON "business_members"("business_id", "user_id");
CREATE INDEX IF NOT EXISTS "business_members_user_id_status_idx" ON "business_members"("user_id", "status");

ALTER TABLE "business_members" ADD CONSTRAINT "business_members_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "business_code_sequences" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "last_value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "business_code_sequences_pkey" PRIMARY KEY ("id")
);

INSERT INTO "business_code_sequences" ("id", "last_value")
VALUES (1, 0)
ON CONFLICT ("id") DO NOTHING;
