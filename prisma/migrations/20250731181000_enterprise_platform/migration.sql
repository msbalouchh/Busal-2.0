-- Busal Enterprise Identity & Organization Platform

CREATE TYPE "PlatformEnterpriseOrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE "PlatformEnterpriseIdentityProviderType" AS ENUM (
    'SAML',
    'OIDC',
    'LDAP',
    'AZURE_AD',
    'GOOGLE',
    'OKTA',
    'AUTH0',
    'CUSTOM'
);
CREATE TYPE "PlatformEnterpriseProviderStatus" AS ENUM ('ACTIVE', 'DISABLED', 'PENDING');
CREATE TYPE "PlatformEnterprisePolicyCategory" AS ENUM (
    'SECURITY',
    'ACCESS',
    'SESSION',
    'PASSWORD',
    'DEVICE',
    'COMPLIANCE'
);

CREATE TABLE "platform_enterprise_organizations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT NOT NULL DEFAULT '',
    "status" "PlatformEnterpriseOrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_enterprise_organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_enterprise_organization_units" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'department',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_enterprise_organization_units_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_enterprise_identity_providers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider_type" "PlatformEnterpriseIdentityProviderType" NOT NULL,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "status" "PlatformEnterpriseProviderStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_enterprise_identity_providers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_enterprise_policies" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PlatformEnterprisePolicyCategory" NOT NULL,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_enterprise_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_enterprise_audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL DEFAULT '',
    "entity_id" TEXT,
    "message" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_enterprise_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_enterprise_organizations_tenant_id_slug_key" ON "platform_enterprise_organizations"("tenant_id", "slug");
CREATE INDEX "platform_enterprise_organizations_tenant_id_status_idx" ON "platform_enterprise_organizations"("tenant_id", "status");
CREATE INDEX "platform_enterprise_organization_units_organization_id_parent_id_idx" ON "platform_enterprise_organization_units"("organization_id", "parent_id");
CREATE INDEX "platform_enterprise_identity_providers_organization_id_status_idx" ON "platform_enterprise_identity_providers"("organization_id", "status");
CREATE INDEX "platform_enterprise_policies_organization_id_category_enabled_idx" ON "platform_enterprise_policies"("organization_id", "category", "enabled");
CREATE INDEX "platform_enterprise_audit_logs_tenant_id_created_at_idx" ON "platform_enterprise_audit_logs"("tenant_id", "created_at");
CREATE INDEX "platform_enterprise_audit_logs_organization_id_created_at_idx" ON "platform_enterprise_audit_logs"("organization_id", "created_at");

ALTER TABLE "platform_enterprise_organizations" ADD CONSTRAINT "platform_enterprise_organizations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_enterprise_organization_units" ADD CONSTRAINT "platform_enterprise_organization_units_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "platform_enterprise_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_enterprise_organization_units" ADD CONSTRAINT "platform_enterprise_organization_units_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "platform_enterprise_organization_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform_enterprise_identity_providers" ADD CONSTRAINT "platform_enterprise_identity_providers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "platform_enterprise_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_enterprise_policies" ADD CONSTRAINT "platform_enterprise_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "platform_enterprise_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_enterprise_audit_logs" ADD CONSTRAINT "platform_enterprise_audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_enterprise_audit_logs" ADD CONSTRAINT "platform_enterprise_audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "platform_enterprise_organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
