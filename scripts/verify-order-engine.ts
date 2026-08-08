import { addItem, calculateSubtotal, createCart, getCartById } from "../src/services/cart.service";
import {
  getOrder,
  listOrders,
  type OrderData,
} from "../src/services/order.service";
import {
  createOrderSession,
  markOrderSessionReady,
} from "../src/services/order-session.service";
import { ORDER_SOURCES, ORDER_TYPES } from "../src/modules/orders/constants/order-status";
import { buildOrderScopeFromInput } from "../src/modules/orders/lib/order-scope";
import { orderRepository } from "../src/modules/orders/repository/order-repository";
import { createQRCode, deleteQRCode, recordPublicMenuVisit } from "../src/services/qr-menu.service";
import { runBatchTransaction } from "../src/lib/prisma-transaction";
import { prisma } from "../src/lib/prisma";
import { connectWithRetry, handleVerificationError } from "./lib/verify-db";
import { cleanupRestaurantOrder, ensureVerificationTenantContext } from "./lib/verify-oms-order";
import { getVerifyPrisma } from "./lib/verify-prisma";

const verifyPrisma = getVerifyPrisma();

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

/** Creates an OMS order from session without orchestration/kitchen side effects (verification only). */
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

async function createOrderFromQrFlowForVerification(
  businessId: string,
  ownerId: string,
  suffix: string,
  branchId: string,
  options: { quantity?: number; price?: number } = {},
) {
  const slug = `order-engine-${suffix}`;
  const qrCode = await createQRCode(ownerId, { slug, branchId });
  const visit = await recordPublicMenuVisit(ownerId, qrCode.id, {
    sessionToken: `${slug}-token`,
  });

  const menuItem = await verifyPrisma.menuItem.create({
    data: {
      businessId,
      branchId,
      name: `Verify Item ${suffix}`,
      price: options.price ?? 15.5,
      isAvailable: true,
    },
    select: { id: true, name: true, price: true },
  });

  await ensureProductForMenuItem(businessId, menuItem);

  const cart = await createCart(businessId, visit.session.id, branchId);
  await addItem(businessId, visit.session.id, menuItem.id, options.quantity ?? 2, branchId);

  const orderSession = await createOrderSession(businessId, cart.id, visit.session.id, {
    branchId,
  });
  await markOrderSessionReady(orderSession.id);

  const order = await createOrderFromSessionForVerification(orderSession.id, branchId);

  return { order, cart, orderSession, visit, qrCode, menuItem };
}

async function listOrdersWithRetry(
  businessId: string,
  branchId: string,
  attempts = 5,
): Promise<Awaited<ReturnType<typeof listOrders>>> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await listOrders(businessId, { branchId });
    } catch (error) {
      lastError = error;
      await prisma.$disconnect().catch(() => undefined);
      await connectWithRetry(verifyPrisma);
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }

  throw lastError;
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

  console.log("Create order from QR flow");
  const { order, cart, orderSession, visit, qrCode, menuItem } =
    await createOrderFromQrFlowForVerification(business.id, ownerId, suffix, branchId, {
      quantity: 2,
      price: 15.5,
    });
  const cartWithItems = await getCartById(cart.id);
  const cartItem = cartWithItems.items[0];
  assert(cartItem, "cart item missing");
  assert(order.id, "order should be created");
  assert(order.orderNumber.startsWith("ORD-"), "order number should be generated");
  console.log("  PASS");

  console.log("OrderItems created");
  assert(order.items.length === 1, "order items should be created");
  console.log("  PASS");

  console.log("Prices snapshotted");
  assert(order.items[0]?.unitPrice === cartItem.unitPrice, "unit price snapshot failed");
  assert(order.items[0]?.totalPrice === cartItem.totalPrice, "total price snapshot failed");
  console.log("  PASS");

  console.log("Quantities snapshotted");
  assert(order.items[0]?.quantity === cartItem.quantity, "quantity snapshot failed");
  console.log("  PASS");

  console.log("Order number generated");
  const duplicate = await verifyPrisma.restaurantOrder.findFirst({
    where: { businessId: business.id, orderNumber: order.orderNumber },
  });
  assert(duplicate?.id === order.id, "order number uniqueness failed");
  console.log("  PASS");

  console.log("Cart locked");
  const lockedCart = await getCartById(cart.id);
  assert(lockedCart.status === "COMPLETED", "cart should be completed");
  console.log("  PASS");

  console.log("Session completed");
  const completedSession = await verifyPrisma.orderSession.findUnique({
    where: { id: orderSession.id },
  });
  assert(completedSession?.status === "COMPLETED", "order session should be completed");
  console.log("  PASS");

  console.log("Name snapshotted");
  assert(order.items[0]?.nameSnapshot === menuItem.name, "name snapshot failed");
  console.log("  PASS");

  console.log("Get order");
  const fetched = await getOrder(order.id, business.id, branchId);
  assert(fetched.id === order.id, "getOrder failed");
  console.log("  PASS");

  console.log("List orders");
  const orders = await listOrdersWithRetry(business.id, branchId);
  assert(
    orders.some((entry) => entry.id === order.id),
    "listOrders failed",
  );
  console.log("  PASS");

  console.log("Cancel order");
  const cancelScope = buildOrderScopeFromInput({
    businessId: business.id,
    branchId,
    userId: "system",
  });
  await orderRepository.cancel(cancelScope, order.id);
  const cancelled = await getOrder(order.id, business.id, branchId);
  assert(cancelled.status === "CANCELLED", "cancelOrder failed");
  console.log("  PASS");

  console.log("Cleanup");
  await cleanupRestaurantOrder(verifyPrisma, order.id);
  await verifyPrisma.orderSession.delete({ where: { id: orderSession.id } });
  await verifyPrisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await verifyPrisma.cart.delete({ where: { id: cart.id } });
  await verifyPrisma.qRMenuSession.delete({ where: { id: visit.session.id } });
  await deleteQRCode(ownerId, qrCode.id);
  console.log("  PASS");

  console.log("\nAll order engine checks passed.");
}

main()
  .catch(handleVerificationError)
  .finally(async () => {
    await verifyPrisma.$disconnect();
  });
