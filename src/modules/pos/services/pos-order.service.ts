import "server-only";

import { prisma } from "@/lib/prisma";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import {
  abandonCart,
  addItem,
  clearCart,
  createCart,
  getActiveCart,
  getCartById,
  removeItem,
  updateQuantity,
  type CartData,
} from "@/services/cart.service";
import { getQueue } from "@/services/kitchen-queue.service";
import {
  assignTable,
  createOrderSession,
  getActiveOrderSessionByCartId,
  getOrderSession,
  markOrderSessionReady,
  updateOrderNotes,
} from "@/services/order-session.service";
import { createOrderFromSession } from "@/services/order.service";
import {
  POS_HELD_ORDER_PREFIX,
  POS_ORDER_TYPE_PREFIX,
  type PosOrderType,
} from "@/modules/pos/constants/routes";
import type { PosHeldOrderView, PosSendToKitchenResult } from "@/modules/pos/types/pos";
import { createPosHoldParkingSession } from "@/modules/pos/services/pos-session.service";

async function moveCartToSession(
  cartId: string,
  orderSessionId: string,
  targetSessionId: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.cart.update({
      where: { id: cartId },
      data: { qrMenuSessionId: targetSessionId },
    }),
    prisma.orderSession.update({
      where: { id: orderSessionId },
      data: { qrMenuSessionId: targetSessionId },
    }),
  ]);
}

async function ensurePosTerminalCart(businessId: string, posSessionId: string): Promise<CartData> {
  const activeCart = await getActiveCart(posSessionId);

  if (activeCart) {
    return activeCart;
  }

  return createCart(businessId, posSessionId);
}

function encodeOrderType(orderType: PosOrderType): string {
  return `${POS_ORDER_TYPE_PREFIX}${orderType}`;
}

function decodeOrderType(orderNotes: string | null): PosOrderType {
  if (!orderNotes?.startsWith(POS_ORDER_TYPE_PREFIX)) {
    return "DINE_IN";
  }

  const value = orderNotes.slice(POS_ORDER_TYPE_PREFIX.length).split("|")[0];
  if (value === "TAKEAWAY" || value === "DELIVERY" || value === "DINE_IN") {
    return value;
  }

  return "DINE_IN";
}

function buildPosOrderNotes(options: {
  orderType: PosOrderType;
  heldLabel?: string;
  notes?: string | null;
}): string {
  const parts = [encodeOrderType(options.orderType)];

  if (options.heldLabel) {
    parts.unshift(`${POS_HELD_ORDER_PREFIX}${options.heldLabel}`);
  }

  if (options.notes?.trim()) {
    parts.push(options.notes.trim());
  }

  return parts.join(" | ");
}

function isHeldOrderNotes(orderNotes: string | null): boolean {
  return Boolean(orderNotes?.includes(POS_HELD_ORDER_PREFIX));
}

function extractHeldLabel(orderNotes: string | null): string {
  if (!orderNotes) {
    return "Held order";
  }

  const heldSegment = orderNotes
    .split("|")
    .map((part) => part.trim())
    .find((part) => part.startsWith(POS_HELD_ORDER_PREFIX));

  if (!heldSegment) {
    return "Held order";
  }

  return heldSegment.slice(POS_HELD_ORDER_PREFIX.length).trim() || "Held order";
}

export async function getOrCreatePosCart(
  businessId: string,
  posSessionId: string,
): Promise<CartData> {
  const active = await getActiveCart(posSessionId);
  if (active) {
    return active;
  }

  return createCart(businessId, posSessionId);
}

export async function resolvePosCart(
  businessId: string,
  posSessionId: string,
  cartId?: string,
): Promise<CartData> {
  if (cartId) {
    const cart = await getCartById(cartId);
    if (cart.businessId !== businessId) {
      throw new Error("Cart not found");
    }
    return cart;
  }

  return getOrCreatePosCart(businessId, posSessionId);
}

