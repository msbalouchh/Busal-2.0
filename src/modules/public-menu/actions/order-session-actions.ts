"use server";

import { serializeCart, type ClientCart } from "@/modules/public-menu/lib/cart-utils";
import { getValidatedPublicSession } from "@/modules/public-menu/lib/get-validated-public-session";
import {
  serializeOrderSession,
  type ClientOrderSession,
  type OrderReviewFormState,
} from "@/modules/public-menu/lib/order-session-utils";
import { getActiveCart } from "@/services/cart.service";
import {
  createOrderSession,
  getActiveOrderSessionByCartId,
  markOrderSessionReady,
  updateCustomerInfo,
  updateOrderNotes,
} from "@/services/order-session.service";
import { prisma } from "@/lib/prisma";

export async function getOrderReviewContextAction(slug: string): Promise<{
  cart: ClientCart;
  tableName: string | null;
  orderSession: ClientOrderSession | null;
}> {
  const { businessId, qrMenuSessionId, tableId } = await getValidatedPublicSession(slug);
  const cart = await getActiveCart(qrMenuSessionId);

  if (!cart) {
    throw new Error("Cart not found");
  }

  let tableName: string | null = null;

  if (tableId) {
    const table = await prisma.legacyTable.findFirst({
      where: { id: tableId, businessId },
      select: { name: true },
    });
    tableName = table?.name ?? null;
  }

  const activeSession = await getActiveOrderSessionByCartId(cart.id);

  return {
    cart: serializeCart(cart),
    tableName,
    orderSession: activeSession ? serializeOrderSession(activeSession) : null,
  };
}

export async function submitOrderSessionAction(
  slug: string,
  form: OrderReviewFormState,
): Promise<ClientOrderSession> {
  const { businessId, qrMenuSessionId, tableId } = await getValidatedPublicSession(slug);
  const cart = await getActiveCart(qrMenuSessionId);

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart must contain at least one item");
  }

  let orderSession = await getActiveOrderSessionByCartId(cart.id);

  if (!orderSession) {
    orderSession = await createOrderSession(businessId, cart.id, qrMenuSessionId, {
      tableId,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      orderNotes: form.orderNotes,
    });
  } else {
    orderSession = await updateCustomerInfo(orderSession.id, {
      customerName: form.customerName,
      customerPhone: form.customerPhone,
    });
    orderSession = await updateOrderNotes(orderSession.id, form.orderNotes);
  }

  const readySession = await markOrderSessionReady(orderSession.id);
  return serializeOrderSession(readySession);
}
