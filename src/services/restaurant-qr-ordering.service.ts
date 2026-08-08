import "server-only";

import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";
import { resolvePublicAppUrl } from "@/config/app-url";
import {
  validateOrderInput,
  validateOrderItemInput,
} from "@/modules/order-management/lib/order-validation";
import type { OrderItemInput } from "@/modules/order-management/types/order-management-types";
import {
  validateQrCart,
  validateQrSessionToken,
  validateQrTableToken,
} from "@/modules/qr-ordering-management/lib/qr-ordering-validation";
import type {
  QrMenuCategory,
  QrMenuProduct,
  QrOrderTrackingRecord,
  QrSessionRecord,
  TableQrCodeRecord,
} from "@/modules/qr-ordering-management/types/qr-ordering-types";
import { createRestaurantOrderForBusiness } from "@/modules/orders/services/order-management-adapter.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { mapOrderStatusToKitchen } from "@/modules/kitchen-display-management/lib/kitchen-validation";

const SESSION_HOURS = 4;

function generateToken(): string {
  return randomBytes(24).toString("hex");
}

function buildQrUrl(token: string): string {
  return `${resolvePublicAppUrl()}/qr/${token}`;
}

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

function serializeTableQrCode(record: {
  id: string;
  businessId: string;
  branchId: string;
  tableId: string;
  token: string;
  qrCodeUrl: string;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  lastGeneratedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  table?: {
    tableNumber: string;
    tableName: string | null;
    floor?: { name: string };
  };
}): TableQrCodeRecord {
  return {
    id: record.id,
    businessId: record.businessId,
    branchId: record.branchId,
    tableId: record.tableId,
    token: record.token,
    qrCodeUrl: record.qrCodeUrl,
    status: record.status,
    lastGeneratedAt: record.lastGeneratedAt.toISOString(),
    tableLabel: record.table
      ? `${record.table.floor?.name ?? "Floor"} · ${record.table.tableName ?? record.table.tableNumber}`
      : record.tableId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listTableQrCodes(
  ownerId: string,
  branchId: string,
): Promise<TableQrCodeRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const codes = await prisma.tableQRCode.findMany({
    where: { businessId, branchId },
    include: {
      table: { include: { floor: { select: { name: true } } } },
    },
    orderBy: [{ table: { tableNumber: "asc" } }],
  });

  return codes.map(serializeTableQrCode);
}

export async function generateTableQrCode(
  ownerId: string,
  branchId: string,
  tableId: string,
): Promise<TableQrCodeRecord> {
  const businessId = await getOwnedBusinessId(ownerId);

  const table = await prisma.restaurantTable.findFirst({
    where: { id: tableId, businessId, branchId },
    include: { floor: { select: { name: true } } },
  });

  if (!table) throw new Error("Table not found");

  const token = generateToken();
  const qrCodeUrl = buildQrUrl(token);
  const now = new Date();

  const existing = await prisma.tableQRCode.findUnique({ where: { tableId } });

  const record = existing
    ? await prisma.tableQRCode.update({
        where: { id: existing.id },
        data: { token, qrCodeUrl, status: "ACTIVE", lastGeneratedAt: now },
        include: { table: { include: { floor: { select: { name: true } } } } },
      })
    : await prisma.tableQRCode.create({
        data: {
          businessId,
          branchId,
          tableId,
          token,
          qrCodeUrl,
          status: "ACTIVE",
          lastGeneratedAt: now,
        },
        include: { table: { include: { floor: { select: { name: true } } } } },
      });

  return serializeTableQrCode(record);
}

export async function regenerateTableQrCode(ownerId: string, qrCodeId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.tableQRCode.findFirst({
    where: { id: qrCodeId, businessId },
  });

  if (!existing) throw new Error("QR code not found");

  const token = generateToken();
  const record = await prisma.tableQRCode.update({
    where: { id: qrCodeId },
    data: {
      token,
      qrCodeUrl: buildQrUrl(token),
      lastGeneratedAt: new Date(),
      status: "ACTIVE",
    },
    include: { table: { include: { floor: { select: { name: true } } } } },
  });

  return serializeTableQrCode(record);
}

export async function updateTableQrCodeStatus(
  ownerId: string,
  qrCodeId: string,
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED",
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const record = await prisma.tableQRCode.update({
    where: { id: qrCodeId, businessId },
    data: { status },
    include: { table: { include: { floor: { select: { name: true } } } } },
  });

  return serializeTableQrCode(record);
}

export async function resolvePublicQrContext(tableToken: string) {
  validateQrTableToken(tableToken);

  const qrCode = await prisma.tableQRCode.findFirst({
    where: { token: tableToken, status: "ACTIVE" },
    include: {
      business: { select: { id: true, businessName: true } },
      branch: { select: { id: true, name: true } },
      table: {
        include: { floor: { select: { name: true } } },
      },
    },
  });

  if (!qrCode) {
    throw new Error("Invalid or inactive QR code");
  }

  return qrCode;
}

export async function resolveQrSessionForTable(
  tableToken: string,
  existingSessionToken?: string | null,
): Promise<QrSessionRecord> {
  const qrCode = await resolvePublicQrContext(tableToken);

  if (existingSessionToken) {
    try {
      const session = await getValidatedQrSession(existingSessionToken);
      if (session.tableId === qrCode.tableId) {
        return serializeSession(session, qrCode);
      }
    } catch {
      // Session invalid or belongs to another table — start fresh below.
    }
  }

  return startOrResumeQrSession(tableToken);
}

export async function startOrResumeQrSession(tableToken: string): Promise<QrSessionRecord> {
  const qrCode = await resolvePublicQrContext(tableToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_HOURS * 60 * 60 * 1000);

  const existing = await prisma.qRSession.findFirst({
    where: {
      tableId: qrCode.tableId,
      sessionStatus: "ACTIVE",
      expiresAt: { gt: now },
    },
    orderBy: { lastActivityAt: "desc" },
  });

  if (existing) {
    const updated = await prisma.qRSession.update({
      where: { id: existing.id },
      data: { lastActivityAt: now, expiresAt },
    });

    return serializeSession(updated, qrCode);
  }

  const session = await prisma.qRSession.create({
    data: {
      businessId: qrCode.businessId,
      branchId: qrCode.branchId,
      tableId: qrCode.tableId,
      token: generateToken(),
      sessionStatus: "ACTIVE",
      lastActivityAt: now,
      expiresAt,
    },
  });

  return serializeSession(session, qrCode);
}

function serializeSession(
  session: {
    id: string;
    token: string;
    customerName: string | null;
    customerPhone: string | null;
    sessionStatus: "ACTIVE" | "COMPLETED" | "EXPIRED";
    expiresAt: Date;
    waiterRequestedAt: Date | null;
    billRequestedAt: Date | null;
  },
  qrCode: {
    business: { businessName: string | null };
    branch: { name: string };
    table: { tableNumber: string; tableName: string | null; floor: { name: string } };
  },
): QrSessionRecord {
  return {
    id: session.id,
    token: session.token,
    customerName: session.customerName,
    customerPhone: session.customerPhone,
    sessionStatus: session.sessionStatus,
    expiresAt: session.expiresAt.toISOString(),
    waiterRequestedAt: session.waiterRequestedAt?.toISOString() ?? null,
    billRequestedAt: session.billRequestedAt?.toISOString() ?? null,
    businessName: qrCode.business.businessName ?? "Restaurant",
    branchName: qrCode.branch.name,
    tableLabel: `${qrCode.table.floor.name} · ${qrCode.table.tableName ?? qrCode.table.tableNumber}`,
  };
}

export async function getValidatedQrSession(sessionToken: string) {
  validateQrSessionToken(sessionToken);

  const session = await prisma.qRSession.findUnique({
    where: { token: sessionToken },
    include: {
      business: { select: { businessName: true } },
      branch: { select: { name: true } },
      table: { include: { floor: { select: { name: true } } } },
    },
  });

  if (!session) throw new Error("Session not found");

  if (session.sessionStatus !== "ACTIVE" || session.expiresAt <= new Date()) {
    if (session.sessionStatus === "ACTIVE") {
      await prisma.qRSession.update({
        where: { id: session.id },
        data: { sessionStatus: "EXPIRED" },
      });
    }
    throw new Error("Session expired");
  }

  await prisma.qRSession.update({
    where: { id: session.id },
    data: { lastActivityAt: new Date() },
  });

  return session;
}

export async function loadPublicQrMenu(sessionToken: string): Promise<{
  session: QrSessionRecord;
  categories: QrMenuCategory[];
  products: QrMenuProduct[];
}> {
  const session = await getValidatedQrSession(sessionToken);

  const categories = await prisma.category.findMany({
    where: { businessId: session.businessId, status: "ACTIVE" },
    select: { id: true, name: true, description: true, displayOrder: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  const products = await prisma.product.findMany({
    where: { businessId: session.businessId, status: "ACTIVE" },
    select: {
      id: true,
      categoryId: true,
      name: true,
      description: true,
      shortDescription: true,
      price: true,
      image: true,
      isFeatured: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      preparationTime: true,
      modifierGroups: {
        orderBy: { displayOrder: "asc" },
        select: {
          modifierGroup: {
            select: {
              id: true,
              name: true,
              minimumSelection: true,
              maximumSelection: true,
              isRequired: true,
              options: {
                where: { status: "ACTIVE" },
                orderBy: { displayOrder: "asc" },
                select: { id: true, name: true, priceAdjustment: true },
              },
            },
          },
        },
      },
    },
    orderBy: [{ name: "asc" }],
  });

  return {
    session: serializeSession(session, {
      business: { businessName: session.business.businessName },
      branch: { name: session.branch.name },
      table: session.table,
    }),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      displayOrder: category.displayOrder,
    })),
    products: products.map((product) => ({
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      price: Number(product.price),
      image: product.image,
      isFeatured: product.isFeatured,
      isVegetarian: product.isVegetarian,
      isVegan: product.isVegan,
      isGlutenFree: product.isGlutenFree,
      preparationTime: product.preparationTime,
      modifierGroups: product.modifierGroups.map((entry) => ({
        id: entry.modifierGroup.id,
        name: entry.modifierGroup.name,
        minSelections: entry.modifierGroup.minimumSelection,
        maxSelections: entry.modifierGroup.maximumSelection,
        isRequired: entry.modifierGroup.isRequired,
        options: entry.modifierGroup.options.map((option) => ({
          id: option.id,
          name: option.name,
          priceAdjustment: Number(option.priceAdjustment),
        })),
      })),
    })),
  };
}

export async function placeQrOrder(input: {
  sessionToken: string;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  items: OrderItemInput[];
  idempotencyKey?: string;
}) {
  const session = await getValidatedQrSession(input.sessionToken);
  validateQrCart(input.items);

  for (const item of input.items) {
    validateOrderItemInput(item);
  }

  if (input.idempotencyKey) {
    const recent = await prisma.restaurantOrder.findFirst({
      where: {
        qrSessionId: session.id,
        notes: { contains: input.idempotencyKey },
        placedAt: { gte: new Date(Date.now() - 30_000) },
      },
    });

    if (recent) {
      return getQrOrderTracking(session.token, recent.id);
    }
  }

  const orderInput = {
    branchId: session.branchId,
    orderType: "DINE_IN" as const,
    restaurantTableId: session.tableId,
    notes: [input.notes, input.idempotencyKey ? `[key:${input.idempotencyKey}]` : null]
      .filter(Boolean)
      .join("\n"),
    items: input.items,
  };

  validateOrderInput(orderInput);

  if (input.customerName || input.customerPhone) {
    await prisma.qRSession.update({
      where: { id: session.id },
      data: {
        customerName: input.customerName?.trim() || session.customerName,
        customerPhone: input.customerPhone?.trim() || session.customerPhone,
      },
    });
  }

  const { findOrCreateCustomerFromContact } =
    await import("@/services/restaurant-customer.service");
  const customerId = await findOrCreateCustomerFromContact(session.businessId, {
    name: input.customerName ?? session.customerName,
    phone: input.customerPhone ?? session.customerPhone,
  });

  const order = await createRestaurantOrderForBusiness({
    businessId: session.businessId,
    branchId: session.branchId,
    orderType: "DINE_IN",
    restaurantTableId: session.tableId,
    qrSessionId: session.id,
    customerId,
    notes: orderInput.notes,
    items: input.items,
  });

  return getQrOrderTracking(session.token, order.id);
}

export async function getQrOrderTracking(
  sessionToken: string,
  orderId: string,
): Promise<QrOrderTrackingRecord> {
  const session = await getValidatedQrSession(sessionToken);

  const order = await prisma.restaurantOrder.findFirst({
    where: { id: orderId, qrSessionId: session.id },
    include: {
      items: {
        include: { modifiers: true },
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });

  if (!order) throw new Error("Order not found");

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    kitchenStatus: mapOrderStatusToKitchen(order.status),
    totalAmount: Number(order.totalAmount),
    placedAt: order.placedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.productNameSnapshot,
      quantity: item.quantity,
      status: item.status,
      modifiers: item.modifiers.map((modifier) => modifier.nameSnapshot),
    })),
  };
}

