import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { BusinessContextError } from "../src/modules/business-context/utils/business-context-errors";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function createStaffUser(email: string, suffix: string) {
  return prisma.user.create({
    data: {
      id: `bc-staff-user-${suffix}`,
      email,
      fullName: "Business Context Staff",
      role: "staff",
    },
  });
}

async function listBusinessesForOwner(ownerId: string) {
  return prisma.business.findMany({
    where: { ownerId },
    orderBy: { createdAt: "asc" },
  });
}

async function getOwnedBusinessById(ownerId: string, businessId: string) {
  return prisma.business.findFirst({
    where: { id: businessId, ownerId },
  });
}

async function assertUserBelongsToBusiness(
  userId: string,
  businessId: string,
  email: string,
): Promise<{ isOwner: boolean }> {
  const owned = await getOwnedBusinessById(userId, businessId);

  if (owned) {
    return { isOwner: true };
  }

  const staff = await prisma.staff.findFirst({
    where: {
      businessId,
      isActive: true,
      OR: [{ userId }, { email: { equals: email, mode: "insensitive" } }],
    },
    select: { id: true },
  });

  if (!staff) {
    throw new BusinessContextError("CROSS_BUSINESS_ACCESS");
  }

  return { isOwner: false };
}

async function assertBranchBelongsToBusiness(businessId: string, branchId: string) {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId },
  });

  if (!branch) {
    throw new BusinessContextError("BRANCH_NOT_FOUND");
  }

  return branch;
}

