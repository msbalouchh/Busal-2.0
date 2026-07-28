import "server-only";

import { type OrderSessionStatus, type OrderSessionType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCartById } from "@/services/cart.service";

const DEFAULT_SESSION_HOURS = 2;

export interface OrderSessionData {
  id: string;
  businessId: string;
  cartId: string;
  qrMenuSessionId: string;
  sessionType: OrderSessionType;
  tableId: string | null;
  tableName: string | null;
  customerName: string | null;
  customerPhone: string | null;
  orderNotes: string | null;
  status: OrderSessionStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderSessionInput {
  sessionType?: OrderSessionType;
  tableId?: string | null;
  customerName?: string;
  customerPhone?: string;
  orderNotes?: string;
  branchId?: string | null;
}

export interface UpdateCustomerInfoInput {
  customerName?: string | null;
  customerPhone?: string | null;
}

function defaultExpiresAt(): Date {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + DEFAULT_SESSION_HOURS);
  return expiresAt;
}

function mapOrderSession(session: {
  id: string;
  businessId: string;
  cartId: string;
  qrMenuSessionId: string;
  sessionType: OrderSessionType;
  tableId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  orderNotes: string | null;
  status: OrderSessionStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  table: { name: string } | null;
}): OrderSessionData {
  return {
    id: session.id,
    businessId: session.businessId,
    cartId: session.cartId,
    qrMenuSessionId: session.qrMenuSessionId,
    sessionType: session.sessionType,
    tableId: session.tableId,
    tableName: session.table?.name ?? null,
    customerName: session.customerName,
    customerPhone: session.customerPhone,
    orderNotes: session.orderNotes,
    status: session.status,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

const orderSessionInclude = {
  table: { select: { name: true } },
} as const;

async function getOrderSessionRecord(orderSessionId: string) {
  const session = await prisma.orderSession.findUnique({
    where: { id: orderSessionId },
    include: orderSessionInclude,
  });

  if (!session) {
    throw new Error("Order session not found");
  }

  return session;
}

async function assertQrSessionValid(qrMenuSessionId: string, businessId: string): Promise<void> {
  const qrSession = await prisma.qRMenuSession.findFirst({
    where: { id: qrMenuSessionId, businessId },
    select: { id: true, endedAt: true },
  });

  if (!qrSession) {
    throw new Error("QR menu session not found");
  }

  if (qrSession.endedAt) {
    throw new Error("QR menu session is no longer valid");
  }
}

async function assertCartReadyForOrderSession(cartId: string, businessId: string): Promise<void> {
  const cart = await getCartById(cartId);

  if (cart.businessId !== businessId) {
    throw new Error("Cart not found");
  }

  if (cart.status !== "ACTIVE") {
    throw new Error("Cart must be active");
  }

  if (cart.items.length === 0) {
    throw new Error("Cart must contain at least one item");
  }
}

async function assertSingleActiveOrderSession(
  cartId: string,
  excludeOrderSessionId?: string,
): Promise<void> {
  const existing = await prisma.orderSession.findFirst({
    where: {
      cartId,
      status: "ACTIVE",
      ...(excludeOrderSessionId ? { id: { not: excludeOrderSessionId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("An active order session already exists for this cart");
  }
}

async function assertTableBelongsToBusiness(
  businessId: string,
  tableId: string | null | undefined,
): Promise<void> {
  if (!tableId) {
    return;
  }

  const table = await prisma.table.findFirst({
    where: { id: tableId, businessId },
    select: { id: true },
  });

  if (!table) {
    throw new Error("Table not found");
  }
}

export async function getActiveOrderSessionByCartId(
  cartId: string,
): Promise<OrderSessionData | null> {
  const session = await prisma.orderSession.findFirst({
    where: { cartId, status: "ACTIVE" },
    include: orderSessionInclude,
  });

  return session ? mapOrderSession(session) : null;
}

export async function createOrderSession(
  businessId: string,
  cartId: string,
  qrMenuSessionId: string,
  input: CreateOrderSessionInput = {},
): Promise<OrderSessionData> {
  await assertQrSessionValid(qrMenuSessionId, businessId);
  await assertCartReadyForOrderSession(cartId, businessId);
  await assertSingleActiveOrderSession(cartId);
  await assertTableBelongsToBusiness(businessId, input.tableId);

  const cart = await getCartById(cartId);

  if (cart.qrMenuSessionId !== qrMenuSessionId) {
    throw new Error("Cart does not belong to this QR menu session");
  }

  const session = await prisma.orderSession.create({
    data: {
      businessId,
      branchId: input.branchId ?? null,
      cartId,
      qrMenuSessionId,
      sessionType: input.sessionType ?? "DINE_IN",
      tableId: input.tableId ?? null,
      customerName: input.customerName?.trim() || null,
      customerPhone: input.customerPhone?.trim() || null,
      orderNotes: input.orderNotes?.trim() || null,
      status: "ACTIVE",
      expiresAt: defaultExpiresAt(),
    },
    include: orderSessionInclude,
  });

  return mapOrderSession(session);
}

export async function getOrderSession(orderSessionId: string): Promise<OrderSessionData> {
  const session = await getOrderSessionRecord(orderSessionId);
  return mapOrderSession(session);
}

export async function updateCustomerInfo(
  orderSessionId: string,
  input: UpdateCustomerInfoInput,
): Promise<OrderSessionData> {
  const existing = await getOrderSessionRecord(orderSessionId);

  if (existing.status !== "ACTIVE") {
    throw new Error("Only active order sessions can be updated");
  }

  const session = await prisma.orderSession.update({
    where: { id: orderSessionId },
    data: {
      ...(input.customerName !== undefined
        ? { customerName: input.customerName?.trim() || null }
        : {}),
      ...(input.customerPhone !== undefined
        ? { customerPhone: input.customerPhone?.trim() || null }
        : {}),
    },
    include: orderSessionInclude,
  });

  return mapOrderSession(session);
}

export async function updateOrderNotes(
  orderSessionId: string,
  orderNotes: string | null,
): Promise<OrderSessionData> {
  const existing = await getOrderSessionRecord(orderSessionId);

  if (existing.status !== "ACTIVE") {
    throw new Error("Only active order sessions can be updated");
  }

  const session = await prisma.orderSession.update({
    where: { id: orderSessionId },
    data: { orderNotes: orderNotes?.trim() || null },
    include: orderSessionInclude,
  });

  return mapOrderSession(session);
}

export async function assignTable(
  orderSessionId: string,
  tableId: string | null,
): Promise<OrderSessionData> {
  const existing = await getOrderSessionRecord(orderSessionId);

  if (existing.status !== "ACTIVE") {
    throw new Error("Only active order sessions can be updated");
  }

  await assertTableBelongsToBusiness(existing.businessId, tableId);

  const session = await prisma.orderSession.update({
    where: { id: orderSessionId },
    data: { tableId },
    include: orderSessionInclude,
  });

  return mapOrderSession(session);
}

export async function validateSession(orderSessionId: string): Promise<OrderSessionData> {
  const session = await getOrderSessionRecord(orderSessionId);

  if (session.status !== "ACTIVE") {
    throw new Error("Order session is not active");
  }

  if (session.expiresAt <= new Date()) {
    throw new Error("Order session has expired");
  }

  await assertQrSessionValid(session.qrMenuSessionId, session.businessId);
  await assertCartReadyForOrderSession(session.cartId, session.businessId);

  return mapOrderSession(session);
}

export async function expireSession(orderSessionId: string): Promise<OrderSessionData> {
  const existing = await getOrderSessionRecord(orderSessionId);

  if (existing.status === "EXPIRED") {
    return mapOrderSession(existing);
  }

  const session = await prisma.orderSession.update({
    where: { id: orderSessionId },
    data: { status: "EXPIRED" },
    include: orderSessionInclude,
  });

  return mapOrderSession(session);
}

export async function markOrderSessionReady(orderSessionId: string): Promise<OrderSessionData> {
  await validateSession(orderSessionId);

  const session = await prisma.orderSession.update({
    where: { id: orderSessionId },
    data: { status: "READY" },
    include: orderSessionInclude,
  });

  return mapOrderSession(session);
}
