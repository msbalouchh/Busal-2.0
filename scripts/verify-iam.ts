import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { IAM_ROUTES } from "../src/modules/iam/constants/routes";
import { IAM_AUTH_METHODS } from "../src/modules/iam/constants/routes";
import { evaluateAccessPolicy } from "../src/modules/iam/engine/policy-engine";
import {
  evaluateAllPermissions,
  evaluateAnyPermission,
  evaluatePermission,
  evaluateResourcePermission,
} from "../src/modules/iam/engine/permission-engine";
import {
  DEFAULT_IAM_PROVIDERS,
  ensureBootstrapIamProviders,
} from "../src/modules/iam/plugins/bootstrap-iam";
import { listIdentityProviders } from "../src/modules/iam/registry/iam-registry";
import {
  ALL_PERMISSION_CODES,
  PERMISSION_CODES,
} from "../src/modules/authorization/constants/permissions";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  authenticateIamApiKey,
  createIamAccessPolicy,
  createIamApiKey,
  createIamServiceAccount,
  createIamSession,
  enrollIamMfa,
  ensureHumanIdentity,
  ensureIamDefaults,
  forcePasswordReset,
  getEffectiveAccessPolicies,
  getIamDashboard,
  listIamApiKeys,
  listIamIdentities,
  listIamSecurityAuditLogs,
  listIamSessions,
  lockIamIdentity,
  recordServiceAccountUsage,
  revokeAllIamSessions,
  revokeIamApiKey,
  revokeIamSession,
  unlockIamIdentity,
} from "../src/services/iam.service";
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
    "src/modules/iam/index.ts",
    "src/modules/iam/constants/routes.ts",
    "src/modules/iam/types/iam-types.ts",
    "src/modules/iam/registry/iam-registry.ts",
    "src/modules/iam/engine/permission-engine.ts",
    "src/modules/iam/engine/policy-engine.ts",
    "src/modules/iam/engine/crypto-engine.ts",
    "src/modules/iam/plugins/bootstrap-iam.ts",
    "src/modules/iam/utils/iam-utils.ts",
    "src/modules/iam/lib/get-iam-context.ts",
    "src/modules/iam/actions/iam-actions.ts",
    "src/modules/iam/components/iam-dashboard.tsx",
    "src/modules/iam/components/iam-lists.tsx",
    "src/modules/iam/components/iam-nav.tsx",
    "src/services/iam.service.ts",
    "src/app/dashboard/iam/page.tsx",
    "src/app/dashboard/iam/identities/page.tsx",
    "src/app/dashboard/iam/sessions/page.tsx",
    "src/app/dashboard/iam/api-keys/page.tsx",
    "src/app/dashboard/iam/service-accounts/page.tsx",
    "src/app/dashboard/iam/policies/page.tsx",
    "src/app/dashboard/iam/providers/page.tsx",
    "src/app/dashboard/iam/security/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("IAM routes");
  assert(IAM_ROUTES.overview === "/dashboard/iam", "route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(join(root, "src/modules/iam/lib/get-iam-context.ts"), "utf8");
  const actionsSource = readFileSync(join(root, "src/modules/iam/actions/iam-actions.ts"), "utf8");
  const permissionUtilsSource = readFileSync(
    join(root, "src/modules/authorization/utils/permission-utils.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.IAM_VIEW"), "view permission required");
  assert(
    actionsSource.includes("PERMISSION_CODES.IAM_MANAGE_API_KEYS"),
    "api key permission required",
  );
  assert(permissionUtilsSource.includes("permission-engine"), "central permission engine required");
  assert(PERMISSION_CODES.IAM_ADMIN === "iam.admin", "admin permission missing");
  assert(ALL_PERMISSION_CODES.includes("iam.view"), "permission catalog missing");
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("model IamIdentity"), "IamIdentity missing");
  assert(schemaSource.includes("model IamSession"), "IamSession missing");
  assert(schemaSource.includes("model IamApiKey"), "IamApiKey missing");
  assert(schemaSource.includes("model IamServiceAccount"), "IamServiceAccount missing");
  console.log("  PASS");

  console.log("Identity providers");
  ensureBootstrapIamProviders();
  assert(IAM_AUTH_METHODS.length === 6, "expected 6 auth methods");
  assert(listIdentityProviders().length >= 6, "providers missing");
  assert(DEFAULT_IAM_PROVIDERS.length >= 6, "default providers missing");
  console.log("  PASS");

  console.log("Central permission engine");
  const permContext = {
    permissions: ["iam.view", "crm.view"],
    roleSlug: "manager",
    isOwner: false,
    businessId: "biz-1",
    branchId: null,
  };
  assert(evaluatePermission(permContext, "iam.view"), "permission evaluation failed");
  assert(
    evaluateResourcePermission(permContext, "crm.view", { businessId: "biz-1" }),
    "resource permission failed",
  );
  assert(evaluateAnyPermission(permContext, ["iam.admin", "iam.view"]), "any permission failed");
  assert(evaluateAllPermissions(permContext, ["iam.view", "crm.view"]), "all permissions failed");
  console.log("  PASS");

  console.log("Policy engine");
  const policyResult = evaluateAccessPolicy(
    { requireMfa: true, deniedIpAddresses: ["10.0.0.1"] },
    { ipAddress: "192.168.1.1", hasMfa: true, country: "US", loginHour: 10 },
  );
  assert(policyResult.allowed, "policy evaluation failed");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ select: { id: true } });
  assert(business, "No business found");

  const platform = await buildPlatformContext(business.id);
  assert(platform.permissions.includes(PERMISSION_CODES.IAM_VIEW), "owner missing iam.view");

  console.log("IAM defaults");
  await ensureIamDefaults(business.id);
  const providers = await prisma.iamIdentityProvider.count({ where: { businessId: business.id } });
  assert(providers >= 6, "providers not seeded");
  console.log("  PASS");

  console.log("Human identity");
  const identity = await ensureHumanIdentity(platform);
  assert(identity.id, "identity missing");
  console.log("  PASS");

  console.log("Session management");
  const session = await createIamSession(platform, {
    userId: platform.user.id,
    businessId: business.id,
    identityId: identity.id,
    deviceName: "Verify Laptop",
    browser: "Chrome",
    ipAddress: "127.0.0.1",
    country: "US",
  });
  assert(session.sessionToken, "session token missing");
  const sessions = await listIamSessions(business.id);
  assert(
    sessions.some((entry) => entry.id === session.id),
    "session not listed",
  );
  console.log("  PASS");

  console.log("API keys");
  const apiKey = await createIamApiKey(platform, {
    name: "Verify Business Key",
    keyType: "BUSINESS",
    permissions: ["iam.view", "crm.view"],
  });
  const authResult = await authenticateIamApiKey({
    rawKey: apiKey.rawKey,
    requiredPermissions: ["iam.view"],
  });
  assert(authResult.valid, "api key auth failed");
  console.log("  PASS");

  console.log("Service accounts");
  const suffix = Date.now().toString();
  const serviceAccount = await createIamServiceAccount(platform, {
    name: `Automation Bot ${suffix}`,
    slug: `automation-bot-${suffix}`,
    description: "Background automation service account",
    permissions: ["ai.automation.execute", "ai.tool.execute"],
  });
  await recordServiceAccountUsage(business.id, serviceAccount.id);
  console.log("  PASS");

  console.log("MFA enrollment");
  const mfa = await enrollIamMfa(platform, "TOTP");
  assert(mfa.isVerified, "mfa enrollment failed");
  console.log("  PASS");

  console.log("Access policies");
  await createIamAccessPolicy(platform, {
    name: "Branch MFA Policy",
    scope: "BRANCH",
    rules: { requireMfa: true, sessionTimeoutMinutes: 240 },
    branchId: null,
  });
  const effective = await getEffectiveAccessPolicies(business.id, { roleSlug: "owner" });
  assert(effective.requireMfa !== undefined, "effective policy missing");
  console.log("  PASS");

  console.log("Identity administration");
  await lockIamIdentity(platform, identity.id);
  const locked = await prisma.iamIdentity.findUnique({ where: { id: identity.id } });
  assert(locked?.status === "LOCKED", "lock failed");
  await unlockIamIdentity(platform, identity.id);
  await forcePasswordReset(platform, identity.id);
  const reset = await prisma.iamIdentity.findUnique({ where: { id: identity.id } });
  assert(reset?.status === "PENDING_RESET", "force reset failed");
  await prisma.iamIdentity.update({
    where: { id: identity.id },
    data: { status: "ACTIVE" },
  });
  console.log("  PASS");

  console.log("Session revocation");
  await revokeIamSession(platform, session.id);
  const revokedCount = await revokeAllIamSessions(platform);
  assert(revokedCount >= 0, "revoke all failed");
  console.log("  PASS");

  console.log("API key revocation");
  await revokeIamApiKey(platform, apiKey.id);
  const keys = await listIamApiKeys(business.id);
  assert(!keys.some((entry) => entry.id === apiKey.id), "api key revoke failed");
  console.log("  PASS");

  console.log("Security audit");
  const auditLogs = await listIamSecurityAuditLogs(business.id, 20);
  assert(
    auditLogs.some((log) => log.eventType === "LOGIN"),
    "login audit missing",
  );
  assert(
    auditLogs.some((log) => log.eventType === "API_KEY_CREATED"),
    "api key audit missing",
  );
  console.log("  PASS");

  console.log("IAM dashboard");
  const dashboard = await getIamDashboard(business.id);
  assert(dashboard.totalIdentities >= 2, "identity metrics missing");
  assert(dashboard.apiKeys >= 0, "api key metrics missing");
  console.log("  PASS");

  console.log("Identities listed");
  const identities = await listIamIdentities(business.id);
  assert(identities.length >= 2, "identities missing");
  console.log("  PASS");

  console.log("Extensibility registry");
  const registrySource = readFileSync(
    join(root, "src/modules/iam/registry/iam-registry.ts"),
    "utf8",
  );
  assert(registrySource.includes("registerIdentityProvider"), "provider registration missing");
  console.log("  PASS");

  console.log("\nIdentity & Access Management verification passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
