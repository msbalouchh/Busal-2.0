import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import {
  ALL_PERMISSION_CODES,
  PERMISSION_CODES,
} from "../src/modules/authorization/constants/permissions";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import { TENANT_PLATFORM_ROUTES } from "../src/modules/tenant-platform/constants/routes";
import { buildTenantAnalytics } from "../src/modules/tenant-platform/engine/analytics-engine";
import {
  buildHealthChecks,
  evaluateTenantHealth,
} from "../src/modules/tenant-platform/engine/health-engine";
import {
  assertTenantIsolation,
  validateCrossTenantAccess,
} from "../src/modules/tenant-platform/engine/isolation-engine";
import {
  calculateUsagePercentage,
  countUsageBreaches,
} from "../src/modules/tenant-platform/engine/limits-engine";
import {
  canActivateTenant,
  canArchiveTenant,
  canReactivateTenant,
  canSuspendTenant,
  resolveLifecycleTransition,
} from "../src/modules/tenant-platform/engine/lifecycle-engine";
import {
  formatMaintenanceLabel,
  isMaintenanceActive,
  resolveEffectiveMaintenanceMode,
} from "../src/modules/tenant-platform/engine/maintenance-engine";
import {
  ensureBootstrapTenantPlatform,
  getDefaultPolicyCount,
} from "../src/modules/tenant-platform/plugins/bootstrap-tenant-platform";
import {
  isTenantPolicyRegistered,
  listTenantPolicyDefinitions,
} from "../src/modules/tenant-platform/registry/policy-registry";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  activateTenant,
  archiveTenant,
  assignFeatures,
  assignSubscription,
  createTenant,
  deleteTenant,
  endImpersonation,
  ensureTenantPlatformDefaults,
  getTenantAnalytics,
  getTenantApiPayload,
  getTenantPlatformDashboard,
  listTenantPlatformAuditLogs,
  logTenantDashboardAccess,
  provisionTenantForBusiness,
  reactivateTenant,
  refreshTenantResources,
  registerModuleTenantPolicy,
  runTenantHealthCheck,
  setMaintenanceMode,
  startImpersonation,
  suspendTenant,
  updateResourceLimits,
  updateTenantProfile,
  updateTenantSettings,
} from "../src/services/tenant-platform.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function buildPlatformContext(businessId: string): Promise<BusinessContext> {
  const businessRecord = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true },
  });

  assert(businessRecord?.owner, "Business owner missing");

  const business = await getOwnedBusinessById(businessRecord.ownerId, businessId);
  assert(business, "Business profile missing");

  const user = mapProfileToAuthUser(
    businessRecord.owner.id,
    businessRecord.owner.email,
    businessRecord.owner,
    {},
  );
  const authorization = await resolveAuthorizationContext(user, business);

  return {
    user,
    business,
    branch: null,
    branchId: null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [
      { id: business.id, name: business.businessName ?? "Business", isOnboarded: true },
    ],
    accessibleBranches: [],
  };
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/tenant-platform/index.ts",
    "src/modules/tenant-platform/constants/routes.ts",
    "src/modules/tenant-platform/types/tenant-platform-types.ts",
    "src/modules/tenant-platform/registry/policy-registry.ts",
    "src/modules/tenant-platform/engine/lifecycle-engine.ts",
    "src/modules/tenant-platform/engine/maintenance-engine.ts",
    "src/modules/tenant-platform/engine/health-engine.ts",
    "src/modules/tenant-platform/engine/limits-engine.ts",
    "src/modules/tenant-platform/engine/analytics-engine.ts",
    "src/modules/tenant-platform/engine/isolation-engine.ts",
    "src/modules/tenant-platform/plugins/bootstrap-tenant-platform.ts",
    "src/modules/tenant-platform/utils/tenant-platform-utils.ts",
    "src/modules/tenant-platform/lib/get-tenant-platform-context.ts",
    "src/modules/tenant-platform/actions/tenant-platform-actions.ts",
    "src/modules/tenant-platform/components/tenant-platform-dashboard.tsx",
    "src/modules/tenant-platform/components/tenant-platform-lists.tsx",
    "src/modules/tenant-platform/components/tenant-platform-nav.tsx",
    "src/services/tenant-platform.service.ts",
    "src/app/api/tenant-platform/route.ts",
    "src/app/dashboard/tenant-platform/page.tsx",
    "src/app/dashboard/tenant-platform/lifecycle/page.tsx",
    "src/app/dashboard/tenant-platform/business/page.tsx",
    "src/app/dashboard/tenant-platform/resources/page.tsx",
    "src/app/dashboard/tenant-platform/settings/page.tsx",
    "src/app/dashboard/tenant-platform/health/page.tsx",
    "src/app/dashboard/tenant-platform/security/page.tsx",
    "src/app/dashboard/tenant-platform/analytics/page.tsx",
    "src/app/dashboard/tenant-platform/activity/page.tsx",
    "src/app/dashboard/tenant-platform/audit/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Tenant platform routes");
  assert(
    TENANT_PLATFORM_ROUTES.overview === "/dashboard/tenant-platform",
    "Overview route mismatch",
  );
  assert(TENANT_PLATFORM_ROUTES.audit.includes("audit"), "Audit route missing");
  console.log("  PASS");

  console.log("Permission protected");
  const permissionsSource = readFileSync(
    join(root, "src/modules/authorization/constants/permissions.ts"),
    "utf8",
  );
  assert(permissionsSource.includes("tenant_platform.view"), "tenant_platform.view missing");
  assert(permissionsSource.includes("tenant_platform.admin"), "tenant_platform.admin missing");
  assert(
    ALL_PERMISSION_CODES.includes(PERMISSION_CODES.TENANT_PLATFORM_MANAGE),
    "Permission code missing",
  );
  console.log("  PASS");

  console.log("Schema");
  const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schema.includes("model TenantRecord"), "TenantRecord missing");
  assert(schema.includes("model TenantSettings"), "TenantSettings missing");
  assert(schema.includes("model TenantResourceLimit"), "TenantResourceLimit missing");
  assert(schema.includes("model TenantResourceUsage"), "TenantResourceUsage missing");
  assert(schema.includes("model TenantPolicy"), "TenantPolicy missing");
  assert(schema.includes("model TenantActivityEvent"), "TenantActivityEvent missing");
  assert(schema.includes("model TenantImpersonationSession"), "TenantImpersonationSession missing");
  assert(schema.includes("model TenantPlatformAuditLog"), "TenantPlatformAuditLog missing");
  assert(schema.includes("enum TenantMaintenanceMode"), "TenantMaintenanceMode missing");
  assert(schema.includes("PENDING"), "PENDING lifecycle status missing");
  assert(schema.includes("file_count"), "file_count missing");
  assert(schema.includes("workflow_count"), "workflow_count missing");
  assert(schema.includes("login_activity_count"), "login_activity_count missing");
  assert(schema.includes("module_usage"), "module_usage missing");
  console.log("  PASS");

  console.log("Registry bootstrap");
  ensureBootstrapTenantPlatform();
  const policies = listTenantPolicyDefinitions();
  assert(policies.length === getDefaultPolicyCount(), "Default policies not registered");
  assert(isTenantPolicyRegistered("isolation.data"), "Data isolation policy missing");
  assert(isTenantPolicyRegistered("security.password"), "Password policy missing");
  assert(isTenantPolicyRegistered("security.policy"), "Security policy missing");
  assert(isTenantPolicyRegistered("session.policy"), "Session policy missing");
  assert(isTenantPolicyRegistered("backup.policy"), "Backup policy missing");
  assert(isTenantPolicyRegistered("retention.policy"), "Retention policy missing");
  assert(isTenantPolicyRegistered("features.flags"), "Feature flags policy missing");
  console.log("  PASS");

  console.log("Lifecycle engine");
  assert(canActivateTenant("PENDING"), "Activate check failed");
  assert(canSuspendTenant("ACTIVE"), "Suspend check failed");
  assert(canReactivateTenant("SUSPENDED"), "Reactivate check failed");
  assert(canArchiveTenant("ACTIVE"), "Archive check failed");
  assert(
    resolveLifecycleTransition("activate", "PENDING") === "ACTIVE",
    "Activate transition failed",
  );
  assert(
    resolveLifecycleTransition("suspend", "ACTIVE") === "SUSPENDED",
    "Suspend transition failed",
  );
  console.log("  PASS");

  console.log("Maintenance engine");
  assert(!isMaintenanceActive("NONE"), "None should not be active");
  assert(isMaintenanceActive("READ_ONLY"), "Read only should be active");
  assert(
    resolveEffectiveMaintenanceMode("SCHEDULED", new Date(Date.now() - 60000)) === "FULL_LOCK",
    "Scheduled maintenance resolution failed",
  );
  assert(formatMaintenanceLabel("READ_ONLY") === "Read Only", "Maintenance label failed");
  console.log("  PASS");

  console.log("Health engine");
  assert(
    evaluateTenantHealth({
      lifecycleStatus: "ACTIVE",
      maintenanceMode: "NONE",
      usageBreaches: 0,
    }) === "HEALTHY",
    "Healthy evaluation failed",
  );
  assert(
    evaluateTenantHealth({
      lifecycleStatus: "SUSPENDED",
      maintenanceMode: "NONE",
      usageBreaches: 0,
    }) === "CRITICAL",
    "Suspended health failed",
  );
  assert(
    buildHealthChecks({
      lifecycleStatus: "ACTIVE",
      maintenanceMode: "NONE",
      storageUsagePct: 50,
      apiUsagePct: 30,
    }).length === 4,
    "Health checks failed",
  );
  console.log("  PASS");

  console.log("Limits engine");
  assert(calculateUsagePercentage(50, 100) === 50, "Usage percentage failed");
  assert(countUsageBreaches([{ used: 100, limit: 50 }]) === 1, "Usage breach count failed");
  console.log("  PASS");

  console.log("Isolation engine");
  assert(assertTenantIsolation("biz-1", "biz-1"), "Isolation assertion failed");
  assert(!validateCrossTenantAccess("biz-1", "biz-2").allowed, "Cross tenant should fail");
  console.log("  PASS");

  console.log("Analytics engine");
  const analytics = buildTenantAnalytics({
    activeUsers: 10,
    maxUsers: 50,
    storageUsedBytes: 1000,
    maxStorageBytes: 10000,
    apiCallsThisMonth: 500,
    maxApiCallsPerMonth: 1000,
    aiTokensThisMonth: 100,
    maxAiTokensPerMonth: 1000,
    loginActivityCount: 25,
    fileCount: 12,
    workflowCount: 3,
    moduleUsage: { staff: 10, api: 500 },
    subscriptionStatus: "ACTIVE",
    healthStatus: "HEALTHY",
  });
  assert(analytics.storageUsagePct === 10, "Analytics storage pct failed");
  assert(analytics.loginActivityCount === 25, "Analytics login activity failed");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  assert(business, "No business found");
  const platform = await buildPlatformContext(business.id);

  console.log("Tenant platform defaults");
  await ensureTenantPlatformDefaults(business.id);
  const tenantCount = await prisma.tenantRecord.count({ where: { businessId: business.id } });
  assert(tenantCount === 1, "Tenant record not seeded");
  const policyCount = await prisma.tenantPolicy.count({ where: { businessId: business.id } });
  assert(policyCount >= getDefaultPolicyCount(), "Default policies not seeded");
  console.log("  PASS");

  console.log("Create tenant");
  const created = await createTenant({
    ownerId: business.ownerId,
    businessName: "custom.verify_tenant",
    subscriptionPlan: "professional",
    country: "US",
  });
  assert(created.businessId, "Tenant creation failed");
  const createdRecord = await prisma.tenantRecord.findUnique({
    where: { businessId: created.businessId },
  });
  assert(createdRecord?.lifecycleStatus === "PENDING", "Created tenant should be pending");
  const verifyPlatform = await buildPlatformContext(created.businessId);
  console.log("  PASS");

  console.log("Activate tenant");
  const activated = await activateTenant(verifyPlatform);
  assert(activated.lifecycleStatus === "ACTIVE", "Activate failed");
  console.log("  PASS");

  console.log("Update tenant profile");
  await updateTenantProfile(verifyPlatform, {
    businessName: "Verify Tenant Updated",
    displayName: "Verify Tenant",
    supportEmail: "support@verify.test",
  });
  console.log("  PASS");

  console.log("Assign subscription");
  await assignSubscription(verifyPlatform, {
    subscriptionPlan: "enterprise",
    subscriptionStatus: "ACTIVE",
  });
  console.log("  PASS");

  console.log("Assign features");
  await assignFeatures(verifyPlatform, { features: ["pos", "crm", "ai"] });
  console.log("  PASS");

  console.log("Update resource limits");
  await updateResourceLimits(verifyPlatform, {
    maxUsers: 100,
    maxApiCallsPerMonth: 200000,
  });
  console.log("  PASS");

  console.log("Update tenant settings");
  await updateTenantSettings(verifyPlatform, {
    complianceMode: "gdpr",
    defaultTimezone: "Europe/London",
  });
  console.log("  PASS");

  console.log("Suspend tenant");
  const suspended = await suspendTenant(verifyPlatform);
  assert(suspended.lifecycleStatus === "SUSPENDED", "Suspend failed");
  console.log("  PASS");

  console.log("Reactivate tenant");
  const reactivated = await reactivateTenant(verifyPlatform);
  assert(reactivated.lifecycleStatus === "ACTIVE", "Reactivate failed");
  console.log("  PASS");

  console.log("Maintenance mode");
  await setMaintenanceMode(verifyPlatform, "READ_ONLY");
  await setMaintenanceMode(verifyPlatform, "FULL_LOCK");
  await setMaintenanceMode(verifyPlatform, "SCHEDULED", new Date(Date.now() + 86_400_000));
  await setMaintenanceMode(verifyPlatform, "NONE");
  console.log("  PASS");

  console.log("Refresh tenant resources");
  await refreshTenantResources(verifyPlatform);
  console.log("  PASS");

  console.log("Tenant health check");
  const health = await runTenantHealthCheck(verifyPlatform);
  assert(health.checks.length >= 4, "Health checks missing");
  console.log("  PASS");

  console.log("Tenant analytics");
  const tenantAnalytics = await getTenantAnalytics(verifyPlatform);
  assert(tenantAnalytics.subscriptionStatus === "ACTIVE", "Analytics subscription failed");
  console.log("  PASS");

  console.log("Start impersonation");
  const impersonation = await startImpersonation(verifyPlatform, {
    reason: "Verify impersonation audit trail",
  });
  assert(impersonation.sessionId, "Impersonation start failed");
  console.log("  PASS");

  console.log("End impersonation");
  await endImpersonation(verifyPlatform, impersonation.sessionId);
  console.log("  PASS");

  console.log("Register module tenant policy");
  await registerModuleTenantPolicy(created.businessId, {
    policyKey: "custom.verify_policy",
    name: "Verify Policy",
    module: "verify-module",
    rules: { enforce: true },
    isActive: true,
  });
  assert(isTenantPolicyRegistered("custom.verify_policy"), "Custom policy registration failed");
  console.log("  PASS");

  console.log("Archive tenant");
  const archived = await archiveTenant(verifyPlatform);
  assert(archived.lifecycleStatus === "ARCHIVED", "Archive failed");
  console.log("  PASS");

  console.log("Delete tenant");
  const deleted = await deleteTenant(verifyPlatform);
  assert(deleted.lifecycleStatus === "DELETED", "Delete failed");
  console.log("  PASS");

  console.log("Tenant platform dashboard");
  await runTenantHealthCheck(platform);
  const dashboard = await getTenantPlatformDashboard(business.id);
  assert(dashboard.lifecycleStatus === "ACTIVE", "Dashboard lifecycle failed");
  assert(dashboard.activePolicies >= getDefaultPolicyCount(), "Dashboard policies missing");
  console.log("  PASS");

  console.log("Tenant API payload");
  const apiPayload = await getTenantApiPayload(business.id);
  assert(apiPayload.tenant, "API payload tenant missing");
  assert(apiPayload.settings, "API payload settings missing");
  console.log("  PASS");

  console.log("Dashboard access audit");
  await logTenantDashboardAccess(platform, "overview");
  console.log("  PASS");

  console.log("Auto-provision tenant");
  await provisionTenantForBusiness(business.id);
  const provisionedCount = await prisma.tenantRecord.count({ where: { businessId: business.id } });
  assert(provisionedCount === 1, "Auto-provision failed");
  console.log("  PASS");

  console.log("Audit logs");
  const auditLogs = await listTenantPlatformAuditLogs(business.id);
  assert(
    auditLogs.some((entry) => entry.eventType === "DASHBOARD_ACCESS"),
    "Dashboard access audit missing",
  );
  assert(
    auditLogs.some((entry) => entry.eventType === "HEALTH_CHECK"),
    "Health check audit missing",
  );

  const verifyAuditLogs = await listTenantPlatformAuditLogs(created.businessId);
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "TENANT_CREATED"),
    "Tenant created audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "TENANT_ACTIVATED"),
    "Tenant activated audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "TENANT_SUSPENDED"),
    "Tenant suspended audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "TENANT_REACTIVATED"),
    "Tenant reactivated audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "TENANT_ARCHIVED"),
    "Tenant archived audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "TENANT_DELETED"),
    "Tenant deleted audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "PROFILE_UPDATED"),
    "Profile updated audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "SUBSCRIPTION_ASSIGNED"),
    "Subscription assigned audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "FEATURE_ASSIGNED"),
    "Feature assigned audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "LIMIT_UPDATED"),
    "Limit updated audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "SETTINGS_UPDATED"),
    "Settings updated audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "MAINTENANCE_ENABLED"),
    "Maintenance enabled audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "MAINTENANCE_UPDATED"),
    "Maintenance updated audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "RESOURCE_UPDATED"),
    "Resource updated audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "IMPERSONATION_STARTED"),
    "Impersonation started audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "IMPERSONATION_ENDED"),
    "Impersonation ended audit missing",
  );
  assert(
    verifyAuditLogs.some((entry) => entry.eventType === "ACTIVITY_RECORDED"),
    "Activity recorded audit missing",
  );
  console.log("  PASS");

  console.log("Cleanup verify tenant");
  await prisma.business.delete({ where: { id: created.businessId } });
  console.log("  PASS");

  console.log("\nTenant Administration Platform verification passed.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
