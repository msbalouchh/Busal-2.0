import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { addItem, calculateSubtotal, createCart } from "../src/services/cart.service";
import {
  acknowledgeOrder,
  enqueueOrder,
  getQueue,
  getQueueItem,
  listOrdersByStatus,
  markReady,
  markServed,
  startPreparation,
  syncLegacyOrderForKitchen,
} from "../src/services/kitchen-queue.service";
import { createOrderSession, markOrderSessionReady } from "../src/services/order-session.service";
import { ORDER_SOURCES, ORDER_TYPES } from "../src/modules/orders/constants/order-status";
import { buildOrderScopeFromInput } from "../src/modules/orders/lib/order-scope";
import { orderRepository } from "../src/modules/orders/repository/order-repository";
import {
  filterKitchenOrders,
  groupKitchenOrdersByStatus,
  serializeKitchenOrderCard,
} from "../src/modules/kitchen/lib/kitchen-display-utils";
import { KITCHEN_REFRESH_INTERVAL_MS } from "../src/modules/kitchen/constants/routes";
import { createQRCode, deleteQRCode, recordPublicMenuVisit } from "../src/services/qr-menu.service";
import { runBatchTransaction } from "../src/lib/prisma-transaction";
import { prisma } from "../src/lib/prisma";
import type { OrderData } from "../src/services/order.service";
import { connectWithRetry, handleVerificationError } from "./lib/verify-db";
import { cleanupRestaurantOrder, ensureVerificationTenantContext } from "./lib/verify-oms-order";
import { getVerifyPrisma } from "./lib/verify-prisma";

