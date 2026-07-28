import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import {
  getUserPermissions,
  hasPermission,
  listAllPermissionCodes,
} from "../src/modules/authorization/services/authorization.service";
import {
  assertStaffBelongsToBusiness,
  authenticateStaffAccount,
  buildStaffSessionData,
  determineLoginAccountType,
  isStaffAccount,
} from "../src/modules/staff-auth/services/staff-auth.service";
import { StaffAuthError } from "../src/modules/staff-auth/utils/staff-auth-errors";
import { ACCOUNT_TYPES } from "../src/modules/staff-auth/constants/session";
import { ensureSystemRoles } from "../src/services/staff-management.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function createStaffUser(email: string, suffix: string, fullName: string) {
  return prisma.user.create({
    data: {
      id: `staff-user-${suffix}-${email.split("@")[0]}`,
      email,
      fullName,
      role: "staff",
    },
  });
}

async function assignStaffRole(staffId: string, businessId: string, roleSlug: string) {
  const role = await prisma.role.findFirst({
    where: { businessId, slug: roleSlug },
    select: { id: true },
  });
  assert(role, `Role ${roleSlug} not found`);

  await prisma.staffRole.deleteMany({ where: { staffId } });
  await prisma.staffRole.create({
    data: { staffId, roleId: role.id },
  });
}

async function createLinkedStaff(options: {
  businessId: string;
  branchId?: string | null;
  roleSlug: string;
  email: string;
  suffix: string;
  isActive?: boolean;
}) {
  const user = await createStaffUser(options.email, options.suffix, options.roleSlug);
  const staff = await prisma.staff.create({
    data: {
      businessId: options.businessId,
      branchId: options.branchId ?? null,
      userId: user.id,
      firstName: options.roleSlug,
      lastName: "Tester",
      email: options.email,
      isActive: options.isActive ?? true,
    },
    include: {
      business: {
        select: {
          id: true,
          businessName: true,
          onboardingCompleted: true,
          ownerId: true,
        },
      },
      branch: { select: { id: true, name: true } },
      staffRoles: {
        include: {
          role: {
            select: { id: true, slug: true, name: true },
          },
        },
      },
    },
  });

  await assignStaffRole(staff.id, options.businessId, options.roleSlug);

  const refreshed = await prisma.staff.findUnique({
    where: { id: staff.id },
    include: {
      business: {
        select: {
          id: true,
          businessName: true,
          onboardingCompleted: true,
          ownerId: true,
        },
      },
      branch: { select: { id: true, name: true } },
      staffRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: { select: { code: true } } },
              },
            },
          },
        },
      },
    },
  });

  assert(refreshed, "staff refresh failed");
  return { user, staff: refreshed };
}

