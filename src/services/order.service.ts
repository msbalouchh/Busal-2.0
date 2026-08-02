import "server-only";

import {
  type FulfilmentType,
  type OrderStatus,
  type OrderSessionType,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import { calculateSubtotal } from "@/services/cart.service";
import { enqueueOrderInTransaction } from "@/services/kitchen-queue.service";

function toNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface OrderItemData {
  id: string;
  orderId: string;
  menuItemId: string;
  nameSnapshot: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  notes: string | null;
  createdAt: Date;
}

export interface OrderData {
  id: string;
  businessId: string;
  orderSessionId: string;
  orderNumber: string;
  fulfilmentType: FulfilmentType;
  tableId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: OrderStatus;
  items: OrderItemData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListOrdersFilters {
  status?: OrderStatus;
  branchId?: string | null;
}

const orderInclude = {
  items: {
    orderBy: [{ createdAt: "asc" as const }],
  },
} satisfies Prisma.LegacyOrderInclude;

type OrderWithItems = Prisma.LegacyOrderGetPayload<{ include: typeof orderInclude }>;

function mapOrderItem(item: OrderWithItems["items"][number]): OrderItemData {
  return {
    id: item.id,
    orderId: item.orderId,
    menuItemId: item.menuItemId,
    nameSnapshot: item.nameSnapshot,
    unitPrice: toNumber(item.unitPrice),
    quantity: item.quantity,
    totalPrice: toNumber(item.totalPrice),
    notes: item.notes,
    createdAt: item.createdAt,
  };
}

function mapOrder(order: OrderWithItems): OrderData {
  return {
    id: order.id,
    businessId: order.businessId,
    orderSessionId: order.orderSessionId,
    orderNumber: order.orderNumber,
    fulfilmentType: order.fulfilmentType,
    tableId: order.tableId,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    notes: order.notes,
    subtotal: toNumber(order.subtotal),
    discount: toNumber(order.discount),
    tax: toNumber(order.tax),
    total: toNumber(order.total),
    status: order.status,
    items: order.items.map(mapOrderItem),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function mapSessionTypeToFulfilmentType(sessionType: OrderSessionType): FulfilmentType {
  switch (sessionType) {
    case "DINE_IN":
      return "DINE_IN";
    default:
      return "DINE_IN";
  }
}

async function generateUniqueOrderNumber(businessId: string): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const count = await prisma.legacyOrder.count({ where: { businessId } });
    const orderNumber = `ORD-${String(count + 1 + attempt).padStart(6, "0")}`;

    const existing = await prisma.legacyOrder.findFirst({
      where: { businessId, orderNumber },
      select: { id: true },
    });

    if (!existing) {
      return orderNumber;
    }
  }

  throw new Error("Unable to generate order number");
}

async function getOrderRecord(orderId: string): Promise<OrderWithItems> {
  const order = await prisma.legacyOrder.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
}

function assertOrderSessionReadyForOrder(status: string): void {
  if (status !== "ACTIVE" && status !== "READY") {
    throw new Error("Order session must be active");
  }
}

export async function createOrderFromSession(
  orderSessionId: string,
  branchId: string | null = null,
): Promise<OrderData> {
  const session = await prisma.orderSession.findUnique({
    where: { id: orderSessionId },
    include: {
      order: { select: { id: true } },
      cart: {
        include: {
          items: {
            include: {
              menuItem: { select: { name: true } },
            },
            orderBy: [{ createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!session) {
    throw new Error("Order session not found");
  }

  assertOrderSessionReadyForOrder(session.status);

  if (session.order) {
    throw new Error("Order already exists for this session");
  }

  if (session.cart.status !== "ACTIVE") {
    throw new Error("Cart must be active");
  }

  if (session.cart.items.length === 0) {
    throw new Error("Cart must contain at least one item");
  }

  const subtotal = calculateSubtotal(
    session.cart.items.map((item) => ({ totalPrice: toNumber(item.totalPrice) })),
  );
  const discount = 0;
  const tax = 0;
  const total = roundMoney(subtotal - discount + tax);
  const orderNumber = await generateUniqueOrderNumber(session.businessId);

  const order = await prisma.$transaction(async (tx) => {
    const sessionBranchId = branchId ?? session.branchId ?? null;

    const created = await tx.legacyOrder.create({
      data: {
        businessId: session.businessId,
        branchId: sessionBranchId,
        orderSessionId: session.id,
        orderNumber,
        fulfilmentType: mapSessionTypeToFulfilmentType(session.sessionType),
        tableId: session.tableId,
        customerName: session.customerName,
        customerPhone: session.customerPhone,
        notes: session.orderNotes,
        subtotal,
        discount,
        tax,
        total,
        status: "PENDING",
        items: {
          create: session.cart.items.map((item) => ({
            menuItemId: item.menuItemId,
            nameSnapshot: item.menuItem.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            notes: item.notes,
          })),
        },
      },
      include: orderInclude,
    });

    await tx.cart.update({
      where: { id: session.cartId },
      data: { status: "COMPLETED" },
    });

    await tx.orderSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED" },
    });

    await enqueueOrderInTransaction(tx, session.businessId, created.id, sessionBranchId);

    return created;
  });

  return mapOrder(order);
}

export async function getOrder(orderId: string): Promise<OrderData> {
  const order = await getOrderRecord(orderId);
  return mapOrder(order);
}

export async function listOrders(
  businessId: string,
  filters: ListOrdersFilters = {},
): Promise<OrderData[]> {
  const orders = await prisma.legacyOrder.findMany({
    where: {
      businessId,
      ...branchFilter(filters.branchId ?? null),
      ...(filters.status ? { status: filters.status } : {}),
    },
    include: orderInclude,
    orderBy: [{ createdAt: "desc" }],
  });

  return orders.map(mapOrder);
}

export async function cancelOrder(orderId: string): Promise<OrderData> {
  const order = await getOrderRecord(orderId);

  if (order.status === "CANCELLED") {
    return mapOrder(order);
  }

  if (order.status === "COMPLETED") {
    throw new Error("Completed orders cannot be cancelled");
  }

  const updated = await prisma.legacyOrder.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
    include: orderInclude,
  });

  return mapOrder(updated);
}