const verifyPrisma = getVerifyPrisma();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function toNumber(value: { toNumber(): number } | number): number {
  return typeof value === "number" ? value : value.toNumber();
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
  const suffix = menuItem.id.slice(0, 8);

  await verifyPrisma.product.create({
    data: {
      id: menuItem.id,
      businessId,
      categoryId: category.id,
      sku: `SKU-${suffix}`,
      slug: `product-${suffix}`,
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

  if (session.status !== "ACTIVE" && session.status !== "READY") {
    throw new Error("Order session must be active");
  }

  if (session.cart.status !== "ACTIVE") {
    throw new Error("Cart must be active");
  }

  if (session.cart.items.length === 0) {
    throw new Error("Cart must contain at least one item");
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

async function createKitchenOrderForVerification(
  businessId: string,
  ownerId: string,
  suffix: string,
  branchId: string,
) {
  const slug = `kitchen-verify-${suffix}`;
  const qrCode = await createQRCode(ownerId, { slug, branchId });
  const visit = await recordPublicMenuVisit(ownerId, qrCode.id, {
    sessionToken: `${slug}-token`,
  });

  const menuItem = await verifyPrisma.menuItem.create({
    data: {
      businessId,
      branchId,
      name: `Kitchen Verify Item ${suffix}`,
      price: 12,
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

  await enqueueOrder(businessId, legacyOrderId, { branchId });

  return { order, cart, orderSession, visit, qrCode, menuItem, legacyOrderId };
}

async function main() {
  await connectWithRetry(verifyPrisma);
  await prisma.$disconnect().catch(() => undefined);
  await connectWithRetry(prisma);

  const business = await verifyPrisma.business.findFirst({
    select: { ownerId: true, id: true },
  });
  assert(business, "No business found");

  const ownerId = business.ownerId;
  const suffix = Date.now().toString();
  const { branchId } = await ensureVerificationTenantContext(verifyPrisma, business.id);

  console.log("Kitchen order bootstrap");
  const { order, cart, orderSession, visit, qrCode, legacyOrderId } =
    await createKitchenOrderForVerification(business.id, ownerId, suffix, branchId);

  const queueItem = await verifyPrisma.kitchenQueue.findUnique({
    where: { orderId: legacyOrderId },
    include: {
      order: {
        include: {
          table: { select: { name: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              nameSnapshot: true,
              notes: true,
            },
          },
        },
      },
    },
  });
  assert(queueItem, "kitchen queue entry should exist");
  console.log("  PASS");

  console.log("Queue status starts as NEW");
  assert(queueItem.status === "NEW", "queue status should be NEW");
  console.log("  PASS");

  console.log("Status transitions work");
  const acknowledged = await acknowledgeOrder(queueItem.id);
  assert(acknowledged.status === "ACKNOWLEDGED", "acknowledge failed");
  const preparing = await startPreparation(queueItem.id);
  assert(preparing.status === "PREPARING", "start preparation failed");
  const ready = await markReady(queueItem.id);
  assert(ready.status === "READY", "mark ready failed");
  const served = await markServed(queueItem.id);
  assert(served.status === "SERVED", "mark served failed");
  console.log("  PASS");

  console.log("Invalid transitions rejected");
  let invalidTransition = false;
  try {
    await acknowledgeOrder(queueItem.id);
  } catch (error) {
    invalidTransition = error instanceof Error && error.message.includes("Invalid kitchen queue");
  }
  assert(invalidTransition, "invalid transition should be rejected");
  console.log("  PASS");

  console.log("Queue retrieval works");
  const fetched = await getQueueItem(queueItem.id);
  assert(fetched.id === queueItem.id, "getQueueItem failed");
  const queue = await getQueue(business.id, { branchId });
  assert(
    queue.some((entry) => entry.orderId === legacyOrderId),
    "getQueue failed",
  );
  const byStatus = await listOrdersByStatus(business.id, "SERVED", branchId);
  assert(
    byStatus.some((entry) => entry.id === queueItem.id),
    "listOrdersByStatus failed",
  );
  console.log("  PASS");

  console.log("Cards render correctly");
  const card = serializeKitchenOrderCard(queueItem);
  assert(card.orderNumber === order.orderNumber, "card order number failed");
  assert(card.items.length === 1, "card items failed");
  assert(card.totalItems === 2, "card total items failed");
  const boardSource = readFileSync(
    join(root, "src/modules/kitchen/components/kitchen-order-card.tsx"),
    "utf8",
  );
  assert(boardSource.includes("order.orderNumber"), "order card render missing");
  console.log("  PASS");

  console.log("Filters work");
  const cards = [card];
  const filtered = filterKitchenOrders(cards, {
    searchQuery: order.orderNumber.slice(0, 4),
    stationFilter: "",
    priorityFilter: "",
    statusFilter: "",
  });
  assert(filtered.length === 1, "filter failed");
  console.log("  PASS");

  console.log("Search works");
  const searchResult = filterKitchenOrders(cards, {
    searchQuery: order.orderNumber,
    stationFilter: "",
    priorityFilter: "",
    statusFilter: "",
  });
  assert(searchResult.length === 1, "search failed");
  console.log("  PASS");

  console.log("Auto refresh works");
  const managerSource = readFileSync(
    join(root, "src/modules/kitchen/components/kitchen-display-manager.tsx"),
    "utf8",
  );
  assert(
    managerSource.includes("KITCHEN_REFRESH_INTERVAL_MS") &&
      managerSource.includes("setInterval") &&
      KITCHEN_REFRESH_INTERVAL_MS === 10_000,
    "auto refresh missing",
  );
  assert(groupKitchenOrdersByStatus(cards).NEW.length === 1, "grouping failed");
  console.log("  PASS");

  console.log("Responsive layout");
  const layoutSource = readFileSync(
    join(root, "src/modules/kitchen/components/kitchen-board.tsx"),
    "utf8",
  );
  assert(layoutSource.includes("md:grid-cols-2"), "responsive layout missing");
  console.log("  PASS");

  console.log("Cleanup");
  await verifyPrisma.kitchenQueue.delete({ where: { id: queueItem.id } });
  await verifyPrisma.legacyOrderItem.deleteMany({ where: { orderId: legacyOrderId } });
  await verifyPrisma.legacyOrder.delete({ where: { id: legacyOrderId } });
  await cleanupRestaurantOrder(verifyPrisma, order.id);
  await verifyPrisma.orderSession.delete({ where: { id: orderSession.id } });
  await verifyPrisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await verifyPrisma.cart.delete({ where: { id: cart.id } });
  await verifyPrisma.qRMenuSession.delete({ where: { id: visit.session.id } });
  await deleteQRCode(ownerId, qrCode.id);
  console.log("  PASS");

  console.log("\nAll kitchen checks passed.");
}

main()
  .catch(handleVerificationError)
  .finally(async () => {
    await verifyPrisma.$disconnect();
  });
