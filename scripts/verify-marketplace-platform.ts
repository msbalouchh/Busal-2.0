import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { MARKETPLACE_PLATFORM_ROUTES } from "../src/modules/marketplace-platform/constants/marketplace-platform";
import { listMarketplaceExtensions } from "../src/modules/marketplace/registry/marketplace-registry";
import { ensureBootstrapMarketplacePlugins } from "../src/modules/marketplace/plugins/bootstrap-marketplace";
import {
  getMarketplacePlatformBundle,
  getMarketplacePlatformCatalogCount,
  queryMarketplaceCatalog,
} from "../src/services/marketplace-platform-module.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
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
  console.log("Marketplace platform module structure");
  const moduleFiles = [
    "src/modules/marketplace-platform/index.ts",
    "src/modules/marketplace-platform/constants/marketplace-platform.ts",
    "src/modules/marketplace-platform/types/marketplace-platform-types.ts",
    "src/modules/marketplace-platform/lib/get-marketplace-platform-context.ts",
    "src/modules/marketplace-platform/actions/marketplace-platform-actions.ts",
    "src/modules/marketplace-platform/components/marketplace-platform-overview.tsx",
    "src/modules/marketplace-platform/components/marketplace-catalog-panel.tsx",
    "src/modules/marketplace-platform/components/marketplace-product-panel.tsx",
    "src/modules/marketplace-platform/components/marketplace-installations-panel.tsx",
    "src/modules/marketplace-platform/components/marketplace-agents-panel.tsx",
    "src/modules/marketplace-platform/components/marketplace-licenses-panel.tsx",
    "src/modules/marketplace-platform/components/marketplace-publisher-panel.tsx",
    "src/modules/marketplace-platform/components/marketplace-analytics-panel.tsx",
    "src/services/marketplace-platform-module.service.ts",
    "src/app/dashboard/marketplace-platform/page.tsx",
    "src/app/dashboard/marketplace-platform/catalog/page.tsx",
    "src/app/dashboard/marketplace-platform/installations/page.tsx",
    "src/app/dashboard/marketplace-platform/agents/page.tsx",
    "src/app/dashboard/marketplace-platform/licenses/page.tsx",
    "src/app/dashboard/marketplace-platform/publisher/page.tsx",
    "src/app/dashboard/marketplace-platform/analytics/page.tsx",
  ];

  for (const file of moduleFiles) {
    read(file);
  }
  console.log("  PASS");

  console.log("Permission-aware guards");
  const contextLoader = read(
    "src/modules/marketplace-platform/lib/get-marketplace-platform-context.ts",
  );
  assert(
    contextLoader.includes("PERMISSION_CODES.MARKETPLACE_VIEW"),
    "MARKETPLACE_VIEW guard missing",
  );
  assert(contextLoader.includes("protectedPage"), "protectedPage missing");
  const actions = read("src/modules/marketplace-platform/actions/marketplace-platform-actions.ts");
  assert(actions.includes("protectedAction"), "protectedAction missing");
  assert(actions.includes("PERMISSION_CODES.MARKETPLACE_INSTALL"), "install action guard missing");
  console.log("  PASS");

  console.log("Extensibility registry");
  ensureBootstrapMarketplacePlugins();
  assert(listMarketplaceExtensions().length > 0, "Marketplace registry empty");
  console.log("  PASS");

  console.log("Dashboard routes");
  for (const route of Object.values(MARKETPLACE_PLATFORM_ROUTES)) {
    assert(route.startsWith("/dashboard"), `Invalid route: ${route}`);
  }
  console.log("  PASS");

  console.log("Live marketplace platform workflow");
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  assert(business, "No business found for verification");

  const platform = await buildPlatformContext(business.id);
  const bundle = await getMarketplacePlatformBundle(platform);

  assert(typeof bundle.permissions.canViewMarketplace === "boolean", "Permission flags missing");
  assert(typeof bundle.widgets.totalItems === "number", "Dashboard widgets missing");
  assert(Array.isArray(bundle.homeSections), "Home sections missing");
  assert(bundle.registeredExtensionCount > 0, "Registry extensions missing");

  const catalog = await queryMarketplaceCatalog({ sort: "featured", page: 1 });
  assert(catalog.total >= 0, "Catalog query failed");

  const catalogueCount = await getMarketplacePlatformCatalogCount();
  assert(catalogueCount > 0, "Catalogue items missing");

  console.log("  PASS");
  console.log("\nMarketplace platform verification passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
