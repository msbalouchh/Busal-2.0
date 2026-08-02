import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { CONTROL_CENTER_MARKETPLACE_ROUTES } from "../src/modules/control-center/marketplace/constants/control-center-marketplace";
import {
  buildControlCenterOperatorContext,
  isControlCenterOperatorEmail,
} from "../src/modules/control-center/lib/resolve-control-center-authorization";
import {
  getControlCenterMarketplaceManagementBundle,
  getControlCenterMarketplaceItemDetail,
  queryControlCenterCatalog,
  queryControlCenterLicenses,
  queryControlCenterPublishers,
} from "../src/services/control-center-marketplace.service";
import { mapProfileToAuthUser } from "../src/services/user.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

async function main() {
  console.log("Control center marketplace module structure");
  const moduleFiles = [
    "src/modules/control-center/marketplace/index.ts",
    "src/modules/control-center/marketplace/types/control-center-marketplace-types.ts",
    "src/modules/control-center/marketplace/constants/control-center-marketplace.ts",
    "src/modules/control-center/marketplace/lib/get-control-center-marketplace-context.ts",
    "src/modules/control-center/marketplace/lib/marketplace-admin-utils.ts",
    "src/modules/control-center/marketplace/actions/control-center-marketplace-actions.ts",
    "src/modules/control-center/marketplace/components/control-center-marketplace-hub.tsx",
    "src/modules/control-center/marketplace/components/marketplace-status-badge.tsx",
    "src/services/control-center-marketplace.service.ts",
    "src/app/control-center/(shell)/marketplace/page.tsx",
  ];

  for (const file of moduleFiles) {
    read(file);
  }
  console.log("  PASS");

  console.log("Permission-aware guards");
  const contextLoader = read(
    "src/modules/control-center/marketplace/lib/get-control-center-marketplace-context.ts",
  );
  assert(contextLoader.includes("CONTROL_CENTER_MARKETPLACE"), "marketplace guard missing");
  const actions = read(
    "src/modules/control-center/marketplace/actions/control-center-marketplace-actions.ts",
  );
  assert(actions.includes("protectedControlCenterAction"), "protectedControlCenterAction missing");
  assert(actions.includes("CONTROL_CENTER_MARKETPLACE"), "marketplace action guard missing");
  console.log("  PASS");

  console.log("Granular marketplace permissions");
  const permissions = read("src/modules/authorization/constants/permissions.ts");
  assert(
    permissions.includes("CONTROL_CENTER_MARKETPLACE_PUBLISHERS"),
    "publisher permission missing",
  );
  assert(permissions.includes("CONTROL_CENTER_MARKETPLACE_REVIEWS"), "review permission missing");
  assert(permissions.includes("CONTROL_CENTER_MARKETPLACE_LICENSES"), "license permission missing");
  assert(
    permissions.includes("CONTROL_CENTER_MARKETPLACE_MODERATION"),
    "moderation permission missing",
  );
  assert(
    permissions.includes("CONTROL_CENTER_MARKETPLACE_ANALYTICS"),
    "analytics permission missing",
  );
  console.log("  PASS");

  console.log("Marketplace dashboard UI");
  const hub = read(
    "src/modules/control-center/marketplace/components/control-center-marketplace-hub.tsx",
  );
  assert(hub.includes("PlatformStatCard"), "dashboard widgets missing");
  assert(hub.includes("Catalog Management"), "catalog management missing");
  assert(hub.includes("Package Review"), "package review missing");
  assert(hub.includes("Publisher Management"), "publisher management missing");
  assert(hub.includes("License Management"), "license management missing");
  assert(hub.includes("Marketplace Analytics"), "analytics missing");
  assert(hub.includes("AI Agent Marketplace"), "ai agent marketplace missing");
  assert(hub.includes("Moderation"), "moderation missing");
  assert(hub.includes("Drawer"), "detail drawers missing");
  assert(hub.includes("MarketplaceStatusBadge"), "status badges missing");
  assert(hub.includes("TenantConfirmDialog"), "confirmation dialogs missing");
  console.log("  PASS");

  console.log("Marketplace routes");
  assert(
    CONTROL_CENTER_MARKETPLACE_ROUTES.overview.startsWith("/control-center/marketplace"),
    "Invalid route",
  );
  console.log("  PASS");

  console.log("Live control center marketplace workflow");
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
    include: { owner: true },
  });
  assert(business?.owner, "No business owner found for verification");

  const user = mapProfileToAuthUser(business.owner.id, business.owner.email, business.owner, {});
  const operator = buildControlCenterOperatorContext(user);

  if (!isControlCenterOperatorEmail(user.email)) {
    console.log("  SKIP (non-operator email in non-production verification environment)");
  } else {
    const bundle = await getControlCenterMarketplaceManagementBundle(operator);
    assert(bundle.permissions.canViewMarketplace, "View marketplace permission missing");
    assert(typeof bundle.widgets.totalApps === "number", "Total apps widget missing");
    assert(Array.isArray(bundle.catalog.items), "Catalog missing");
    assert(Array.isArray(bundle.publishers.items), "Publishers missing");
    assert(Array.isArray(bundle.licenses.items), "Licenses missing");
    assert(Array.isArray(bundle.analytics.downloadTrends), "Analytics missing");

    const catalog = await queryControlCenterCatalog({ page: 1, pageSize: 5 });
    assert(typeof catalog.total === "number", "Catalog total missing");

    const publishers = await queryControlCenterPublishers({ page: 1, pageSize: 5 });
    assert(typeof publishers.total === "number", "Publisher total missing");

    const licenses = await queryControlCenterLicenses({ page: 1, pageSize: 5 });
    assert(typeof licenses.summary.active === "number", "License summary missing");

    const item = await prisma.marketplaceItem.findFirst({ select: { id: true } });
    if (item) {
      const detail = await getControlCenterMarketplaceItemDetail(item.id);
      assert(detail.item.id === item.id, "Item detail missing");
    }

    console.log("  PASS");
  }

  console.log("\nControl center marketplace verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
