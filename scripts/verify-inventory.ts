import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { formatInventoryMoney } from "../src/modules/inventory/utils/inventory-utils";
import { calculateRecipeLineCostPence } from "../src/modules/inventory/utils/inventory-cost";
import { INVENTORY_ROUTES } from "../src/modules/inventory/constants/routes";
import { addItem, createCart } from "../src/services/cart.service";
import {
  createStockAdjustment,
  deductStockForCompletedOrder,
} from "../src/services/inventory-stock.service";
import {
  createIngredient,
  ensureDefaultIngredientCategories,
  getIngredient,
  getInventoryDashboard,
  listIngredientCategories,
} from "../src/services/inventory.service";
import { createOrderFromSession } from "../src/services/order.service";
import { createOrderSession, markOrderSessionReady } from "../src/services/order-session.service";
import { recordPayment } from "../src/services/payment.service";
import { createQRCode, recordPublicMenuVisit } from "../src/services/qr-menu.service";
import {
  calculateMenuItemCostPence,
  getRecipeByMenuItem,
  upsertRecipe,
} from "../src/services/recipe.service";
import { moneyDecimalToPence } from "../src/modules/payments/utils/currency";

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

function assertNoForbiddenPatterns(filePath: string, forbiddenPatterns: string[]): void {
  const source = readFileSync(join(root, filePath), "utf8");

  for (const pattern of forbiddenPatterns) {
    assert(!source.includes(pattern), `${filePath} must not contain ${pattern}`);
  }
}

async function createInventoryOrder(businessId: string, ownerId: string, suffix: string) {
  const qrCode = await createQRCode(ownerId, { slug: `inventory-${suffix}` });
  const visit = await recordPublicMenuVisit(ownerId, qrCode.id, {
    sessionToken: `inventory-token-${suffix}`,
  });

  const menuItem = await prisma.menuItem.create({
    data: {
      businessId,
      name: `Inventory Verify Item ${suffix}`,
      price: 25,
      isAvailable: true,
    },
    select: { id: true },
  });

  const cart = await createCart(businessId, visit.session.id);
  await addItem(businessId, visit.session.id, menuItem.id, 2);

  const orderSession = await createOrderSession(businessId, cart.id, visit.session.id);
  await markOrderSessionReady(orderSession.id);
  const order = await createOrderFromSession(orderSession.id);

  return { order, menuItemId: menuItem.id };
}

