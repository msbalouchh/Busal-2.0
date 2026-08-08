import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { RESTAURANT_OPERATIONS_ROUTES } from "../src/modules/restaurant-operations/constants/restaurant-operations";
import {
  getRestaurantOperationsBundle,
  listRestaurantOrdersForVerification,
  listRestaurantReservationsForVerification,
  queryOrderQueue,
} from "../src/services/restaurant-operations-module.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import { mapProfileToAuthUser } from "../src/services/user.service";
import { ensureVerificationTenantContext } from "./lib/verify-oms-order";
import { getVerifyPrisma } from "./lib/verify-prisma";

const prisma = getVerifyPrisma();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
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
  const { branchId } = await ensureVerificationTenantContext(prisma, businessId);

  return {
    user,
    business,
    branch: null,
    branchId,
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
  console.log("Restaurant operations module structure");
  const moduleFiles = [
    "src/modules/restaurant-operations/index.ts",
    "src/modules/restaurant-operations/constants/restaurant-operations.ts",
    "src/modules/restaurant-operations/types/restaurant-operations-types.ts",
    "src/modules/restaurant-operations/lib/get-restaurant-operations-context.ts",
    "src/modules/restaurant-operations/actions/restaurant-operations-actions.ts",
    "src/modules/restaurant-operations/components/restaurant-overview.tsx",
    "src/modules/restaurant-operations/components/restaurant-orders-panel.tsx",
    "src/modules/restaurant-operations/components/restaurant-tables-panel.tsx",
    "src/modules/restaurant-operations/components/restaurant-reservations-panel.tsx",
    "src/services/restaurant-operations-module.service.ts",
    "src/app/dashboard/restaurant/page.tsx",
    "src/app/dashboard/restaurant/menu/page.tsx",
    "src/app/dashboard/restaurant/orders/page.tsx",
    "src/app/dashboard/restaurant/kitchen/page.tsx",
  ];

  for (const file of moduleFiles) {
    read(file);
  }
  console.log("  PASS");

  console.log("Permission-aware guards");
  const contextLoader = read(
    "src/modules/restaurant-operations/lib/get-restaurant-operations-context.ts",
  );
  assert(contextLoader.includes("PERMISSION_CODES.MENU_VIEW"), "MENU_VIEW guard missing");
  assert(contextLoader.includes("PERMISSION_CODES.ORDER_VIEW"), "ORDER_VIEW guard missing");
  const actions = read(
    "src/modules/restaurant-operations/actions/restaurant-operations-actions.ts",
  );
  assert(actions.includes("protectedAction"), "protectedAction missing");
  assert(actions.includes("PERMISSION_CODES.ORDER_CANCEL"), "ORDER_CANCEL action missing");
  console.log("  PASS");

  console.log("Dashboard routes");
  for (const route of Object.values(RESTAURANT_OPERATIONS_ROUTES)) {
    assert(route.startsWith("/dashboard/restaurant"), `Invalid route: ${route}`);
  }
  console.log("  PASS");

  console.log("Live restaurant operations workflow");
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  assert(business, "No business found for verification");

  const platform = await buildPlatformContext(business.id);
  const bundle = await getRestaurantOperationsBundle(platform);

  assert(typeof bundle.permissions.canViewOrders === "boolean", "Permission flags missing");
  assert(typeof bundle.widgets.activeOrders === "number", "Dashboard widgets missing");

  const orderCount = await listRestaurantOrdersForVerification(platform);
  assert(orderCount >= 0, "Order listing failed");

  const reservationCount = await listRestaurantReservationsForVerification(platform);
  assert(reservationCount >= 0, "Reservation listing failed");

  const queue = await queryOrderQueue(platform, { page: 1, pageSize: 5 });
  assert(Array.isArray(queue.items), "Order queue missing");

  console.log("  PASS");

  console.log("\nRestaurant operations verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
