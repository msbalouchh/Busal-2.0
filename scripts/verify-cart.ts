import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  addItem,
  calculateSubtotal,
  clearCart,
  createCart,
  getActiveCart,
  getCartById,
  removeItem,
  updateQuantity,
} from "../src/services/cart.service";
import { createQRCode, deleteQRCode, recordPublicMenuVisit } from "../src/services/qr-menu.service";
import { connectWithRetry, handleVerificationError } from "./lib/verify-db";
import { ensureVerificationTenantContext } from "./lib/verify-oms-order";
import { getVerifyPrisma } from "./lib/verify-prisma";

const prisma = getVerifyPrisma();
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  await connectWithRetry(prisma);

  const business = await prisma.business.findFirst({
    select: { ownerId: true, id: true },
  });
  assert(business, "No business found");

  const { branchId } = await ensureVerificationTenantContext(prisma, business.id);
  const ownerId = business.ownerId;
  const suffix = Date.now();
  const slug = `cart-verify-${suffix}`;

  const qrCode = await createQRCode(ownerId, { slug, branchId });
  const visit = await recordPublicMenuVisit(ownerId, qrCode.id, {
    sessionToken: `cart-session-${suffix}`,
  });

  let menuItem = await prisma.menuItem.findFirst({
    where: { businessId: business.id, isAvailable: true },
    select: { id: true, price: true },
  });

  if (!menuItem) {
    menuItem = await prisma.menuItem.create({
      data: {
        businessId: business.id,
        branchId,
        name: `Cart Verify Item ${suffix}`,
        price: 12.5,
        isAvailable: true,
      },
      select: { id: true, price: true },
    });
  }

  const itemPrice = Number(menuItem.price);

  console.log("Create cart");
  const cart = await createCart(business.id, visit.session.id, branchId);
  assert(cart.status === "ACTIVE", "cart should be active");
  assert(cart.subtotal === 0, "initial subtotal should be 0");
  console.log("  PASS");

  console.log("One active cart per session");
  let duplicateBlocked = false;
  try {
    await createCart(business.id, visit.session.id);
  } catch (error) {
    duplicateBlocked = error instanceof Error && error.message.includes("active cart");
  }
  assert(duplicateBlocked, "duplicate active cart should fail");
  console.log("  PASS");

  console.log("Add item");
  const withItem = await addItem(business.id, visit.session.id, menuItem.id, 1, branchId);
  assert(withItem.items.length === 1, "cart should have one item");
  assert(withItem.subtotal === itemPrice, "subtotal should match item price");
  console.log("  PASS");

  console.log("Increase quantity");
  const cartItemId = withItem.items[0]?.id;
  assert(cartItemId, "cart item id missing");
  const increased = await updateQuantity(cartItemId, 2);
  assert(increased.items[0]?.quantity === 2, "quantity should be 2");
  assert(increased.subtotal === itemPrice * 2, "subtotal should reflect quantity");
  console.log("  PASS");

  console.log("Decrease quantity");
  const decreased = await updateQuantity(cartItemId, 1);
  assert(decreased.items[0]?.quantity === 1, "quantity should be 1");
  assert(decreased.subtotal === itemPrice, "subtotal should decrease");
  console.log("  PASS");

  console.log("Remove item");
  const removed = await removeItem(cartItemId);
  assert(removed.items.length === 0, "cart should have no items");
  assert(removed.subtotal === 0, "subtotal should be 0 after remove");
  console.log("  PASS");

  console.log("Clear cart");
  const refilled = await addItem(business.id, visit.session.id, menuItem.id, 1, branchId);
  const cleared = await clearCart(refilled.id);
  assert(cleared.items.length === 0, "clear cart should remove items");
  assert(cleared.subtotal === 0, "clear cart subtotal should be 0");
  console.log("  PASS");

  console.log("Subtotal calculation");
  const subtotal = calculateSubtotal([{ totalPrice: 10 }, { totalPrice: 5.5 }]);
  assert(subtotal === 15.5, "calculateSubtotal failed");
  console.log("  PASS");

  console.log("Get active cart");
  await addItem(business.id, visit.session.id, menuItem.id, 1, branchId);
  const active = await getActiveCart(visit.session.id);
  assert(active?.id === cart.id, "getActiveCart failed");
  console.log("  PASS");

  console.log("Get cart by id");
  const byId = await getCartById(cart.id);
  assert(byId.id === cart.id, "getCartById failed");
  console.log("  PASS");

  console.log("Floating cart updates");
  const cartUi = readFileSync(
    join(root, "src/modules/public-menu/components/public-menu-cart.tsx"),
    "utf8",
  );
  assert(cartUi.includes("itemCount"), "floating cart should show item count");
  assert(cartUi.includes("subtotalLabel"), "floating cart should show subtotal");
  console.log("  PASS");

  console.log("Empty cart state");
  assert(cartUi.includes("Your cart is empty."), "empty cart message missing");
  console.log("  PASS");

  console.log("Cleanup");
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.delete({ where: { id: cart.id } });
  await prisma.qRMenuSession.delete({ where: { id: visit.session.id } });
  await deleteQRCode(ownerId, qrCode.id);
  console.log("  PASS");

  console.log("\nAll cart foundation checks passed.");
}

main()
  .catch(handleVerificationError)
  .finally(async () => {
    await prisma.$disconnect();
  });
