import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { PERMISSION_CODES } from "../src/modules/authorization/constants/permissions";
import { POS_HELD_ORDER_PREFIX, POS_ROUTES } from "../src/modules/pos/constants/routes";
import {
  clearPosOrder,
  getOrCreatePosCart,
  holdPosOrder,
  listHeldPosOrders,
  resumePosOrder,
  sendPosOrderToKitchen,
} from "../src/modules/pos/services/pos-order.service";
import { getOrCreatePosSession } from "../src/modules/pos/services/pos-session.service";
import {
  filterPosMenuItems,
  serializePosCategories,
  serializePosMenuItems,
} from "../src/modules/pos/utils/pos-utils";
import { addItem, removeItem, updateQuantity } from "../src/services/cart.service";
import { getQueue } from "../src/services/kitchen-queue.service";
import { listActiveCategories, listMenuItems } from "../src/services/menu-management.service";
import { listTables } from "../src/services/table.service";

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
    "src/modules/pos/index.ts",
    "src/modules/pos/constants/routes.ts",
    "src/modules/pos/types/pos.ts",
    "src/modules/pos/services/pos-session.service.ts",
    "src/modules/pos/services/pos-order.service.ts",
    "src/modules/pos/lib/get-pos-context.ts",
    "src/modules/pos/actions/pos-actions.ts",
    "src/modules/pos/utils/pos-utils.ts",
    "src/modules/pos/components/pos-terminal.tsx",
    "src/modules/pos/components/pos-menu-panel.tsx",
    "src/modules/pos/components/pos-cart-panel.tsx",
    "src/modules/pos/components/pos-table-picker.tsx",
    "src/app/dashboard/pos/page.tsx",
  ];

  for (const file of moduleFiles) {
    readFileSync(join(root, file), "utf8");
  }
  console.log("  PASS");

  console.log("POS route");
  assert(POS_ROUTES.overview === "/dashboard/pos", "POS route mismatch");
  const pageSource = readFileSync(join(root, "src/app/dashboard/pos/page.tsx"), "utf8");
  assert(pageSource.includes("getPosModuleContext"), "POS page should load module context");
  console.log("  PASS");

  console.log("Permission protected");
  const contextSource = readFileSync(join(root, "src/modules/pos/lib/get-pos-context.ts"), "utf8");
  const actionsSource = readFileSync(join(root, "src/modules/pos/actions/pos-actions.ts"), "utf8");
  assert(contextSource.includes("protectedPage"), "POS page should use protectedPage");
  assert(contextSource.includes("PERMISSION_CODES.POS_USE"), "POS page should require pos.use");
  assert(actionsSource.includes("protectedAction"), "POS actions should use protectedAction");
  assert(actionsSource.includes("PERMISSION_CODES.POS_USE"), "POS actions should require pos.use");
  assert(PERMISSION_CODES.POS_USE === "pos.use", "pos.use permission code missing");
  console.log("  PASS");

  const business = await prisma.business.findFirst({
    select: { id: true, ownerId: true },
  });
  assert(business, "No business found");

  let menuItem = await prisma.menuItem.findFirst({
    where: { businessId: business.id, isAvailable: true },
    select: { id: true, name: true, categoryId: true, description: true },
  });

  if (!menuItem) {
    menuItem = await prisma.menuItem.create({
      data: {
        businessId: business.id,
        name: `POS Verify Item ${Date.now()}`,
        price: 12.5,
        isAvailable: true,
      },
      select: { id: true, name: true, categoryId: true, description: true },
    });
  }

  const posSession = await getOrCreatePosSession(business.id);
  const cart = await getOrCreatePosCart(business.id, posSession.id);

  console.log("POS loads");
  assert(posSession.id, "POS session should exist");
  assert(cart.id, "POS cart should exist");
  console.log("  PASS");

  console.log("Menu categories");
  const categories = serializePosCategories(await listActiveCategories(business.id));
  assert(Array.isArray(categories), "categories should load");
  console.log("  PASS");

  console.log("Menu items");
  const menuItems = serializePosMenuItems(await listMenuItems(business.id));
  assert(
    menuItems.some((item) => item.id === menuItem.id),
    "menu items should load",
  );
  console.log("  PASS");

  console.log("Search works");
  const searched = filterPosMenuItems(menuItems, { searchQuery: menuItem.name.slice(0, 4) });
  assert(
    searched.some((item) => item.id === menuItem.id),
    "search should match menu item",
  );
  console.log("  PASS");

  console.log("Categories filter works");
  if (menuItem.categoryId) {
    const filtered = filterPosMenuItems(menuItems, { categoryId: menuItem.categoryId });
    assert(
      filtered.every((item) => item.categoryId === menuItem.categoryId),
      "category filter failed",
    );
  }
  console.log("  PASS");

  console.log("Add item");
  const afterAdd = await addItem(business.id, posSession.id, menuItem.id, 1);
  assert(
    afterAdd.items.some((item) => item.menuItemId === menuItem.id),
    "item should be added",
  );
  const cartItem = afterAdd.items.find((item) => item.menuItemId === menuItem.id);
  assert(cartItem, "cart item missing");
  console.log("  PASS");

  console.log("Increase quantity");
  const afterIncrease = await updateQuantity(cartItem.id, cartItem.quantity + 1);
  const increasedItem = afterIncrease.items.find((item) => item.id === cartItem.id);
  assert(increasedItem?.quantity === cartItem.quantity + 1, "quantity increase failed");
  console.log("  PASS");

  console.log("Decrease quantity");
  const afterDecrease = await updateQuantity(cartItem.id, cartItem.quantity);
  const decreasedItem = afterDecrease.items.find((item) => item.id === cartItem.id);
  assert(decreasedItem?.quantity === cartItem.quantity, "quantity decrease failed");
  console.log("  PASS");

  console.log("Table selection");
  const tables = await listTables(business.ownerId);
  const activeTable = tables.find((table) => table.isActive);
  assert(activeTable, "active table required for POS verification");
  console.log("  PASS");

  console.log("Hold order");
  const held = await holdPosOrder({
    businessId: business.id,
    cartId: afterDecrease.id,
    posSessionId: posSession.id,
    tableId: activeTable.id,
    orderType: "DINE_IN",
    label: "POS Verify Ticket",
  });
  assert(held.label.includes("POS Verify Ticket"), "held label missing");
  assert(held.tableId === activeTable.id, "held table not saved");
  const heldOrders = await listHeldPosOrders(business.id);
  assert(
    heldOrders.some((entry) => entry.orderSessionId === held.orderSessionId),
    "held order should be listed",
  );
  const heldSession = await prisma.orderSession.findUnique({
    where: { id: held.orderSessionId },
  });
  assert(heldSession?.orderNotes?.includes(POS_HELD_ORDER_PREFIX), "held marker missing");
  console.log("  PASS");

  console.log("Resume held order");
  const resumedCart = await resumePosOrder({
    businessId: business.id,
    orderSessionId: held.orderSessionId,
    posSessionId: posSession.id,
  });
  assert(resumedCart.items.length > 0, "resumed cart should contain items");
  console.log("  PASS");

  console.log("Remove item");
  const itemToRemove = resumedCart.items[0];
  assert(itemToRemove, "resumed cart item missing");
  const afterRemove = await removeItem(itemToRemove.id);
  assert(!afterRemove.items.some((item) => item.id === itemToRemove.id), "item should be removed");
  await addItem(business.id, resumedCart.qrMenuSessionId, menuItem.id, 2);
  console.log("  PASS");

  console.log("Clear order");
  const cleared = await clearPosOrder(resumedCart.id, business.id);
  assert(cleared.items.length === 0, "cart should be cleared");
  console.log("  PASS");

  console.log("Send to kitchen");
  const sendCart = await getOrCreatePosCart(business.id, posSession.id);
  await addItem(business.id, posSession.id, menuItem.id, 2);
  const sendResult = await sendPosOrderToKitchen({
    businessId: business.id,
    cartId: sendCart.id,
    posSessionId: posSession.id,
    tableId: activeTable.id,
    orderType: "TAKEAWAY",
    customerName: "POS Verify Customer",
    orderNotes: "No onions",
  });
  assert(sendResult.orderNumber.startsWith("ORD-"), "order number should be generated");
  assert(sendResult.kitchenQueueId, "kitchen queue id should be returned");
  const queue = await getQueue(business.id, { status: "NEW" });
  assert(
    queue.some((entry) => entry.id === sendResult.kitchenQueueId),
    "kitchen queue should receive order",
  );
  console.log("  PASS");

  console.log("\nPOS verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
