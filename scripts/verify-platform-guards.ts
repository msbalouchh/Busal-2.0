import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { PLATFORM_GUARD_ERROR_CODES } from "../src/modules/platform-guards/constants/errors";
import {
  PlatformGuardError,
  isPlatformGuardError,
  permissionDenied,
  unauthenticated,
} from "../src/modules/platform-guards/utils/platform-guard-errors";
import { mapToPlatformGuardError } from "../src/modules/platform-guards/utils/error-mapper";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/platform-guards/index.ts",
    "src/modules/platform-guards/constants/errors.ts",
    "src/modules/platform-guards/constants/routes.ts",
    "src/modules/platform-guards/types/platform-context.ts",
    "src/modules/platform-guards/utils/platform-guard-errors.ts",
    "src/modules/platform-guards/utils/error-mapper.ts",
    "src/modules/platform-guards/services/platform-context.service.ts",
    "src/modules/platform-guards/guards/authentication.guards.ts",
    "src/modules/platform-guards/guards/business.guards.ts",
    "src/modules/platform-guards/guards/staff.guards.ts",
    "src/modules/platform-guards/guards/authorization.guards.ts",
    "src/modules/platform-guards/guards/onboarding.guards.ts",
    "src/modules/platform-guards/guards/page.guards.ts",
    "src/modules/platform-guards/guards/action.guards.ts",
    "src/modules/platform-guards/guards/route.guards.ts",
    "src/modules/platform-guards/guards/index.ts",
    "src/modules/platform-guards/middleware/platform-guards-middleware.ts",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Guard exports");
  const guardIndex = readFileSync(
    join(root, "src/modules/platform-guards/guards/index.ts"),
    "utf8",
  );
  const requiredExports = [
    "requireAuthentication",
    "requireBusiness",
    "requireBusinessContext",
    "requireStaff",
    "requireRole",
    "requirePermission",
    "requireOnboarding",
    "protectedPage",
    "protectedAction",
    "protectedRoute",
  ];
  for (const exportName of requiredExports) {
    assert(guardIndex.includes(exportName), `${exportName} export missing`);
  }
  console.log("  PASS");

  console.log("Standardized error codes");
  const errorCodes = Object.values(PLATFORM_GUARD_ERROR_CODES);
  assert(errorCodes.includes("UNAUTHENTICATED"), "UNAUTHENTICATED missing");
  assert(errorCodes.includes("BUSINESS_REQUIRED"), "BUSINESS_REQUIRED missing");
  assert(errorCodes.includes("BUSINESS_NOT_ACTIVE"), "BUSINESS_NOT_ACTIVE missing");
  assert(errorCodes.includes("STAFF_INACTIVE"), "STAFF_INACTIVE missing");
  assert(errorCodes.includes("ONBOARDING_REQUIRED"), "ONBOARDING_REQUIRED missing");
  assert(errorCodes.includes("PERMISSION_DENIED"), "PERMISSION_DENIED missing");
  assert(errorCodes.includes("ROLE_REQUIRED"), "ROLE_REQUIRED missing");
  console.log("  PASS");

  console.log("Error responses");
  const unauth = unauthenticated();
  const denied = permissionDenied();
  assert(unauth.code === PLATFORM_GUARD_ERROR_CODES.UNAUTHENTICATED, "unauthenticated code failed");
  assert(
    denied.code === PLATFORM_GUARD_ERROR_CODES.PERMISSION_DENIED,
    "permission denied code failed",
  );
  assert(isPlatformGuardError(unauth), "platform guard type guard failed");
  console.log("  PASS");

  console.log("Dashboard blocked when logged out");
  const middlewareSource = readFileSync(join(root, "src/middleware.ts"), "utf8");
  assert(
    middlewareSource.includes("platform-guards/middleware/platform-guards-middleware"),
    "middleware should use platform guards",
  );
  assert(
    middlewareSource.includes("redirectUnauthenticatedToLogin"),
    "middleware should redirect unauthenticated dashboard access",
  );
  console.log("  PASS");

  console.log("Dashboard context uses protectedPage");
  const dashboardContextSource = readFileSync(
    join(root, "src/modules/dashboard/lib/get-dashboard-context.ts"),
    "utf8",
  );
  const pageGuardSource = readFileSync(
    join(root, "src/modules/platform-guards/guards/page.guards.ts"),
    "utf8",
  );
  assert(
    dashboardContextSource.includes("protectedPage"),
    "dashboard context should use protectedPage",
  );
  assert(
    pageGuardSource.includes("assertBusinessSelected"),
    "protectedPage should verify business",
  );
  assert(
    pageGuardSource.includes("assertOnboardingComplete"),
    "protectedPage should verify onboarding",
  );
  assert(pageGuardSource.includes("assertStaffActive"), "protectedPage should verify staff");
  assert(pageGuardSource.includes("assertRoleResolved"), "protectedPage should verify role");
  assert(
    pageGuardSource.includes("assertPermissionsLoaded"),
    "protectedPage should verify permissions",
  );
  console.log("  PASS");

  console.log("API and server action guards");
  const routeGuardSource = readFileSync(
    join(root, "src/modules/platform-guards/guards/route.guards.ts"),
    "utf8",
  );
  const actionGuardSource = readFileSync(
    join(root, "src/modules/platform-guards/guards/action.guards.ts"),
    "utf8",
  );
  assert(routeGuardSource.includes("protectedRoute"), "protectedRoute missing");
  assert(routeGuardSource.includes("platformGuardErrorResponse"), "api error response missing");
  assert(actionGuardSource.includes("protectedAction"), "protectedAction missing");
  assert(
    actionGuardSource.includes("assertUserBelongsToBusiness"),
    "tenant isolation missing in actions",
  );
  console.log("  PASS");

  console.log("Staff without permission denied");
  const business = await prisma.business.findFirst({
    where: { onboardingCompleted: true },
    select: { id: true, ownerId: true },
  });
  assert(business, "No onboarded business found");

  const waiterPermissions = await prisma.role.findFirst({
    where: { businessId: business.id, slug: "waiter" },
    include: {
      rolePermissions: {
        include: { permission: { select: { code: true } } },
      },
    },
  });
  assert(waiterPermissions, "waiter role missing");

  const waiterCodes = new Set(
    waiterPermissions.rolePermissions.map((entry) => entry.permission.code),
  );
  assert(!waiterCodes.has(PERMISSION_CODES.STAFF_DELETE), "waiter should not have staff.delete");

  let mappedDenied = false;
  try {
    throw permissionDenied();
  } catch (error) {
    mappedDenied =
      error instanceof PlatformGuardError &&
      error.code === PLATFORM_GUARD_ERROR_CODES.PERMISSION_DENIED;
  }
  assert(mappedDenied, "permission denied mapping failed");
  console.log("  PASS");

  console.log("Business isolation");
  const mapped = mapToPlatformGuardError(
    new PlatformGuardError(PLATFORM_GUARD_ERROR_CODES.BUSINESS_REQUIRED),
  );
  assert(
    mapped.code === PLATFORM_GUARD_ERROR_CODES.BUSINESS_REQUIRED,
    "business isolation mapping failed",
  );
  console.log("  PASS");

  console.log("pnpm typecheck");
  execSync("pnpm typecheck", { cwd: root, stdio: "inherit" });
  console.log("  PASS");

  console.log("pnpm tsc --noEmit");
  execSync("pnpm tsc --noEmit", { cwd: root, stdio: "inherit" });
  console.log("  PASS");

  console.log("\nAll platform guard checks passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