export async function listQrSessionOrders(sessionToken: string) {
  const session = await getValidatedQrSession(sessionToken);

  const orders = await prisma.restaurantOrder.findMany({
    where: { qrSessionId: session.id },
    orderBy: { placedAt: "desc" },
    take: 10,
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    kitchenStatus: mapOrderStatusToKitchen(order.status),
    totalAmount: Number(order.totalAmount),
    placedAt: order.placedAt.toISOString(),
  }));
}

export async function requestQrWaiter(sessionToken: string) {
  const session = await getValidatedQrSession(sessionToken);

  await prisma.qRSession.update({
    where: { id: session.id },
    data: { waiterRequestedAt: new Date() },
  });

  return { success: true as const };
}

export async function requestQrBill(sessionToken: string) {
  const session = await getValidatedQrSession(sessionToken);

  await prisma.qRSession.update({
    where: { id: session.id },
    data: { billRequestedAt: new Date() },
  });

  return { success: true as const };
}

export async function listBranchTablesForQrGeneration(ownerId: string, branchId: string) {
  const businessId = await getOwnedBusinessId(ownerId);

  const tables = await prisma.restaurantTable.findMany({
    where: {
      businessId,
      branchId,
      status: { notIn: ["ARCHIVED", "OUT_OF_SERVICE"] },
    },
    include: {
      floor: { select: { name: true } },
      tableQrCodes: { select: { id: true, status: true, qrCodeUrl: true } },
    },
    orderBy: [{ tableNumber: "asc" }],
  });

  return tables.map((table) => ({
    id: table.id,
    label: `${table.floor.name} · ${table.tableName ?? table.tableNumber}`,
    hasQrCode: table.tableQrCodes.length > 0,
    qrCodeUrl: table.tableQrCodes[0]?.qrCodeUrl ?? null,
    qrStatus: table.tableQrCodes[0]?.status ?? null,
  }));
}