async function main() {
  const suffix = Date.now().toString();
  const owner = await prisma.user.findFirst({
    where: { role: "owner" },
    select: { id: true, email: true },
  });
  assert(owner?.email, "No owner user found");

  const primaryBusiness = await prisma.business.findFirst({
    where: { ownerId: owner.id, onboardingCompleted: true },
    select: { id: true, businessName: true },
  });
  assert(primaryBusiness, "No onboarded business for owner");

  const branch = await prisma.branch.findFirst({
    where: { businessId: primaryBusiness.id },
    select: { id: true, name: true, businessId: true },
  });
  assert(branch, "No branch found for business");

  console.log("Module structure");
  const moduleFiles = [
    "src/modules/business-context/services/business-context.service.ts",
    "src/modules/business-context/services/business-resolver.service.ts",
    "src/modules/business-context/services/business-context-session.service.ts",
    "src/modules/business-context/middleware/business-context-middleware.ts",
    "src/modules/business-context/components/business-context-provider.tsx",
    "src/modules/business-context/components/business-switcher.tsx",
    "src/modules/business-context/components/branch-switcher.tsx",
    "src/modules/business-context/actions/business-context-actions.ts",
    "src/modules/business-context/index.ts",
  ];
  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Owner with multiple businesses");
  const secondBusiness = await prisma.business.create({
    data: {
      ownerId: owner.id,
      businessName: `Second Business ${suffix}`,
      onboardingCompleted: true,
    },
  });

  const ownerBusinesses = await listBusinessesForOwner(owner.id);
  assert(ownerBusinesses.length >= 2, "owner should have multiple businesses");
  assert(
    ownerBusinesses.some((business) => business.id === secondBusiness.id),
    "second business missing from owner list",
  );
  assert(
    await getOwnedBusinessById(owner.id, secondBusiness.id),
    "owner should access second business",
  );
  console.log("  PASS");

  console.log("Business switching validation");
  assert(
    (await getOwnedBusinessById(owner.id, primaryBusiness.id))?.id === primaryBusiness.id,
    "owner can switch to primary business",
  );
  assert(
    (await getOwnedBusinessById(owner.id, secondBusiness.id))?.id === secondBusiness.id,
    "owner can switch to second business",
  );
  console.log("  PASS");

  console.log("Staff restricted to assigned business");
  const staffEmail = `bc-staff-${suffix}@busal.test`;
  const staffUser = await createStaffUser(staffEmail, suffix);
  const staff = await prisma.staff.create({
    data: {
      businessId: primaryBusiness.id,
      branchId: branch.id,
      userId: staffUser.id,
      firstName: "Context",
      lastName: "Staff",
      email: staffEmail,
      isActive: true,
    },
  });

  const staffAccess = await prisma.staff.findFirst({
    where: { userId: staffUser.id, isActive: true },
    select: { businessId: true },
  });
  assert(staffAccess, "staff record missing");
  assert(staffAccess.businessId === primaryBusiness.id, "staff locked to assigned business");
  assert(
    !(await getOwnedBusinessById(staffUser.id, secondBusiness.id)),
    "staff cannot own another business",
  );
  console.log("  PASS");

  console.log("Cross-business isolation");
  let crossBusinessBlocked = false;
  try {
    await assertUserBelongsToBusiness(staffUser.id, secondBusiness.id, staffEmail);
  } catch (error) {
    crossBusinessBlocked =
      error instanceof BusinessContextError && error.code === "CROSS_BUSINESS_ACCESS";
  }
  assert(crossBusinessBlocked, "cross-business user access should be blocked");

  let staffSwitchBlocked = false;
  try {
    const owned = await getOwnedBusinessById(staffUser.id, secondBusiness.id);
    if (!owned) {
      throw new BusinessContextError("CROSS_BUSINESS_ACCESS");
    }
  } catch (error) {
    staffSwitchBlocked =
      error instanceof BusinessContextError && error.code === "CROSS_BUSINESS_ACCESS";
  }
  assert(staffSwitchBlocked, "staff business switch should be blocked");
  console.log("  PASS");

  console.log("Branch belongs to business");
  const resolvedBranch = await assertBranchBelongsToBusiness(primaryBusiness.id, branch.id);
  assert(resolvedBranch.id === branch.id, "branch resolution failed");

  let invalidBranchBlocked = false;
  try {
    await assertBranchBelongsToBusiness(secondBusiness.id, branch.id);
  } catch (error) {
    invalidBranchBlocked =
      error instanceof BusinessContextError && error.code === "BRANCH_NOT_FOUND";
  }
  assert(invalidBranchBlocked, "branch from another business should fail");
  console.log("  PASS");

  console.log("User belongs to business");
  const ownerMembership = await assertUserBelongsToBusiness(
    owner.id,
    primaryBusiness.id,
    owner.email,
  );
  assert(ownerMembership.isOwner, "owner membership failed");

  const staffMembership = await assertUserBelongsToBusiness(
    staffUser.id,
    primaryBusiness.id,
    staffEmail,
  );
  assert(!staffMembership.isOwner, "staff should not be owner");
  console.log("  PASS");

  console.log("Middleware and guard wiring");
  const guardSource = readFileSync(
    join(root, "src/modules/staff-auth/guards/staff-auth-guard.ts"),
    "utf8",
  );
  const onboardingSource = readFileSync(
    join(root, "src/modules/onboarding/lib/onboarding-guard.ts"),
    "utf8",
  );
  const middlewareSource = readFileSync(
    join(root, "src/modules/business-context/middleware/business-context-middleware.ts"),
    "utf8",
  );
  const authServiceSource = readFileSync(
    join(root, "src/modules/authorization/services/authorization.service.ts"),
    "utf8",
  );
  assert(guardSource.includes("requireBusinessContext"), "staff guard should use business context");
  assert(
    onboardingSource.includes("requireBusinessContext"),
    "dashboard guard should use business context",
  );
  assert(middlewareSource.includes("ACTIVE_BUSINESS_COOKIE"), "business middleware missing cookie");
  assert(
    authServiceSource.includes("resolveActiveBusinessForUser"),
    "authorization should resolve active business",
  );
  console.log("  PASS");

  console.log("Dashboard context wiring");
  const layoutSource = readFileSync(join(root, "src/app/dashboard/layout.tsx"), "utf8");
  const headerSource = readFileSync(join(root, "src/components/layout/header.tsx"), "utf8");
  const businessModuleSource = readFileSync(
    join(root, "src/modules/business/lib/get-business-context.ts"),
    "utf8",
  );
  assert(layoutSource.includes("BusinessContextProvider"), "dashboard layout missing provider");
  assert(headerSource.includes("BusinessSwitcher"), "header missing business switcher");
  assert(headerSource.includes("BranchSwitcher"), "header missing branch switcher");
  assert(
    businessModuleSource.includes("context.business.id"),
    "business module should use active business",
  );
  console.log("  PASS");

  console.log("API and server action context");
  const actionsSource = readFileSync(
    join(root, "src/modules/business-context/actions/business-context-actions.ts"),
    "utf8",
  );
  const serviceSource = readFileSync(
    join(root, "src/modules/business-context/services/business-context.service.ts"),
    "utf8",
  );
  assert(actionsSource.includes("switchBusinessAction"), "switch business action missing");
  assert(actionsSource.includes("switchBranchAction"), "switch branch action missing");
  assert(serviceSource.includes("requireBusinessContextForApi"), "api context resolver missing");
  assert(serviceSource.includes("getActiveBusiness"), "getActiveBusiness missing");
  assert(serviceSource.includes("getActiveBranch"), "getActiveBranch missing");
  assert(serviceSource.includes("switchBusiness"), "switchBusiness missing");
  assert(serviceSource.includes("switchBranch"), "switchBranch missing");
  console.log("  PASS");

  console.log("Logout clears business context");
  const logoutSource = readFileSync(join(root, "src/app/api/auth/logout/route.ts"), "utf8");
  assert(
    logoutSource.includes("clearActiveBusinessContext"),
    "logout should clear business context",
  );
  console.log("  PASS");

  console.log("Cookie writes restricted to actions and route handlers");
  const loginSource = readFileSync(join(root, "src/app/api/auth/login/route.ts"), "utf8");
  const staffAuthSource = readFileSync(
    join(root, "src/modules/staff-auth/services/staff-auth.service.ts"),
    "utf8",
  );
  const resolveContextBlock = serviceSource.slice(
    serviceSource.indexOf("export async function resolveBusinessContextForUser"),
    serviceSource.indexOf("export async function requireBusinessContext"),
  );
  const resolveAccessBlock = staffAuthSource.slice(
    staffAuthSource.indexOf("export async function resolveBusinessAccessForUser"),
    staffAuthSource.indexOf("export async function assertStaffBelongsToBusiness"),
  );
  assert(
    loginSource.includes("persistBusinessContextCookiesForLogin"),
    "login route should persist business context cookies",
  );
  assert(
    !resolveContextBlock.includes("setActiveBusinessCookie"),
    "resolveBusinessContextForUser must not set business cookies during render",
  );
  assert(
    !resolveContextBlock.includes("setActiveBranchCookie"),
    "resolveBusinessContextForUser must not set branch cookies during render",
  );
  assert(
    !resolveAccessBlock.includes("setStaffSessionCookie"),
    "resolveBusinessAccessForUser must not set staff session cookies during render",
  );
  assert(
    !resolveAccessBlock.includes("clearStaffSessionCookie"),
    "resolveBusinessAccessForUser must not clear staff session cookies during render",
  );
  console.log("  PASS");

  console.log("Cleanup");
  await prisma.staff.delete({ where: { id: staff.id } });
  await prisma.user.delete({ where: { id: staffUser.id } });
  await prisma.business.delete({ where: { id: secondBusiness.id } });
  console.log("  PASS");

  console.log("pnpm lint");
  execSync("pnpm lint", { cwd: root, stdio: "inherit" });
  console.log("  PASS");

  console.log("pnpm tsc --noEmit");
  execSync("pnpm tsc --noEmit", { cwd: root, stdio: "inherit" });
  console.log("  PASS");

  console.log("\nAll business context checks passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
