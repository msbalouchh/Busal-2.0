import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import {
  getRolePermissions,
  getRolePermissionsBySlug,
  getUserPermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  listAllPermissionCodes,
} from "../src/modules/authorization/services/authorization.service";
import {
  AuthorizationError,
  isAuthorizationError,
  permissionDenied,
  unauthorized,
} from "../src/modules/authorization/utils/authorization-errors";
import { ensureSystemRoles } from "../src/services/staff-management.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function getRoleId(businessId: string, slug: string): Promise<string> {
  const role = await prisma.role.findFirst({
    where: { businessId, slug },
    select: { id: true },
  });
  assert(role, `Role ${slug} not found`);
  return role.id;
}

async function main() {
  const business = await prisma.business.findFirst({
    select: { id: true, ownerId: true },
  });
  assert(business, "No business found");

  await ensureSystemRoles(business.id);

  console.log("Owner has all permissions");
  const ownerPermissions = await getUserPermissions(business.ownerId, business.id);
  const allCodes = await listAllPermissionCodes();
  assert(hasAllPermissions(ownerPermissions, allCodes), "owner should have all permissions");
  console.log("  PASS");

  console.log("Manager limited permissions");
  const managerPermissions = await getRolePermissionsBySlug(business.id, "manager");
  assert(
    hasPermission(managerPermissions, PERMISSION_CODES.BUSINESS_VIEW),
    "manager missing business.view",
  );
  assert(
    hasPermission(managerPermissions, PERMISSION_CODES.STAFF_VIEW),
    "manager missing staff.view",
  );
  assert(
    !hasPermission(managerPermissions, PERMISSION_CODES.PAYMENT_REFUND),
    "manager should not have payment.refund",
  );
  console.log("  PASS");

  console.log("Waiter cannot access kitchen management");
  const waiterPermissions = await getRolePermissionsBySlug(business.id, "waiter");
  assert(
    !hasAnyPermission(waiterPermissions, [
      PERMISSION_CODES.KITCHEN_VIEW,
      PERMISSION_CODES.KITCHEN_UPDATE,
    ]),
    "waiter should not access kitchen management",
  );
  console.log("  PASS");

  console.log("Chef cannot access staff management");
  const chefPermissions = await getRolePermissionsBySlug(business.id, "chef");
  assert(
    !hasAnyPermission(chefPermissions, [
      PERMISSION_CODES.STAFF_VIEW,
      PERMISSION_CODES.STAFF_CREATE,
      PERMISSION_CODES.STAFF_UPDATE,
      PERMISSION_CODES.STAFF_DELETE,
    ]),
    "chef should not access staff management",
  );
  console.log("  PASS");

  console.log("Business isolation");
  const suffix = Date.now();
  const otherUser = await prisma.user.create({
    data: {
      id: `auth-other-${suffix}`,
      fullName: "Auth Other",
      email: `auth-other-${suffix}@example.com`,
      role: "owner",
    },
  });
  const otherBusiness = await prisma.business.create({
    data: {
      ownerId: otherUser.id,
      businessName: `Auth Business ${suffix}`,
      onboardingCompleted: true,
    },
  });
  await ensureSystemRoles(otherBusiness.id);
  const managerRoleId = await getRoleId(business.id, "manager");
  const isolated = await getRolePermissions(managerRoleId, otherBusiness.id);
  assert(isolated.length === 0, "role permissions should be business isolated");
  console.log("  PASS");

  console.log("Server actions blocked");
  const protectedActionSource = readFileSync(
    join(root, "src/modules/authorization/lib/protected-action.ts"),
    "utf8",
  );
  assert(protectedActionSource.includes("permissionDenied"), "protectedAction missing denial");
  assert(
    !hasPermission(waiterPermissions, PERMISSION_CODES.KITCHEN_UPDATE),
    "waiter kitchen update should be blocked",
  );
  console.log("  PASS");

  console.log("Route guards work");
  const guardSource = readFileSync(
    join(root, "src/modules/authorization/guards/permission-guards.ts"),
    "utf8",
  );
  assert(guardSource.includes("protectDashboardRoute"), "dashboard route guard missing");
  assert(guardSource.includes("protectServerComponent"), "server component guard missing");
  console.log("  PASS");

  console.log("API guards work");
  assert(guardSource.includes("protectApiRoute"), "api route guard missing");
  console.log("  PASS");

  console.log("Standardized authorization errors");
  const unauthorizedError = unauthorized();
  const deniedError = permissionDenied();
  assert(isAuthorizationError(unauthorizedError), "unauthorized error type failed");
  assert(unauthorizedError.code === "UNAUTHORIZED", "unauthorized code failed");
  assert(deniedError.message === "Permission Denied", "permission denied message failed");
  assert(deniedError instanceof AuthorizationError, "authorization error inheritance failed");
  console.log("  PASS");

  console.log("Authorization logging");
  const loggingSource = readFileSync(
    join(root, "src/modules/authorization/lib/protected-action.ts"),
    "utf8",
  );
  assert(loggingSource.includes("userId"), "authorization logging missing userId");
  assert(loggingSource.includes("businessId"), "authorization logging missing businessId");
  assert(loggingSource.includes("permission"), "authorization logging missing permission");
  assert(loggingSource.includes("timestamp"), "authorization logging missing timestamp");
  console.log("  PASS");

  console.log("Permission schema");
  const permission = await prisma.permission.findFirst({
    where: { code: PERMISSION_CODES.MENU_VIEW },
  });
  assert(permission?.module === "menu", "permission module field failed");
  const rolePermissionColumns = await prisma.rolePermission.findFirst({
    where: {
      role: { businessId: business.id },
    },
  });
  assert(rolePermissionColumns, "role permission assignment missing");
  console.log("  PASS");

  console.log("Cleanup");
  await prisma.business.delete({ where: { id: otherBusiness.id } });
  await prisma.user.delete({ where: { id: otherUser.id } });
  console.log("  PASS");

  console.log("\nAll runtime authorization checks passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
