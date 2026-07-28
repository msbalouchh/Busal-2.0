import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_ROUTES,
} from "../src/modules/marketplace/constants/routes";
import { validateMarketplaceCompatibility } from "../src/modules/marketplace/engine/compatibility-engine";
import {
  DEFAULT_MARKETPLACE_CATALOGUE,
  ensureBootstrapMarketplacePlugins,
} from "../src/modules/marketplace/plugins/bootstrap-marketplace";
import { listMarketplaceExtensions } from "../src/modules/marketplace/registry/marketplace-registry";
import {
  ALL_PERMISSION_CODES,
  PERMISSION_CODES,
} from "../src/modules/authorization/constants/permissions";
import type { BusinessContext } from "../src/modules/business-context/types/business-context";
import { resolveAuthorizationContext } from "../src/modules/authorization/services/authorization.service";
import { getOwnedBusinessById } from "../src/services/business-profile.service";
import {
  ensureMarketplaceCatalogue,
  getMarketplaceDashboard,
  getPublisherDashboard,
  installMarketplaceItem,
  listInstalledMarketplaceItems,
  listMarketplaceInstallationHistory,
  listMarketplaceItems,
  publishMarketplaceItemVersion,
  purchaseMarketplaceItem,
  reportMarketplaceIssue,
  rollbackMarketplaceInstallation,
  submitMarketplaceReview,
  uninstallMarketplaceItem,
  updateMarketplaceInstallation,
} from "../src/services/marketplace.service";
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
    "src/modules/marketplace/index.ts",
    "src/modules/marketplace/constants/routes.ts",
    "src/modules/marketplace/types/marketplace-types.ts",
    "src/modules/marketplace/registry/marketplace-registry.ts",
    "src/modules/marketplace/engine/compatibility-engine.ts",
    "src/modules/marketplace/engine/installation-engine.ts",
    "src/modules/marketplace/engine/licensing-engine.ts",
    "src/modules/marketplace/plugins/bootstrap-marketplace.ts",
    "src/modules/marketplace/utils/marketplace-utils.ts",
    "src/modules/marketplace/lib/get-marketplace-context.ts",
    "src/modules/marketplace/actions/marketplace-actions.ts",
    "src/modules/marketplace/components/marketplace-dashboard.tsx",
    "src/modules/marketplace/components/marketplace-lists.tsx",
    "src/modules/marketplace/components/marketplace-nav.tsx",
    "src/services/marketplace.service.ts",
    "src/app/dashboard/marketplace/page.tsx",
    "src/app/dashboard/marketplace/catalogue/page.tsx",
    "src/app/dashboard/marketplace/installed/page.tsx",
    "src/app/dashboard/marketplace/publishers/page.tsx",
    "src/app/dashboard/marketplace/reviews/page.tsx",
    "src/app/dashboard/marketplace/revenue/page.tsx",
    "src/app/dashboard/marketplace/history/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Marketplace routes");
  assert(MARKETPLACE_ROUTES.overview === "/dashboard/marketplace", "route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/marketplace/lib/get-marketplace-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/marketplace/actions/marketplace-actions.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.MARKETPLACE_VIEW"), "view permission required");
  assert(
    actionsSource.includes("PERMISSION_CODES.MARKETPLACE_INSTALL"),
    "install permission required",
  );
  assert(PERMISSION_CODES.MARKETPLACE_ADMIN === "marketplace.admin", "admin permission missing");
  assert(ALL_PERMISSION_CODES.includes("marketplace.view"), "permission catalog missing");
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("model MarketplaceItem"), "MarketplaceItem missing");
  assert(schemaSource.includes("model MarketplaceInstallation"), "MarketplaceInstallation missing");
  assert(schemaSource.includes("model MarketplaceLicense"), "MarketplaceLicense missing");
  console.log("  PASS");

  console.log("Catalogue categories");
  assert(MARKETPLACE_CATEGORIES.length === 9, "expected 9 categories");
  console.log("  PASS");

  console.log("Plugin registry");
  ensureBootstrapMarketplacePlugins();
  assert(listMarketplaceExtensions().length >= 9, "bootstrap extensions missing");
  assert(DEFAULT_MARKETPLACE_CATALOGUE.length >= 9, "default catalogue missing");
  console.log("  PASS");

  console.log("Compatibility engine");
  const compatible = validateMarketplaceCompatibility(
    {
      minBusalVersion: "2.0.0",
      requiredModules: ["crm"],
      requiredIndustries: [],
      requiresAi: false,
      dependencies: [],
      permissionsRequired: [],
    },
    {
      busalVersion: "2.0.0",
      installedModules: ["crm", "reporting"],
      industry: null,
      hasAiFeatures: true,
      installedDependencies: [],
      permissions: ["crm.view"],
    },
  );
  assert(compatible.compatible, "compatibility check failed");
  console.log("  PASS");

  const business = await prisma.business.findFirst({ select: { id: true } });
  assert(business, "No business found");

  const platform = await buildPlatformContext(business.id);
  assert(platform.permissions.includes(PERMISSION_CODES.MARKETPLACE_VIEW), "owner missing view");

  console.log("Seed catalogue");
  await ensureMarketplaceCatalogue();
  const items = await listMarketplaceItems();
  assert(items.length >= 9, "catalogue not seeded");
  console.log("  PASS");

  const freeItem = items.find((item) => item.slug === "stripe-integration");
  const paidItem = items.find((item) => item.slug === "sales-ai-agent-pack");
  assert(freeItem, "free item missing");
  assert(paidItem, "paid item missing");

  const existingFree = await prisma.marketplaceInstallation.findUnique({
    where: { businessId_itemId: { businessId: business.id, itemId: freeItem.id } },
  });
  if (existingFree?.status === "INSTALLED" || existingFree?.status === "ROLLED_BACK") {
    await uninstallMarketplaceItem(platform, freeItem.id);
  }

  const existingPaid = await prisma.marketplaceInstallation.findUnique({
    where: { businessId_itemId: { businessId: business.id, itemId: paidItem.id } },
  });
  if (existingPaid?.status === "INSTALLED" || existingPaid?.status === "ROLLED_BACK") {
    await uninstallMarketplaceItem(platform, paidItem.id);
  }

  console.log("Install free item");
  const installResult = await installMarketplaceItem(platform, freeItem.id);
  assert(installResult.status === "INSTALLED", "install failed");
  console.log("  PASS");

  console.log("Purchase and install paid item");
  await purchaseMarketplaceItem(platform, paidItem.id);
  const paidInstall = await installMarketplaceItem(platform, paidItem.id);
  assert(paidInstall.status === "INSTALLED", "paid install failed");
  console.log("  PASS");

  console.log("Update installation");
  const versionTwo = await publishMarketplaceItemVersion(platform, {
    itemId: freeItem.id,
    versionLabel: "1.1.0",
    changelog: "Webhook improvements",
  });
  const updateResult = await updateMarketplaceInstallation(platform, freeItem.id, versionTwo.id);
  assert(updateResult.status === "INSTALLED", "update failed");
  console.log("  PASS");

  console.log("Rollback installation");
  const rollbackResult = await rollbackMarketplaceInstallation(platform, freeItem.id);
  assert(rollbackResult.status === "ROLLED_BACK", "rollback failed");
  console.log("  PASS");

  console.log("Reviews and ratings");
  await submitMarketplaceReview(platform, {
    itemId: freeItem.id,
    rating: 5,
    title: "Great integration",
    content: "Works seamlessly with our payment flow.",
  });
  const updatedItem = await prisma.marketplaceItem.findUnique({ where: { id: freeItem.id } });
  assert((updatedItem?.reviewCount ?? 0) >= 1, "review missing");
  console.log("  PASS");

  console.log("Issue report");
  const review = await prisma.marketplaceReview.findFirst({
    where: { businessId: business.id, itemId: freeItem.id },
  });
  const issue = await reportMarketplaceIssue(platform, {
    itemId: freeItem.id,
    description: "Webhook delay on sandbox",
    reviewId: review?.id,
  });
  assert(issue.id, "issue report missing");
  console.log("  PASS");

  console.log("Publisher dashboard");
  const publisher = await prisma.marketplacePublisher.findFirst({ where: { slug: "busal-labs" } });
  assert(publisher, "publisher missing");
  const publisherDashboard = await getPublisherDashboard(publisher.id);
  assert(publisherDashboard.publishedItems >= 9, "publisher metrics missing");
  console.log("  PASS");

  console.log("Installation history");
  const history = await listMarketplaceInstallationHistory(business.id, 20);
  assert(
    history.some((entry) => entry.action === "INSTALL"),
    "install history missing",
  );
  assert(
    history.some((entry) => entry.action === "UPDATE"),
    "update history missing",
  );
  console.log("  PASS");

  console.log("Monitoring dashboard");
  const dashboard = await getMarketplaceDashboard(business.id);
  assert(dashboard.totalItems >= 9, "dashboard items missing");
  assert(dashboard.installedCount >= 1, "installed metrics missing");
  console.log("  PASS");

  console.log("Uninstall");
  await uninstallMarketplaceItem(platform, paidItem.id);
  const installed = await listInstalledMarketplaceItems(business.id);
  assert(!installed.some((entry) => entry.itemId === paidItem.id), "uninstall failed");
  console.log("  PASS");

  console.log("Extensibility registry");
  const registrySource = readFileSync(
    join(root, "src/modules/marketplace/registry/marketplace-registry.ts"),
    "utf8",
  );
  assert(registrySource.includes("registerMarketplaceExtension"), "extension registration missing");
  console.log("  PASS");

  console.log("\nMarketplace & Ecosystem verification passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
