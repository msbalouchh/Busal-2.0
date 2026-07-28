import { PrismaClient } from "@prisma/client";

import { addItem, createCart, getCartById } from "../src/services/cart.service";
import {
  cancelOrder,
  createOrderFromSession,
  getOrder,
  listOrders,
} from "../src/services/order.service";
import { createOrderSession, markOrderSessionReady } from "../src/services/order-session.service";
import { createQRCode, deleteQRCode, recordPublicMenuVisit } from "../src/services/qr-menu.service";

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const business = await prisma.business.findFirst({
    select: { ownerId: true, id: true },
  });
  assert(business, "No business found");

  const ownerId = business.ownerId;
  const suffix = Date.now();
  const slug = `order-engine-${suffix}`;

  const qrCode = await createQRCode(ownerId, { slug });
  const visit = await recordPublicMenuVisit(ownerId, qrCode.id, {
    sessionToken: `order-engine-token-${suffix}`,
  });

  let menuItem = await prisma.menuItem.findFirst({
    where: { businessId: business.id, isAvailable: true },
    select: { id: true, name: true, price: true },
  });

  if (!menuItem) {
    menuItem = await prisma.menuItem.create({
      data: {
        businessId: business.id,
        name: `Order Engine Item ${suffix}`,
        price: 15.5,
        isAvailable: true,
      },
      select: { id: true, name: true, price: true },
    });
  }

  const cart = await createCart(business.id, visit.session.id);
  await addItem(business.id, visit.session.id, menuItem.id, 2);
  const cartWithItems = await getCartById(cart.id);
  const cartItem = cartWithItems.items[0];
  assert(cartItem, "cart item missing");

  const orderSession = await createOrderSession(business.id, cart.id, visit.session.id);
  await markOrderSessionReady(orderSession.id);

  console.log("Order created");
  const order = await createOrderFromSession(orderSession.id);
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
  const duplicate = await prisma.order.findFirst({
    where: { businessId: business.id, orderNumber: order.orderNumber },
  });
  assert(duplicate?.id === order.id, "order number uniqueness failed");
  console.log("  PASS");

  console.log("Cart locked");
  const lockedCart = await getCartById(cart.id);
  assert(lockedCart.status === "COMPLETED", "cart should be completed");
  console.log("  PASS");

  console.log("Session completed");
  const completedSession = await prisma.orderSession.findUnique({
    where: { id: orderSession.id },
  });
  assert(completedSession?.status === "COMPLETED", "order session should be completed");
  console.log("  PASS");

  console.log("Name snapshotted");
  assert(order.items[0]?.nameSnapshot === menuItem.name, "name snapshot failed");
  console.log("  PASS");

  console.log("Get order");
  const fetched = await getOrder(order.id);
  assert(fetched.id === order.id, "getOrder failed");
  console.log("  PASS");

  console.log("List orders");
  const orders = await listOrders(business.id);
  assert(
    orders.some((entry) => entry.id === order.id),
    "listOrders failed",
  );
  console.log("  PASS");

  console.log("Cancel order");
  const cancelled = await cancelOrder(order.id);
  assert(cancelled.status === "CANCELLED", "cancelOrder failed");
  console.log("  PASS");

  console.log("Cleanup");
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  await prisma.orderSession.delete({ where: { id: orderSession.id } });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.delete({ where: { id: cart.id } });
  await prisma.qRMenuSession.delete({ where: { id: visit.session.id } });
  await deleteQRCode(ownerId, qrCode.id);
  console.log("  PASS");

  console.log("\nAll order engine checks passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
