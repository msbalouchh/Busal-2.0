import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { addItem, createCart } from "../src/services/cart.service";
import {
  assignTable,
  createOrderSession,
  expireSession,
  getActiveOrderSessionByCartId,
  getOrderSession,
  updateCustomerInfo,
  updateOrderNotes,
  validateSession,
} from "../src/services/order-session.service";
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
  const slug = `order-session-${suffix}`;

  const qrCode = await createQRCode(ownerId, { slug });
  const visit = await recordPublicMenuVisit(ownerId, qrCode.id, {
    sessionToken: `order-session-token-${suffix}`,
  });

  let menuItem = await prisma.menuItem.findFirst({
    where: { businessId: business.id, isAvailable: true },
    select: { id: true },
  });

  if (!menuItem) {
    menuItem = await prisma.menuItem.create({
      data: {
        businessId: business.id,
        name: `Order Session Item ${suffix}`,
        price: 9.99,
        isAvailable: true,
      },
      select: { id: true },
    });
  }

  const cart = await createCart(business.id, visit.session.id);

  console.log("Cart validation");
  let emptyCartBlocked = false;
  try {
    await createOrderSession(business.id, cart.id, visit.session.id);
  } catch (error) {
    emptyCartBlocked = error instanceof Error && error.message.includes("at least one item");
  }
  assert(emptyCartBlocked, "empty cart should fail");
  console.log("  PASS");

  await addItem(business.id, visit.session.id, menuItem.id);

  console.log("Create OrderSession");
  const orderSession = await createOrderSession(business.id, cart.id, visit.session.id, {
    tableId: visit.session.tableId,
  });
  assert(orderSession.status === "ACTIVE", "order session should be active");
  console.log("  PASS");

  console.log("One active OrderSession per Cart");
  let duplicateBlocked = false;
  try {
    await createOrderSession(business.id, cart.id, visit.session.id);
  } catch (error) {
    duplicateBlocked = error instanceof Error && error.message.includes("active order session");
  }
  assert(duplicateBlocked, "duplicate active order session should fail");
  console.log("  PASS");

  console.log("Table assignment");
  let table = await prisma.legacyTable.findFirst({
    where: { businessId: business.id },
    select: { id: true },
  });
  if (!table) {
    table = await prisma.legacyTable.create({
      data: {
        businessId: business.id,
        name: `Verify Table ${suffix}`,
        capacity: 4,
      },
      select: { id: true },
    });
  }
  const assigned = await assignTable(orderSession.id, table.id);
  assert(assigned.tableId === table.id, "table assignment failed");
  console.log("  PASS");

  console.log("Customer information saved");
  const withCustomer = await updateCustomerInfo(orderSession.id, {
    customerName: "Test Customer",
    customerPhone: "555-0100",
  });
  assert(withCustomer.customerName === "Test Customer", "customer name not saved");
  assert(withCustomer.customerPhone === "555-0100", "customer phone not saved");
  console.log("  PASS");

  console.log("Notes saved");
  const withNotes = await updateOrderNotes(orderSession.id, "Extra napkins please");
  assert(withNotes.orderNotes === "Extra napkins please", "notes not saved");
  console.log("  PASS");

  console.log("Validate session");
  const validated = await validateSession(orderSession.id);
  assert(validated.id === orderSession.id, "validate session failed");
  console.log("  PASS");

  console.log("Get order session");
  const fetched = await getOrderSession(orderSession.id);
  assert(fetched.id === orderSession.id, "getOrderSession failed");
  console.log("  PASS");

  console.log("Get active order session by cart");
  const active = await getActiveOrderSessionByCartId(cart.id);
  assert(active?.id === orderSession.id, "getActiveOrderSessionByCartId failed");
  console.log("  PASS");

  console.log("Continue button enabled only when valid");
  const reviewSource = readFileSync(
    join(root, "src/modules/public-menu/components/order-review-screen.tsx"),
    "utf8",
  );
  assert(reviewSource.includes("isOrderReviewValid"), "review validation missing");
  assert(reviewSource.includes("disabled={!canContinue || isPending}"), "continue guard missing");
  console.log("  PASS");

  console.log("Expire session");
  const expired = await expireSession(orderSession.id);
  assert(expired.status === "EXPIRED", "expire session failed");
  console.log("  PASS");

  console.log("Cleanup");
  await prisma.orderSession.delete({ where: { id: orderSession.id } });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.delete({ where: { id: cart.id } });
  await prisma.qRMenuSession.delete({ where: { id: visit.session.id } });
  await deleteQRCode(ownerId, qrCode.id);
  if (table) {
    const tableInUse = await prisma.orderSession.count({ where: { tableId: table.id } });
    if (tableInUse === 0) {
      await prisma.legacyTable.delete({ where: { id: table.id } }).catch(() => undefined);
    }
  }
  console.log("  PASS");

  console.log("\nAll order session checks passed.");
}

main()
  .catch((error) => {
    console.error("\nFIRST ERROR:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
