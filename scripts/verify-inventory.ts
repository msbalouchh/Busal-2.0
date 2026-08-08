import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { Decimal } from "@prisma/client/runtime/library";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { formatInventoryMoney } from "../src/modules/inventory/utils/inventory-utils";
import { calculateRecipeLineCostPence } from "../src/modules/inventory/utils/inventory-cost";
import { INVENTORY_ROUTES } from "../src/modules/inventory/constants/routes";
import { addItem, calculateSubtotal, createCart } from "../src/services/cart.service";
import { createOrderSession, markOrderSessionReady } from "../src/services/order-session.service";
import { ORDER_SOURCES, ORDER_TYPES } from "../src/modules/orders/constants/order-status";
import { buildOrderScopeFromInput } from "../src/modules/orders/lib/order-scope";
import { orderRepository } from "../src/modules/orders/repository/order-repository";
import { createQRCode, recordPublicMenuVisit } from "../src/services/qr-menu.service";
import { runBatchTransaction } from "../src/lib/prisma-transaction";
import { prisma } from "../src/lib/prisma";
import type { OrderData } from "../src/services/order.service";
import { connectWithRetry, handleVerificationError } from "./lib/verify-db";
import { ensureVerificationTenantContext } from "./lib/verify-oms-order";
import { getVerifyPrisma } from "./lib/verify-prisma";
import {
  createStockAdjustment,
  deductStockForCompletedOrder,
} from "../src/services/inventory-stock.service";
import { syncLegacyOrderForKitchen } from "../src/services/kitchen-queue.service";
import {
  createIngredient,
  ensureDefaultIngredientCategories,
  getIngredient,
  getInventoryDashboard,
  listIngredientCategories,
} from "../src/services/inventory.service";
import { recordPaymentForBusiness } from "../src/modules/payments/services/payment-business-bridge.service";
import {
  calculateMenuItemCostPence,
  getRecipeByMenuItem,
  upsertRecipe,
} from "../src/services/recipe.service";
import { moneyDecimalToPence } from "../src/modules/payments/utils/currency";

