import { PrismaClient } from "@prisma/client";

import { addItem, createCart } from "../src/services/cart.service";
import {
  acknowledgeOrder,
  getQueue,
  getQueueItem,
  listOrdersByStatus,
  markReady,
  markServed,
  startPreparation,
} from "../src/services/kitchen-queue.service";
import { createOrderFromSession } from "../src/services/order.service";
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
  const slug = `kitchen-queue-${suffix}`;

  const qrCode = await createQRCode(ownerId, { slug });
  const visit = await recordPublicMenuVisit(ownerId, qrCode.id, {
    sessionToken: `kitchen-queue-token-${suffix}`,
  });

  let menuItem = await prisma.menuItem.findFirst({
    where: { businessId: business.id, isAvailable: true },
    select: { id: true },
  });

  if (!menuItem) {
    menuItem = await prisma.menuItem.create({
      data: {
        businessId: business.id,
        name: `Kitchen Queue Item ${suffix}`,
        price: 10,
        isAvailable: true,
      },
      select: { id: true },
    });
  }

  const cart = await createCart(business.id, visit.session.id);
  await addItem(business.id, visit.session.id, menuItem.id);

  const orderSession = await createOrderSession(business.id, cart.id, visit.session.id);
  await markOrderSessionReady(orderSession.id);

  console.log("Queue entry created after Order creation");
  const order = await createOrderFromSession(orderSession.id);
  const queueItem = await prisma.kitchenQueue.findUnique({ where: { orderId: order.id } });
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
  const queue = await getQueue(business.id);
  assert(
    queue.some((entry) => entry.id === queueItem.id),
    "getQueue failed",
  );
  const byStatus = await listOrdersByStatus(business.id, "SERVED");
  assert(
    byStatus.some((entry) => entry.id === queueItem.id),
    "listOrdersByStatus failed",
  );
  console.log("  PASS");

  console.log("Cleanup");
  await prisma.kitchenQueue.delete({ where: { id: queueItem.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  await prisma.orderSession.delete({ where: { id: orderSession.id } });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.delete({ where: { id: cart.id } });
  await prisma.qRMenuSession.delete({ where: { id: visit.session.id } });
  await deleteQRCode(ownerId, qrCode.id);
  console.log("  PASS");

  console.log("\nAll kitchen queue checks passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
