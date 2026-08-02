"use server";

import { cookies } from "next/headers";

import {
  toOrderItemsFromCart,
  validateQrCartState,
} from "@/modules/qr-ordering-management/lib/qr-ordering-validation";
import {
  calculateCartTotal,
  parseStoredCart,
} from "@/modules/qr-ordering-management/lib/qr-cart-utils";
import { writeQrSessionCookie } from "@/modules/qr-ordering-management/lib/qr-session-cookie";
import type {
  QrCartItem,
  QrOrderTrackingRecord,
  QrPlaceOrderInput,
} from "@/modules/qr-ordering-management/types/qr-ordering-types";
import { QR_SESSION_COOKIE } from "@/modules/qr-ordering-management/constants/routes";
import {
  getQrOrderTracking,
  listQrSessionOrders,
  loadPublicQrMenu,
  placeQrOrder,
  requestQrBill,
  requestQrWaiter,
  resolveQrSessionForTable,
  startOrResumeQrSession,
} from "@/services/restaurant-qr-ordering.service";

export async function initializeQrSessionAction(tableToken: string) {
  const session = await startOrResumeQrSession(tableToken);
  await writeQrSessionCookie(session.token);
  return session;
}

export async function loadQrMenuAction(sessionToken: string) {
  return loadPublicQrMenu(sessionToken);
}

export async function placeQrOrderAction(input: QrPlaceOrderInput): Promise<QrOrderTrackingRecord> {
  return placeQrOrder(input);
}

export async function placeQrOrderFromCartAction(input: {
  sessionToken: string;
  cartJson: string;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  idempotencyKey?: string;
}): Promise<QrOrderTrackingRecord> {
  const cart = parseStoredCart(input.cartJson);
  const menu = await loadPublicQrMenu(input.sessionToken);
  validateQrCartState(cart.items, menu.products);

  const total = calculateCartTotal(cart.items);
  if (total <= 0) {
    throw new Error("Order total must be greater than zero");
  }

  return placeQrOrder({
    sessionToken: input.sessionToken,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    notes: input.notes,
    items: toOrderItemsFromCart(cart.items),
    idempotencyKey: input.idempotencyKey,
  });
}

export async function getQrOrderTrackingAction(sessionToken: string, orderId: string) {
  return getQrOrderTracking(sessionToken, orderId);
}

export async function listQrSessionOrdersAction(sessionToken: string) {
  return listQrSessionOrders(sessionToken);
}

export async function requestQrWaiterAction(sessionToken: string) {
  return requestQrWaiter(sessionToken);
}

export async function requestQrBillAction(sessionToken: string) {
  return requestQrBill(sessionToken);
}

export async function resolveQrSessionFromCookieAction(tableToken: string) {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(QR_SESSION_COOKIE)?.value ?? null;
  const session = await resolveQrSessionForTable(tableToken, existingToken);
  await writeQrSessionCookie(session.token);
  return session;
}

export type { QrCartItem };
