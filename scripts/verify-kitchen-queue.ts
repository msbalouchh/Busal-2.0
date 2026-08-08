import {
  acknowledgeOrder,
  getQueue,
  getQueueItem,
  listOrdersByStatus,
  markReady,
  markServed,
  startPreparation,
} from "../src/services/kitchen-queue.service";
import { createQRCode, deleteQRCode } from "../src/services/qr-menu.service";
import { handleVerificationError } from "./lib/verify-db";
import { cleanupRestaurantOrder, createOmsOrderFromQrFlow } from "./lib/verify-oms-order";
import { getVerifyPrisma } from "./lib/verify-prisma";

const prisma = getVerifyPrisma();

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
  const suffix = Date.now().toString();

  const { order, branchId, cart, orderSession, visit, qrCode } = await createOmsOrderFromQrFlow(
    prisma,
    business.id,
    ownerId,
    suffix,
    { slugPrefix: "kitchen-queue" },
  );

  const legacyOrder = await prisma.legacyOrder.findUnique({
    where: { orderSessionId: orderSession.id },
    select: { id: true },
  });
  assert(legacyOrder, "legacy kitchen order missing");

  console.log("Queue entry created after Order creation");
  const queueItem = await prisma.kitchenQueue.findUnique({
    where: { orderId: legacyOrder.id },
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
    queue.some((entry) => entry.id === queueItem.id),
    "getQueue failed",
  );
  const byStatus = await listOrdersByStatus(business.id, "SERVED", branchId);
  assert(
    byStatus.some((entry) => entry.id === queueItem.id),
    "listOrdersByStatus failed",
  );
  console.log("  PASS");

  console.log("Cleanup");
  await prisma.kitchenQueue.delete({ where: { id: queueItem.id } });
  await prisma.legacyOrderItem.deleteMany({ where: { orderId: legacyOrder.id } });
  await prisma.legacyOrder.delete({ where: { id: legacyOrder.id } });
  await cleanupRestaurantOrder(prisma, order.id);
  await prisma.orderSession.delete({ where: { id: orderSession.id } });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.delete({ where: { id: cart.id } });
  await prisma.qRMenuSession.delete({ where: { id: visit.session.id } });
  await deleteQRCode(ownerId, qrCode.id);
  console.log("  PASS");

  console.log("\nAll kitchen queue checks passed.");
}

main()
  .catch(handleVerificationError)
  .finally(async () => {
    await prisma.$disconnect();
  });
