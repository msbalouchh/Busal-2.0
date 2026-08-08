import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { MENU_ITEM_STATUSES } from "../src/modules/menu/constants/menu-status";
import { buildMenuPlatformContext } from "../src/modules/menu/services/menu-platform.service";
import { buildMenuScopeFromInput } from "../src/modules/menu/lib/menu-scope";
import { menuRepository } from "../src/modules/menu/repository/menu-repository";
import { bootstrapVerificationEnvironment } from "./lib/verify-bootstrap";
import { menuService } from "../src/modules/menu/services/menu.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  bootstrapVerificationEnvironment();

  console.log("Module structure");
  const moduleFiles = [
    "src/modules/menu/index.ts",
    "src/modules/menu/services/menu.service.ts",
    "src/modules/menu/repository/menu-repository.ts",
    "src/modules/menu/services/menu-platform.service.ts",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  const business = await prisma.business.findFirst({
    include: { owner: true, branches: { where: { isMain: true }, take: 1 } },
  });
  assert(business?.owner, "No business owner found");
  const branch = business.branches[0] ?? (await prisma.branch.findFirst({ where: { businessId: business.id } }));
  assert(branch, "No branch found");

  const context = buildMenuPlatformContext({
    businessId: business.id,
    branchId: branch.id,
    userId: business.ownerId,
  });

  const suffix = Date.now();

  console.log("List menus");
  const menus = await menuService.listMenus(context);
  assert(Array.isArray(menus), "menus should load");

  let menuId = menus[0]?.menu.id;
  let categoryId = menus[0]?.categories[0]?.id;

  if (!menuId || !categoryId) {
    const menu = await prisma.menu.create({
      data: {
        businessId: business.id,
        name: `Verify Menu ${suffix}`,
      },
    });
    const category = await prisma.category.create({
      data: {
        businessId: business.id,
        menuId: menu.id,
        name: "Verify Category",
        slug: `verify-category-${suffix}`,
      },
    });
    menuId = menu.id;
    categoryId = category.id;
  }
  console.log("  PASS");

  console.log("Create menu item");
  const scope = buildMenuScopeFromInput({
    businessId: business.id,
    branchId: branch.id,
    userId: business.ownerId,
  });
  const item = await menuRepository.createItem(scope, {
    menuId: menuId!,
    categoryId: categoryId!,
    name: `Verify Item ${suffix}`,
    description: "Platform menu item",
    basePricePence: 1250,
    status: MENU_ITEM_STATUSES.ACTIVE,
  });
  assert(item.item.id, "menu item not created");
  console.log("  PASS");

  console.log("Search items");
  const search = await menuService.searchItems(
    { query: `Verify Item ${suffix}`, page: 1, pageSize: 10 },
    context,
  );
  assert(search.records.some((record) => record.item.id === item.item.id), "search failed");
  console.log("  PASS");

  console.log("Update availability");
  const unavailable = await menuService.setItemAvailability(item.item.id, false, context);
  assert(unavailable, "availability toggle failed");
  console.log("  PASS");

  console.log("Variants and modifiers structure");
  const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(
    schema.includes("model ProductVariant") || schema.includes("model ModifierGroup"),
    "variants/modifiers schema missing",
  );
  console.log("  PASS");

  console.log("Restore availability");
  await menuService.setItemAvailability(item.item.id, true, context);
  console.log("  PASS");

  console.log("\nMenu platform verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