const verifyPrisma = getVerifyPrisma();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function toNumber(value: { toNumber(): number } | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

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

async function ensureProductForMenuItem(
  businessId: string,
  menuItem: { id: string; name: string; price: number | { toNumber(): number } },
): Promise<void> {
  const existing = await verifyPrisma.product.findFirst({
    where: {
      businessId,
      OR: [{ id: menuItem.id }, { name: menuItem.name, status: "ACTIVE" }],
    },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  let category = await verifyPrisma.category.findFirst({
    where: { businessId },
    select: { id: true },
  });

  if (!category) {
    const menu =
      (await verifyPrisma.menu.findFirst({
        where: { businessId },
        select: { id: true },
      })) ??
      (await verifyPrisma.menu.create({
        data: { businessId, name: "Verify Menu" },
        select: { id: true },
      }));

    category = await verifyPrisma.category.create({
      data: {
        businessId,
        menuId: menu.id,
        name: "Verify Category",
        slug: `verify-cat-${Date.now()}`,
      },
      select: { id: true },
    });
  }

  const price = typeof menuItem.price === "number" ? menuItem.price : menuItem.price.toNumber();
  const productSuffix = menuItem.id.slice(0, 8);

  await verifyPrisma.product.create({
    data: {
      id: menuItem.id,
      businessId,
      categoryId: category.id,
      sku: `SKU-${productSuffix}`,
      slug: `product-${productSuffix}`,
      name: menuItem.name,
      status: "ACTIVE",
      price,
    },
  });
}

async function resolveProductIdForMenuItem(
  businessId: string,
  menuItemId: string,
  menuItemName: string,
): Promise<string> {
  const linkedProduct = await prisma.product.findFirst({
    where: {
      businessId,
      OR: [{ id: menuItemId }, { name: menuItemName, status: "ACTIVE" }],
    },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!linkedProduct) {
    throw new Error(`No active product found for menu item ${menuItemName}`);
  }

  return linkedProduct.id;
}

async function createOrderFromSessionForVerification(
  orderSessionId: string,
  branchId: string,
): Promise<OrderData> {
  const session = await prisma.orderSession.findUnique({
    where: { id: orderSessionId },
    include: {
      cart: {
        include: {
          items: {
            include: {
              menuItem: { select: { id: true, name: true } },
            },
            orderBy: [{ createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!session) {
    throw new Error("Order session not found");
  }

  const scope = buildOrderScopeFromInput({
    businessId: session.businessId,
    branchId,
    userId: "pos-terminal",
  });

  const orderItems = await Promise.all(
    session.cart.items.map(async (item) => ({
      productId: await resolveProductIdForMenuItem(
        session.businessId,
        item.menuItemId,
        item.menuItem.name,
      ),
      productName: item.menuItem.name,
      quantity: item.quantity,
      unitPricePence: Math.round(toNumber(item.unitPrice) * 100),
      notes: item.notes,
    })),
  );

  const record = await orderRepository.create(scope, {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId,
    customerName: session.customerName,
    orderType: ORDER_TYPES.DINE_IN,
    source: ORDER_SOURCES.POS,
    tableId: session.tableId,
    notes: session.orderNotes,
    items: orderItems,
  });

  await runBatchTransaction([
    prisma.cart.update({
      where: { id: session.cartId },
      data: { status: "COMPLETED" },
    }),
    prisma.orderSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED" },
    }),
  ]);

  const subtotal = calculateSubtotal(
    session.cart.items.map((item) => ({ totalPrice: toNumber(item.totalPrice) })),
  );

  return {
    id: record.order.id,
    businessId: record.order.businessId,
    orderSessionId: session.id,
    orderNumber: record.order.orderNumber,
    fulfilmentType: "DINE_IN",
    tableId: session.tableId,
    customerName: session.customerName,
    customerPhone: session.customerPhone,
    notes: session.orderNotes,
    subtotal,
    discount: record.order.discountTotalPence / 100,
    tax: record.order.taxTotalPence / 100,
    total: record.order.totalPence / 100,
    status: "PENDING",
    items: record.items.map((item) => ({
      id: item.id,
      orderId: record.order.id,
      menuItemId: item.productId,
      nameSnapshot: item.productName,
      unitPrice: item.unitPricePence / 100,
      quantity: item.quantity,
      totalPrice: item.lineTotalPence / 100,
      notes: item.notes,
      createdAt: new Date(record.order.createdAt),
    })),
    createdAt: new Date(record.order.createdAt),
    updatedAt: new Date(record.order.updatedAt),
  };
}

async function createInventoryOrder(businessId: string, ownerId: string, suffix: string) {
  const { branchId } = await ensureVerificationTenantContext(verifyPrisma, businessId);
  const slug = `inventory-${suffix}`;
  const qrCode = await createQRCode(ownerId, { slug, branchId });
  const visit = await recordPublicMenuVisit(ownerId, qrCode.id, {
    sessionToken: `${slug}-token`,
  });

  const menuItem = await verifyPrisma.menuItem.create({
    data: {
      businessId,
      branchId,
      name: `Inventory Verify Item ${suffix}`,
      price: 25,
      isAvailable: true,
    },
    select: { id: true, name: true, price: true },
  });

  await ensureProductForMenuItem(businessId, menuItem);

  const cart = await createCart(businessId, visit.session.id, branchId);
  await addItem(businessId, visit.session.id, menuItem.id, 2, branchId);

  const orderSession = await createOrderSession(businessId, cart.id, visit.session.id, {
    branchId,
  });
  await markOrderSessionReady(orderSession.id);

  const order = await createOrderFromSessionForVerification(orderSession.id, branchId);

  const session = await prisma.orderSession.findUnique({
    where: { id: orderSession.id },
    include: {
      cart: {
        include: {
          items: {
            include: { menuItem: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  if (!session) {
    throw new Error("Order session missing after create");
  }

  const legacyOrderId = await syncLegacyOrderForKitchen({
    businessId,
    branchId,
    orderSessionId: orderSession.id,
    orderNumber: order.orderNumber,
    tableId: session.tableId,
    customerName: session.customerName,
    customerPhone: session.customerPhone,
    notes: session.orderNotes,
    subtotal: order.subtotal,
    discount: order.discount,
    tax: order.tax,
    total: order.total,
    status: order.status,
    items: session.cart.items.map((item) => ({
      menuItemId: item.menuItemId,
      nameSnapshot: item.menuItem.name,
      unitPrice: toNumber(item.unitPrice),
      quantity: item.quantity,
      totalPrice: toNumber(item.totalPrice),
      notes: item.notes,
    })),
  });

  return { order, branchId, menuItemId: menuItem.id, legacyOrderId };
}

async function main() {
  await connectWithRetry(verifyPrisma);
  await prisma.$disconnect().catch(() => undefined);
  await connectWithRetry(prisma);

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

  const business = await verifyPrisma.business.findFirst({
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

  const { order, menuItemId, branchId, legacyOrderId } = await createInventoryOrder(
    business.id,
    business.ownerId,
    suffix,
  );

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
  }, branchId);
  assert(recipe.lines.length === 1, "recipe line missing");
  assertIntegerPenceValue(recipe.totalCostPence, "recipe total cost");
  assert(recipe.totalCostPence === 500, "recipe total cost mismatch");
  const menuItemCost = await calculateMenuItemCostPence(menuItemId, business.id, branchId);
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
  const orderRecord = await verifyPrisma.restaurantOrder.findUnique({
    where: { id: order.id },
    select: { totalAmount: true },
  });
  assert(orderRecord, "order record missing");
  const orderTotalPence = moneyDecimalToPence(orderRecord.totalAmount);

  await recordPaymentForBusiness(business.id, order.id, {
    method: "CARD",
    amountPence: orderTotalPence,
    amountTenderedPence: orderTotalPence,
  }, branchId);

  await verifyPrisma.restaurantOrder.update({
    where: { id: order.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  await deductStockForCompletedOrder(business.id, order.id, null, null, branchId);

  const afterPayment = await getIngredient(ingredient.id, business.id);
  assert(afterPayment.currentStock === "7", "sale deduction stock mismatch");

  const deductionRecord = await verifyPrisma.orderStockDeduction.findUnique({
    where: { orderId: legacyOrderId },
  });
  assert(deductionRecord, "order stock deduction record missing");

  const saleMovements = await verifyPrisma.stockMovement.findMany({
    where: { orderId: legacyOrderId, movementType: "SALE_DEDUCTION" },
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
  const movementCount = await verifyPrisma.stockMovement.count({
    where: { orderId: legacyOrderId, movementType: "SALE_DEDUCTION" },
  });
  assert(movementCount === 1, "duplicate stock deduction should not occur");
  console.log("  PASS");

  console.log("Inventory dashboard");
  const dashboard = await getInventoryDashboard(business.id);
  assert(dashboard.totalIngredients >= 1, "dashboard ingredient count failed");
  assert(Array.isArray(dashboard.recentMovements), "dashboard movements missing");
  console.log("  PASS");

  console.log("Business isolation");
  const otherBusiness = await verifyPrisma.business.findFirst({
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
  .catch(handleVerificationError)
  .finally(async () => {
    await verifyPrisma.$disconnect();
  });
