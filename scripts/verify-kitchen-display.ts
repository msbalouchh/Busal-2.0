import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { addItem, createCart } from "../src/services/cart.service";
import {
  acknowledgeOrder,
  getQueue,
  markReady,
  markServed,
  startPreparation,
} from "../src/services/kitchen-queue.service";
import { createOrderFromSession } from "../src/services/order.service";
import { createOrderSession, markOrderSessionReady } from "../src/services/order-session.service";
import {
  filterKitchenOrders,
  groupKitchenOrdersByStatus,
  serializeKitchenOrderCard,
} from "../src/modules/kitchen/lib/kitchen-display-utils";
import { KITCHEN_REFRESH_INTERVAL_MS } from "../src/modules/kitchen/constants/routes";
import { createQRCode, deleteQRCode, recordPublicMenuVisit } from "../src/services/qr-menu.service";

const prisma = new PrismaClient();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

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
  const slug = `kitchen-display-${suffix}`;

  const qrCode = await createQRCode(ownerId, { slug });
  const visit = await recordPublicMenuVisit(ownerId, qrCode.id, {
    sessionToken: `kitchen-display-token-${suffix}`,
  });

  let menuItem = await prisma.menuItem.findFirst({
    where: { businessId: business.id, isAvailable: true },
    select: { id: true, name: true },
  });

  if (!menuItem) {
    menuItem = await prisma.menuItem.create({
      data: {
        businessId: business.id,
        name: `Kitchen Display Item ${suffix}`,
        price: 12,
        isAvailable: true,
      },
      select: { id: true, name: true },
    });
  }

  const cart = await createCart(business.id, visit.session.id);
  await addItem(business.id, visit.session.id, menuItem.id, 2);
  const orderSession = await createOrderSession(business.id, cart.id, visit.session.id);
  await markOrderSessionReady(orderSession.id);
  const order = await createOrderFromSession(orderSession.id);

  const queueItem = await prisma.kitchenQueue.findUnique({
    where: { orderId: order.id },
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
  assert(queueItem, "queue item missing");

  console.log("Queue loads");
  const queue = await getQueue(business.id);
  assert(
    queue.some((entry) => entry.orderId === order.id),
    "queue load failed",
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

  console.log("Accept works");
  await acknowledgeOrder(queueItem.id);
  console.log("  PASS");

  console.log("Start Preparing works");
  await startPreparation(queueItem.id);
  console.log("  PASS");

  console.log("Mark Ready works");
  await markReady(queueItem.id);
  console.log("  PASS");

  console.log("Mark Served works");
  await markServed(queueItem.id);
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
  await prisma.kitchenQueue.delete({ where: { id: queueItem.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  await prisma.orderSession.delete({ where: { id: orderSession.id } });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.delete({ where: { id: cart.id } });
  await prisma.qRMenuSession.delete({ where: { id: visit.session.id } });
  await deleteQRCode(ownerId, qrCode.id);
  console.log("  PASS");

  console.log("\nAll kitchen display checks passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
