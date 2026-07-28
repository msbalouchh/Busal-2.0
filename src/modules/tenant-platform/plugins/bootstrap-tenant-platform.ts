import { registerTenantPolicyDefinition } from "@/modules/tenant-platform/registry/policy-registry";
import type { RegisteredTenantPolicyDefinition } from "@/modules/tenant-platform/types/tenant-platform-types";

const DEFAULT_POLICIES: Omit<RegisteredTenantPolicyDefinition, "isActive">[] = [
  {
    policyKey: "isolation.data",
    name: "Data Isolation",
    module: "iam",
    description: "Enforce strict tenant data isolation",
    rules: { enforceBusinessScope: true, crossTenantAccess: false },
  },
  {
    policyKey: "isolation.api",
    name: "API Isolation",
    module: "api-gateway",
    description: "Restrict API access to tenant scope",
    rules: { requireBusinessContext: true, rateLimitPerTenant: true },
  },
  {
    policyKey: "security.password",
    name: "Password Policy",
    module: "iam",
    description: "Tenant password complexity and rotation rules",
    rules: { minLength: 12, requireUppercase: true, requireNumbers: true, rotationDays: 90 },
  },
  {
    policyKey: "security.policy",
    name: "Security Policy",
    module: "iam",
    description: "Tenant security controls and MFA requirements",
    rules: { requireMfa: false, lockoutAttempts: 5, ipAllowlistEnabled: false },
  },
  {
    policyKey: "session.policy",
    name: "Session Policy",
    module: "iam",
    description: "Tenant session timeout and concurrent session limits",
    rules: { idleTimeoutMinutes: 60, maxConcurrentSessions: 5, requireReauthForSensitive: true },
  },
  {
    policyKey: "backup.policy",
    name: "Backup Policy",
    module: "backup-platform",
    description: "Tenant backup schedule and recovery rules",
    rules: { automatedBackups: true, backupFrequencyHours: 24, geoRedundant: false },
  },
  {
    policyKey: "retention.policy",
    name: "Retention Policy",
    module: "backup-platform",
    description: "Tenant data retention and purge rules",
    rules: { retentionDays: 365, purgeArchivedAfterDays: 90, auditRetentionDays: 365 },
  },
  {
    policyKey: "compliance.audit",
    name: "Audit Compliance",
    module: "monitoring",
    description: "Require audit logging for tenant operations",
    rules: { auditAllMutations: true, retentionDays: 365 },
  },
  {
    policyKey: "settings.inheritance",
    name: "Settings Inheritance",
    module: "settings-engine",
    description: "Tenant settings inheritance rules",
    rules: { allowBranchOverride: true, allowUserOverride: false },
  },
  {
    policyKey: "features.flags",
    name: "Feature Flag Scope",
    module: "feature-flags",
    description: "Feature flag evaluation scoped to tenant",
    rules: { tenantScoped: true, defaultOff: false },
  },
  {
    policyKey: "marketplace.licenses",
    name: "Marketplace License Policy",
    module: "marketplace",
    description: "Marketplace license enforcement",
    rules: { enforceLicenseLimit: true, autoRenew: false },
  },
  {
    policyKey: "commercial.subscription",
    name: "Commercial Subscription",
    module: "commercial",
    description: "Commercial platform subscription rules",
    rules: { enforcePlanLimits: true, allowUpgrade: true },
  },
];

let bootstrapped = false;

export function ensureBootstrapTenantPlatform(): void {
  if (bootstrapped) {
    return;
  }

  for (const policy of DEFAULT_POLICIES) {
    registerTenantPolicyDefinition({ ...policy, isActive: true });
  }

  bootstrapped = true;
}

export function resetBootstrapTenantPlatform(): void {
  bootstrapped = false;
}

export function getDefaultPolicyCount(): number {
  return DEFAULT_POLICIES.length;
}

export const DEFAULT_REGISTERED_POLICIES = DEFAULT_POLICIES;