async function main() {
  const suffix = Date.now().toString();
  const business = await prisma.business.findFirst({
    where: { onboardingCompleted: true },
    select: { id: true, ownerId: true },
  });
  assert(business, "No onboarded business found");

  await ensureSystemRoles(business.id);

  const branch = await prisma.branch.findFirst({
    where: { businessId: business.id },
    select: { id: true },
  });

  console.log("Owner login");
  const ownerPermissions = await getUserPermissions(business.ownerId, business.id);
  const allCodes = await listAllPermissionCodes();
  assert(ownerPermissions.length === allCodes.length, "owner permissions failed");
  const ownerLogin = await determineLoginAccountType(business.ownerId, "owner@example.com");
  assert(ownerLogin.accountType === ACCOUNT_TYPES.OWNER, "owner account type failed");
  console.log("  PASS");

  const roleChecks = [
    {
      label: "Manager login",
      roleSlug: "manager",
      email: `manager-${suffix}@busal.test`,
      assertPermission: PERMISSION_CODES.STAFF_VIEW,
    },
    {
      label: "Cashier login",
      roleSlug: "cashier",
      email: `cashier-${suffix}@busal.test`,
      assertPermission: PERMISSION_CODES.POS_USE,
    },
    {
      label: "Chef login",
      roleSlug: "chef",
      email: `chef-${suffix}@busal.test`,
      assertPermission: PERMISSION_CODES.KITCHEN_UPDATE,
    },
    {
      label: "Waiter login",
      roleSlug: "waiter",
      email: `waiter-${suffix}@busal.test`,
      assertPermission: PERMISSION_CODES.ORDER_CREATE,
    },
  ];

  const createdStaffIds: string[] = [];
  const createdUserIds: string[] = [];

  for (const roleCheck of roleChecks) {
    console.log(roleCheck.label);
    const linked = await createLinkedStaff({
      businessId: business.id,
      branchId: branch?.id ?? null,
      roleSlug: roleCheck.roleSlug,
      email: roleCheck.email,
      suffix,
    });
    createdStaffIds.push(linked.staff.id);
    createdUserIds.push(linked.user.id);

    const session = await authenticateStaffAccount(linked.user.id, linked.user.email);
    assert(session.roleSlug === roleCheck.roleSlug, `${roleCheck.roleSlug} role failed`);
    assert(session.businessId === business.id, `${roleCheck.roleSlug} business failed`);
    assert(session.branchId === (branch?.id ?? null), `${roleCheck.roleSlug} branch failed`);
    assert(
      hasPermission(session.permissions, roleCheck.assertPermission),
      `${roleCheck.roleSlug} permission failed`,
    );
    assert(session.permissions.length > 0, `${roleCheck.roleSlug} permissions empty`);
    console.log("  PASS");
  }

  console.log("Invalid credentials");
  let invalidBlocked = false;
  try {
    await authenticateStaffAccount(`missing-${suffix}`, `missing-${suffix}@busal.test`);
  } catch (error) {
    invalidBlocked = error instanceof StaffAuthError && error.code === "STAFF_NOT_FOUND";
  }
  assert(invalidBlocked, "invalid credentials should fail");
  console.log("  PASS");

  console.log("Disabled staff");
  const disabled = await createLinkedStaff({
    businessId: business.id,
    roleSlug: "waiter",
    email: `disabled-${suffix}@busal.test`,
    suffix,
    isActive: false,
  });
  createdStaffIds.push(disabled.staff.id);
  createdUserIds.push(disabled.user.id);

  let disabledBlocked = false;
  try {
    await authenticateStaffAccount(disabled.user.id, disabled.user.email);
  } catch (error) {
    disabledBlocked = error instanceof StaffAuthError && error.code === "STAFF_INACTIVE";
  }
  assert(disabledBlocked, "disabled staff should fail");
  console.log("  PASS");

  console.log("Wrong business");
  const otherSuffix = `${suffix}-other`;
  const otherUser = await prisma.user.create({
    data: {
      id: `other-owner-${otherSuffix}`,
      email: `other-owner-${otherSuffix}@busal.test`,
      fullName: "Other Owner",
      role: "owner",
    },
  });
  const otherBusiness = await prisma.business.create({
    data: {
      ownerId: otherUser.id,
      businessName: "Other Business",
      onboardingCompleted: true,
    },
  });

  let wrongBusinessBlocked = false;
  try {
    await assertStaffBelongsToBusiness(createdStaffIds[0]!, otherBusiness.id);
  } catch (error) {
    wrongBusinessBlocked = error instanceof StaffAuthError && error.code === "WRONG_BUSINESS";
  }
  assert(wrongBusinessBlocked, "wrong business should fail");
  console.log("  PASS");

  console.log("Permission loading");
  const managerStaff = await prisma.staff.findUnique({
    where: { id: createdStaffIds[0] },
    include: {
      business: {
        select: {
          id: true,
          businessName: true,
          onboardingCompleted: true,
          ownerId: true,
        },
      },
      branch: { select: { id: true, name: true } },
      staffRoles: {
        include: {
          role: {
            select: { id: true, slug: true, name: true },
          },
        },
      },
    },
  });
  assert(managerStaff, "manager staff missing");
  const managerUser = await prisma.user.findUnique({ where: { id: createdUserIds[0] } });
  assert(managerUser, "manager user missing");
  const loaded = await buildStaffSessionData(managerStaff, managerUser.id);
  assert(loaded.permissions.length > 0, "permission loading failed");
  console.log("  PASS");

  console.log("Logout");
  const logoutSource = readFileSync(join(root, "src/app/api/auth/logout/route.ts"), "utf8");
  assert(logoutSource.includes("clearStaffSession"), "logout should clear staff session");
  assert(logoutSource.includes("signOut"), "logout should sign out supabase session");
  console.log("  PASS");

  console.log("Middleware and guards");
  const middlewareSource = readFileSync(join(root, "src/middleware.ts"), "utf8");
  const guardSource = readFileSync(
    join(root, "src/modules/staff-auth/guards/staff-auth-guard.ts"),
    "utf8",
  );
  assert(middlewareSource.includes("PROTECTED_ROUTES"), "middleware missing protected routes");
  assert(guardSource.includes("ensureStaffDashboardAccess"), "staff dashboard guard missing");
  assert(guardSource.includes("protectStaffApiRoute"), "staff api guard missing");
  console.log("  PASS");

  console.log("Staff account detection");
  const waiterUser = await prisma.user.findUnique({ where: { id: createdUserIds[3] } });
  assert(waiterUser, "waiter user missing");
  assert(await isStaffAccount(waiterUser.id, waiterUser.email), "staff account detection failed");
  console.log("  PASS");

  console.log("Cleanup");
  await prisma.staffRole.deleteMany({ where: { staffId: { in: createdStaffIds } } });
  await prisma.staff.deleteMany({ where: { id: { in: createdStaffIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.business.delete({ where: { id: otherBusiness.id } });
  await prisma.user.delete({ where: { id: otherUser.id } });
  console.log("  PASS");

  console.log("\nAll staff authentication checks passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
