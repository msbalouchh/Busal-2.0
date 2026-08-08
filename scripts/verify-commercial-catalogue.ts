import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { formatCommercialMoney } from "../src/modules/commercial/utils/commercial-utils";
import { COMMERCIAL_ROUTES } from "../src/modules/commercial/constants/routes";
import {
  archiveCommercialProduct,
  createCommercialBundle,
  createCommercialCategory,
  createCommercialProduct,
  createPriceBook,
  getCommercialCatalogueDashboard,
  getCommercialProduct,
  getProductVersionHistory,
  listCommercialProducts,
  updateCommercialProduct,
} from "../src/services/commercial-catalogue.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertGbpFormat(value: string): void {
  assert(value.includes("£"), "formatted value should use GBP symbol");
}

function assertIntegerPenceValue(value: number, label: string): void {
  assert(Number.isInteger(value), `${label} must be integer pence`);
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/commercial/index.ts",
    "src/modules/commercial/constants/routes.ts",
    "src/modules/commercial/utils/commercial-utils.ts",
    "src/modules/commercial/utils/commercial-audit.ts",
    "src/modules/commercial/lib/get-commercial-context.ts",
    "src/modules/commercial/actions/commercial-actions.ts",
    "src/modules/commercial/components/commercial-dashboard.tsx",
    "src/modules/commercial/components/commercial-lists.tsx",
    "src/services/commercial-catalogue.service.ts",
    "src/app/dashboard/commercial/page.tsx",
    "src/app/dashboard/commercial/categories/page.tsx",
    "src/app/dashboard/commercial/products/page.tsx",
    "src/app/dashboard/commercial/bundles/page.tsx",
    "src/app/dashboard/commercial/price-books/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Commercial routes");
  assert(COMMERCIAL_ROUTES.overview === "/dashboard/commercial", "commercial route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/commercial/lib/get-commercial-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/commercial/actions/commercial-actions.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "commercial pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.COMMERCIAL_VIEW"), "commercial.view required");
  assert(
    actionsSource.includes("protectedAction"),
    "commercial actions should use protectedAction",
  );
  assert(
    actionsSource.includes("PERMISSION_CODES.COMMERCIAL_CREATE"),
    "commercial.create required",
  );
  assert(actionsSource.includes("PERMISSION_CODES.COMMERCIAL_MANAGE_BUNDLES"), "manage bundles");
  assert(actionsSource.includes("PERMISSION_CODES.COMMERCIAL_MANAGE_PRICES"), "manage prices");
  assert(PERMISSION_CODES.COMMERCIAL_VIEW === "commercial.view", "commercial.view code missing");
  assert(
    PERMISSION_CODES.COMMERCIAL_MANAGE_PRICES === "commercial.manage_prices",
    "manage_prices missing",
  );
  console.log("  PASS");

  console.log("Integer pence formatting");
  assertGbpFormat(formatCommercialMoney(9900));
  console.log("  PASS");

  console.log("Schema");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(schemaSource.includes("model CommercialProduct"), "CommercialProduct model missing");
  assert(schemaSource.includes("model CommercialProductVersion"), "versioning model missing");
  assert(schemaSource.includes("model CommercialBundle"), "CommercialBundle model missing");
  assert(schemaSource.includes("model PriceBook"), "PriceBook model missing");
  assert(schemaSource.includes("basePricePence           Int"), "base price must be integer pence");
  assert(/bundlePricePence\s+Int/.test(schemaSource), "bundle price must be integer pence");
  console.log("  PASS");

  const business = await prisma.business.findFirst({
    select: { id: true },
  });
  assert(business, "No business found");

  const suffix = Date.now().toString();

  console.log("Product categories");
  const category = await createCommercialCategory(business.id, null, {
    name: `Commercial Category ${suffix}`,
    description: "Verify category",
  });
  assert(category.slug.includes("commercial-category"), "category slug expected");
  console.log("  PASS");

  console.log("Commercial products");
  const product = await createCommercialProduct(business.id, null, {
    sku: `SKU-${suffix}`,
    categoryId: category.id,
    name: `Commercial Product ${suffix}`,
    description: "Full service package",
    pricingModel: "MONTHLY",
    basePricePence: 4999,
    currency: "GBP",
    taxClass: "STANDARD",
    industry: "Hospitality",
    setupRequired: true,
    requiresContract: true,
    renewable: true,
    defaultBillingCycle: "MONTHLY",
    estimatedDeliveryTime: "5 business days",
    assignedDepartment: "Operations",
    serviceChecklistTemplate: "onboarding-checklist",
    documentation: "https://docs.example.com/product",
    status: "ACTIVE",
  });
  assertIntegerPenceValue(product.currentVersion!.basePricePence, "base price");
  assert(product.versionCount === 1, "initial version should be 1");
  console.log("  PASS");

  console.log("Product versioning");
  await updateCommercialProduct(product.id, business.id, null, {
    sku: product.sku,
    categoryId: category.id,
    name: `Commercial Product ${suffix} v2`,
    pricingModel: "ANNUAL",
    basePricePence: 49999,
    status: "ACTIVE",
  });
  const history = await getProductVersionHistory(product.id, business.id);
  assert(history.length === 2, "expected two product versions");
  assert(history[0]!.versionNumber === 2, "latest version should be v2");
  const unchanged = await getCommercialProduct(product.id, business.id);
  assert(unchanged.currentVersion!.versionNumber === 2, "current version should update");
  console.log("  PASS");

  console.log("Product bundles");
  const v1 = history.find((version) => version.versionNumber === 1)!;
  const bundle = await createCommercialBundle(business.id, null, {
    sku: `BUNDLE-${suffix}`,
    name: `Starter Bundle ${suffix}`,
    description: "Bundle with individual and bundle pricing",
    bundlePricePence: 79999,
    pricingModel: "ANNUAL",
    items: [
      {
        productVersionId: v1.id,
        quantity: 1,
        individualPricePence: 4999,
      },
      {
        productVersionId: unchanged.currentVersion!.id,
        quantity: 1,
        individualPricePence: 49999,
      },
    ],
  });
  assertIntegerPenceValue(bundle.currentVersion!.bundlePricePence, "bundle price");
  assert(bundle.currentVersion!.items.length === 2, "bundle should have two items");
  console.log("  PASS");

  console.log("Price books");
  const priceBook = await createPriceBook(business.id, null, {
    code: `STD-${suffix}`,
    type: "STANDARD",
    name: "Standard Price Book",
    description: "Standard catalogue pricing",
    entries: [
      {
        productVersionId: unchanged.currentVersion!.id,
        pricePence: 45999,
        pricingModel: "ANNUAL",
      },
      {
        bundleVersionId: bundle.currentVersion!.id,
        pricePence: 74999,
        pricingModel: "ANNUAL",
      },
    ],
  });
  assert(priceBook.type === "STANDARD", "price book type mismatch");
  assert(priceBook.currentVersion!.entries.length === 2, "price book entries expected");
  console.log("  PASS");

  const enterpriseBook = await createPriceBook(business.id, null, {
    code: `ENT-${suffix}`,
    type: "ENTERPRISE",
    name: "Enterprise Price Book",
    countryCode: "GB",
    partnerId: "partner-1",
    entries: [],
  });
  assert(enterpriseBook.type === "ENTERPRISE", "enterprise price book expected");
  console.log("  PASS");

  console.log("Archive product");
  const archiveSku = `ARCH-${suffix}`;
  const archiveProduct = await createCommercialProduct(business.id, null, {
    sku: archiveSku,
    name: "Archive Me",
    pricingModel: "ONE_TIME",
    basePricePence: 1000,
    status: "ACTIVE",
  });
  await archiveCommercialProduct(archiveProduct.id, business.id, null);
  const products = await listCommercialProducts(business.id);
  assert(!products.some((entry) => entry.sku === archiveSku), "archived product hidden");
  console.log("  PASS");

  console.log("Commercial dashboard");
  const dashboard = await getCommercialCatalogueDashboard(business.id);
  assert(dashboard.totalProducts >= 1, "dashboard products count");
  assert(dashboard.totalBundles >= 1, "dashboard bundles count");
  assert(dashboard.totalPriceBooks >= 2, "dashboard price books count");
  console.log("  PASS");

  console.log("Business isolation");
  const otherBusiness = await prisma.business.findFirst({
    where: { id: { not: business.id } },
    select: { id: true },
  });

  if (otherBusiness) {
    const isolated = await getCommercialCatalogueDashboard(otherBusiness.id);
    assert(isolated.totalProducts === 0, "other business should have no commercial products");
  }
  console.log("  PASS");

  console.log("\nCommercial catalogue verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