export async function listHeldPosOrders(
  businessId: string,
  branchId: string | null = null,
): Promise<PosHeldOrderView[]> {
  const sessions = await prisma.orderSession.findMany({
    where: {
      businessId,
      ...branchFilter(branchId),
      status: "ACTIVE",
      orderNotes: { contains: POS_HELD_ORDER_PREFIX },
    },
    include: {
      cart: {
        include: {
          items: true,
        },
      },
      table: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return sessions.map((session) => ({
    orderSessionId: session.id,
    cartId: session.cartId,
    label: extractHeldLabel(session.orderNotes),
    tableId: session.tableId,
    tableName: session.table?.name ?? null,
    orderType: decodeOrderType(session.orderNotes),
    itemCount: session.cart.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: Number(session.cart.subtotal),
    updatedAt: session.updatedAt.toISOString(),
  }));
}

export async function holdPosOrder(options: {
  businessId: string;
  cartId: string;
  posSessionId: string;
  branchId?: string | null;
  label?: string;
  tableId?: string | null;
  orderType?: PosOrderType;
  customerName?: string | null;
  orderNotes?: string | null;
}): Promise<PosHeldOrderView> {
  const cart = await getCartById(options.cartId);

  if (cart.businessId !== options.businessId) {
    throw new Error("Cart not found");
  }

  if (cart.items.length === 0) {
    throw new Error("Cannot hold an empty order");
  }

  const orderType = options.orderType ?? "DINE_IN";
  const heldNotes = buildPosOrderNotes({
    orderType,
    heldLabel: options.label ?? `Ticket ${new Date().toLocaleTimeString()}`,
    notes: options.orderNotes,
  });

  let session = await getActiveOrderSessionByCartId(cart.id);

  if (!session) {
    session = await createOrderSession(options.businessId, cart.id, cart.qrMenuSessionId, {
      branchId: options.branchId ?? null,
      tableId: options.tableId ?? null,
      customerName: options.customerName ?? undefined,
      orderNotes: heldNotes,
    });
  } else {
    session = await updateOrderNotes(session.id, heldNotes);
    if (options.tableId !== undefined) {
      session = await assignTable(session.id, options.tableId);
    }
  }

  const parkingSession = await createPosHoldParkingSession(options.businessId);
  await moveCartToSession(cart.id, session.id, parkingSession.id);
  await ensurePosTerminalCart(options.businessId, options.posSessionId);

  const heldOrders = await listHeldPosOrders(options.businessId, options.branchId ?? null);
  const held = heldOrders.find((entry) => entry.orderSessionId === session.id);

  if (!held) {
    throw new Error("Held order not found after save");
  }

  return held;
}

export async function resumePosOrder(options: {
  businessId: string;
  orderSessionId: string;
  posSessionId: string;
}): Promise<CartData> {
  const session = await getOrderSession(options.orderSessionId);

  if (session.businessId !== options.businessId) {
    throw new Error("Held order not found");
  }

  if (!isHeldOrderNotes(session.orderNotes)) {
    throw new Error("Order is not held");
  }

  const activeCart = await getActiveCart(options.posSessionId);
  if (activeCart && activeCart.items.length > 0) {
    throw new Error("Clear or hold the current order before resuming another ticket");
  }

  if (activeCart && activeCart.id !== session.cartId) {
    await abandonCart(activeCart.id);
  }

  await moveCartToSession(session.cartId, session.id, options.posSessionId);

  return getCartById(session.cartId);
}

export async function clearPosOrder(cartId: string, businessId: string): Promise<CartData> {
  const cart = await getCartById(cartId);

  if (cart.businessId !== businessId) {
    throw new Error("Cart not found");
  }

  return clearCart(cart.id);
}

export async function sendPosOrderToKitchen(options: {
  businessId: string;
  cartId: string;
  posSessionId: string;
  branchId?: string | null;
  tableId?: string | null;
  orderType?: PosOrderType;
  customerName?: string | null;
  orderNotes?: string | null;
}): Promise<PosSendToKitchenResult> {
  const cart = await getCartById(options.cartId);

  if (cart.businessId !== options.businessId) {
    throw new Error("Cart not found");
  }

  if (cart.items.length === 0) {
    throw new Error("Cannot send an empty order to the kitchen");
  }

  const orderType = options.orderType ?? "DINE_IN";
  const notes = buildPosOrderNotes({
    orderType,
    notes: options.orderNotes,
  });

  let session = await getActiveOrderSessionByCartId(cart.id);

  if (!session) {
    session = await createOrderSession(options.businessId, cart.id, cart.qrMenuSessionId, {
      branchId: options.branchId ?? null,
      tableId: options.tableId ?? null,
      customerName: options.customerName ?? undefined,
      orderNotes: notes,
    });
  } else {
    session = await updateOrderNotes(session.id, notes);
    if (options.tableId !== undefined) {
      session = await assignTable(session.id, options.tableId);
    }
  }

  if (isHeldOrderNotes(session.orderNotes)) {
    const cleanedNotes = buildPosOrderNotes({ orderType, notes: options.orderNotes });
    session = await updateOrderNotes(session.id, cleanedNotes);
  }

  await markOrderSessionReady(session.id);
  const order = await createOrderFromSession(session.id, options.branchId ?? null);

  const queue = await getQueue(options.businessId, {
    status: "NEW",
    branchId: options.branchId ?? null,
  });
  const kitchenQueueItem = queue.find((entry) => entry.orderId === order.id);

  await ensurePosTerminalCart(options.businessId, options.posSessionId);

  if (!kitchenQueueItem) {
    throw new Error("Kitchen queue entry not found");
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    kitchenQueueId: kitchenQueueItem.id,
  };
}

export { addItem, removeItem, updateQuantity, assignTable, getCartById };
