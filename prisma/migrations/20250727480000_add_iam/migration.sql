-- IAM permissions
INSERT INTO "permissions" ("id", "code", "name", "description", "module", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'iam.view', 'View IAM', 'View identity, sessions, and security dashboard', 'iam', NOW(), NOW()),
  (gen_random_uuid(), 'iam.admin', 'Administer IAM', 'Full IAM platform administration', 'iam', NOW(), NOW()),
  (gen_random_uuid(), 'iam.manage_sessions', 'Manage Sessions', 'View and revoke IAM sessions', 'iam', NOW(), NOW()),
  (gen_random_uuid(), 'iam.manage_api_keys', 'Manage API Keys', 'Create and revoke API keys', 'iam', NOW(), NOW()),
  (gen_random_uuid(), 'iam.manage_service_accounts', 'Manage Service Accounts', 'Create and manage service accounts', 'iam', NOW(), NOW()),
  (gen_random_uuid(), 'iam.manage_policies', 'Manage Access Policies', 'Configure IAM access policies', 'iam', NOW(), NOW()),
  (gen_random_uuid(), 'iam.manage_identities', 'Manage Identities', 'Lock, unlock, and administer identities', 'iam', NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- CreateEnum
CREATE TYPE "IamAuthMethod" AS ENUM ('EMAIL_PASSWORD', 'MAGIC_LINK', 'PASSKEY', 'OAUTH2', 'OIDC', 'SAML');

-- CreateEnum
CREATE TYPE "IamMfaType" AS ENUM ('TOTP', 'EMAIL_OTP', 'SMS_OTP', 'BACKUP_CODE');

-- CreateEnum
CREATE TYPE "IamApiKeyType" AS ENUM ('PERSONAL', 'BUSINESS', 'MARKETPLACE');

-- CreateEnum
CREATE TYPE "IamIdentityType" AS ENUM ('HUMAN', 'AI_AGENT', 'API_CLIENT', 'SERVICE_ACCOUNT', 'INTEGRATION');

-- CreateEnum
CREATE TYPE "IamPolicyScope" AS ENUM ('PLATFORM', 'BUSINESS', 'BRANCH', 'ROLE');

-- CreateEnum
CREATE TYPE "IamAccountStatus" AS ENUM ('ACTIVE', 'LOCKED', 'SUSPENDED', 'PENDING_RESET');

-- CreateEnum
CREATE TYPE "IamAuditEventType" AS ENUM ('LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'MFA_ENABLED', 'MFA_DISABLED', 'MFA_CHALLENGE', 'PASSWORD_CHANGED', 'PASSWORD_RESET', 'PERMISSION_CHANGED', 'API_KEY_USED', 'API_KEY_CREATED', 'API_KEY_REVOKED', 'SERVICE_ACCOUNT_USED', 'SESSION_REVOKED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'SUSPICIOUS_ACTIVITY', 'POLICY_VIOLATION');

-- CreateTable
CREATE TABLE "iam_identities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "business_id" TEXT,
    "branch_id" TEXT,
    "identity_type" "IamIdentityType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "agent_record_id" TEXT,
    "status" "IamAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iam_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iam_identity_providers" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "provider_type" "IamAuthMethod" NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iam_identity_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iam_mfa_enrollments" (
    "id" TEXT NOT NULL,
    "identity_id" TEXT NOT NULL,
    "user_id" TEXT,
    "business_id" TEXT,
    "mfa_type" "IamMfaType" NOT NULL,
    "secret" JSONB,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "backup_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iam_mfa_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iam_sessions" (
    "id" TEXT NOT NULL,
    "identity_id" TEXT,
    "user_id" TEXT,
    "business_id" TEXT,
    "session_token" TEXT NOT NULL,
    "device_name" TEXT,
    "browser" TEXT,
    "ip_address" TEXT,
    "country" TEXT,
    "login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "iam_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iam_api_keys" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "user_id" TEXT,
    "key_type" "IamApiKeyType" NOT NULL,
    "name" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iam_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iam_service_accounts" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "agent_record_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iam_service_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iam_access_policies" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "branch_id" TEXT,
    "role_slug" TEXT,
    "scope" "IamPolicyScope" NOT NULL,
    "name" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iam_access_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iam_security_audit_logs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT,
    "user_id" TEXT,
    "identity_id" TEXT,
    "event_type" "IamAuditEventType" NOT NULL,
    "ip_address" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "iam_security_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "iam_identities_business_id_identity_type_idx" ON "iam_identities"("business_id", "identity_type");

-- CreateIndex
CREATE INDEX "iam_identities_user_id_idx" ON "iam_identities"("user_id");

-- CreateIndex
CREATE INDEX "iam_identity_providers_business_id_is_enabled_idx" ON "iam_identity_providers"("business_id", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "iam_mfa_enrollments_identity_id_mfa_type_key" ON "iam_mfa_enrollments"("identity_id", "mfa_type");

-- CreateIndex
CREATE INDEX "iam_mfa_enrollments_identity_id_mfa_type_idx" ON "iam_mfa_enrollments"("identity_id", "mfa_type");

-- CreateIndex
CREATE UNIQUE INDEX "iam_sessions_session_token_key" ON "iam_sessions"("session_token");

-- CreateIndex
CREATE INDEX "iam_sessions_user_id_is_active_idx" ON "iam_sessions"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "iam_sessions_business_id_is_active_idx" ON "iam_sessions"("business_id", "is_active");

-- CreateIndex
CREATE INDEX "iam_api_keys_business_id_key_type_idx" ON "iam_api_keys"("business_id", "key_type");

-- CreateIndex
CREATE INDEX "iam_api_keys_user_id_idx" ON "iam_api_keys"("user_id");

-- CreateIndex
CREATE INDEX "iam_api_keys_key_prefix_idx" ON "iam_api_keys"("key_prefix");

-- CreateIndex
CREATE UNIQUE INDEX "iam_service_accounts_business_id_slug_key" ON "iam_service_accounts"("business_id", "slug");

-- CreateIndex
CREATE INDEX "iam_service_accounts_business_id_is_active_idx" ON "iam_service_accounts"("business_id", "is_active");

-- CreateIndex
CREATE INDEX "iam_access_policies_business_id_scope_is_active_idx" ON "iam_access_policies"("business_id", "scope", "is_active");

-- CreateIndex
CREATE INDEX "iam_security_audit_logs_business_id_created_at_idx" ON "iam_security_audit_logs"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "iam_security_audit_logs_user_id_event_type_idx" ON "iam_security_audit_logs"("user_id", "event_type");

-- AddForeignKey
ALTER TABLE "iam_identities" ADD CONSTRAINT "iam_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam_identities" ADD CONSTRAINT "iam_identities_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam_mfa_enrollments" ADD CONSTRAINT "iam_mfa_enrollments_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "iam_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam_mfa_enrollments" ADD CONSTRAINT "iam_mfa_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam_mfa_enrollments" ADD CONSTRAINT "iam_mfa_enrollments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam_sessions" ADD CONSTRAINT "iam_sessions_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "iam_identities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam_sessions" ADD CONSTRAINT "iam_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam_sessions" ADD CONSTRAINT "iam_sessions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam_api_keys" ADD CONSTRAINT "iam_api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam_api_keys" ADD CONSTRAINT "iam_api_keys_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam_service_accounts" ADD CONSTRAINT "iam_service_accounts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam_access_policies" ADD CONSTRAINT "iam_access_policies_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam_security_audit_logs" ADD CONSTRAINT "iam_security_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iam_security_audit_logs" ADD CONSTRAINT "iam_security_audit_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