async function main() {
  console.log("Module structure");
  const moduleFiles = [
    "src/modules/inventory/index.ts",
    "src/modules/inventory/constants/routes.ts",
    "src/modules/inventory/constants/inventory.ts",
    "src/modules/inventory/types/inventory.ts",
    "src/modules/inventory/utils/inventory-utils.ts",
    "src/modules/inventory/utils/inventory-cost.ts",
    "src/modules/inventory/lib/get-inventory-context.ts",
    "src/modules/inventory/actions/inventory-actions.ts",
    "src/modules/inventory/components/inventory-dashboard.tsx",
    "src/modules/inventory/components/ingredients-manager.tsx",
    "src/modules/inventory/components/recipes-manager.tsx",
    "src/modules/inventory/components/suppliers-manager.tsx",
    "src/modules/inventory/components/stock-movements-list.tsx",
    "src/services/inventory.service.ts",
    "src/services/recipe.service.ts",
    "src/services/inventory-stock.service.ts",
    "src/app/dashboard/inventory/page.tsx",
    "src/app/dashboard/inventory/ingredients/page.tsx",
    "src/app/dashboard/inventory/recipes/page.tsx",
    "src/app/dashboard/inventory/suppliers/page.tsx",
    "src/app/dashboard/inventory/movements/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("Inventory routes");
  assert(INVENTORY_ROUTES.overview === "/dashboard/inventory", "inventory route mismatch");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(
    join(root, "src/modules/inventory/lib/get-inventory-context.ts"),
    "utf8",
  );
  const actionsSource = readFileSync(
    join(root, "src/modules/inventory/actions/inventory-actions.ts"),
    "utf8",
  );
  assert(contextSource.includes("protectedPage"), "inventory pages should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.INVENTORY_VIEW"), "inventory.view required");
  assert(actionsSource.includes("protectedAction"), "inventory actions should use protectedAction");
  assert(actionsSource.includes("PERMISSION_CODES.INVENTORY_MANAGE"), "inventory.manage required");
  assert(actionsSource.includes("PERMISSION_CODES.RECIPE_MANAGE"), "recipe.manage required");
  assert(PERMISSION_CODES.INVENTORY_VIEW === "inventory.view", "inventory.view code missing");
  assert(PERMISSION_CODES.INVENTORY_MANAGE === "inventory.manage", "inventory.manage code missing");
  assert(PERMISSION_CODES.RECIPE_MANAGE === "recipe.manage", "recipe.manage code missing");
  console.log("  PASS");

  console.log("Cost calculation uses integer pence");
  assertNoForbiddenPatterns("src/services/recipe.service.ts", ["parseFloat", "toNumber("]);
  const lineCost = calculateRecipeLineCostPence(new Decimal("2"), new Decimal("10"), 150);
  assertIntegerPenceValue(lineCost, "recipe line cost");
  assert(lineCost === 330, "recipe line cost calculation failed");
  assertGbpFormat(formatInventoryMoney(lineCost));
  console.log("  PASS");

  console.log("Schema pence storage");
  const schemaSource = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
  assert(/costPricePence\s+Int/.test(schemaSource), "ingredient cost must be integer pence");
  console.log("  PASS");

  const business = await prisma.business.findFirst({
    select: { id: true, ownerId: true },
  });
  assert(business, "No business found");

  const suffix = Date.now().toString();
  await ensureDefaultIngredientCategories(business.id);
  const categories = await listIngredientCategories(business.id);
  assert(categories.length >= 7, "default ingredient categories missing");

  console.log("Ingredient CRUD");
  const ingredient = await createIngredient(business.id, null, {
    name: `Chicken ${suffix}`,
    sku: `SKU-${suffix}`,
    categoryId: categories.find((category) => category.slug === "meat")?.id ?? null,
    unit: "KG",
    costPricePence: 500,
    currentStock: "10",
    minimumStock: "2",
  });
  assertIntegerPenceValue(ingredient.costPricePence, "ingredient cost");
  assert(ingredient.currentStock === "10", "ingredient stock mismatch");
  console.log("  PASS");

  const { order, menuItemId } = await createInventoryOrder(business.id, business.ownerId, suffix);

  console.log("Recipe management");
  const recipe = await upsertRecipe(business.id, null, {
    menuItemId,
    lines: [
      {
        ingredientId: ingredient.id,
        quantity: "1",
        unit: "KG",
        wastePercent: "0",
      },
    ],
  });
  assert(recipe.lines.length === 1, "recipe line missing");
  assertIntegerPenceValue(recipe.totalCostPence, "recipe total cost");
  assert(recipe.totalCostPence === 500, "recipe total cost mismatch");
  const menuItemCost = await calculateMenuItemCostPence(menuItemId, business.id);
  assert(menuItemCost === 500, "menu item cost mismatch");
  console.log("  PASS");

  console.log("Manual stock adjustment");
  await createStockAdjustment(business.id, null, {
    ingredientId: ingredient.id,
    direction: "DECREASE",
    quantity: "1",
    reason: "Stock count correction",
  });
  const adjusted = await getIngredient(ingredient.id, business.id);
  assert(adjusted.currentStock === "9", "adjustment stock mismatch");
  console.log("  PASS");

  console.log("Stock deduction on completed payment");
  const orderRecord = await prisma.legacyOrder.findUnique({
    where: { id: order.id },
    select: { total: true },
  });
  assert(orderRecord, "order record missing");
  const orderTotalPence = moneyDecimalToPence(orderRecord.total);

  await recordPayment(business.id, order.id, null, {
    method: "CARD",
    amountPence: orderTotalPence,
    amountTenderedPence: orderTotalPence,
  });

  const afterPayment = await getIngredient(ingredient.id, business.id);
  assert(afterPayment.currentStock === "7", "sale deduction stock mismatch");

  const deductionRecord = await prisma.orderStockDeduction.findUnique({
    where: { orderId: order.id },
  });
  assert(deductionRecord, "order stock deduction record missing");

  const saleMovements = await prisma.stockMovement.findMany({
    where: { orderId: order.id, movementType: "SALE_DEDUCTION" },
  });
  assert(saleMovements.length === 1, "sale movement missing");
  assert(saleMovements[0]?.quantityChange.toString() === "-2", "deducted quantity mismatch");
  console.log("  PASS");

  console.log("Prevent negative inventory");
  let negativeBlocked = false;
  try {
    await createStockAdjustment(business.id, null, {
      ingredientId: ingredient.id,
      direction: "DECREASE",
      quantity: "100",
      reason: "Damaged goods",
    });
  } catch (error) {
    negativeBlocked = error instanceof Error && error.message.includes("Insufficient stock");
  }
  assert(negativeBlocked, "negative inventory should be blocked");
  console.log("  PASS");

  console.log("Idempotent stock deduction");
  await deductStockForCompletedOrder(business.id, order.id, null);
  const movementCount = await prisma.stockMovement.count({
    where: { orderId: order.id, movementType: "SALE_DEDUCTION" },
  });
  assert(movementCount === 1, "duplicate stock deduction should not occur");
  console.log("  PASS");

  console.log("Inventory dashboard");
  const dashboard = await getInventoryDashboard(business.id);
  assert(dashboard.totalIngredients >= 1, "dashboard ingredient count failed");
  assert(Array.isArray(dashboard.recentMovements), "dashboard movements missing");
  console.log("  PASS");

  console.log("Business isolation");
  const otherBusiness = await prisma.business.findFirst({
    where: { id: { not: business.id } },
    select: { id: true },
  });
  if (otherBusiness) {
    let isolated = false;
    try {
      await getIngredient(ingredient.id, otherBusiness.id);
    } catch (error) {
      isolated = error instanceof Error && error.message.includes("not found");
    }
    assert(isolated, "ingredient should be isolated by business");

    const foreignRecipe = await getRecipeByMenuItem(menuItemId, otherBusiness.id);
    assert(foreignRecipe === null, "recipe should be isolated by business");
  }
  console.log("  PASS");

  console.log("\nInventory verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
