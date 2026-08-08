import "server-only";

import { prisma } from "@/lib/prisma";
import { runBatchTransaction } from "@/lib/prisma-transaction";
import { calculateSubtotal } from "@/services/cart.service";
import {
  enqueueOrder,
  syncLegacyOrderForKitchen,
} from "@/services/kitchen-queue.service";
import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import { publishModuleDomainEvent } from "@/modules/platform-orchestration/lib/publish-module-event";
import { ORDER_SOURCES, ORDER_TYPES } from "@/modules/orders/constants/order-status";
import { buildOrderScopeFromInput, toOmsPlatformContext } from "@/modules/orders/lib/order-scope";
import { orderService } from "@/modules/orders/services/order.service";
import type { OrderData } from "@/services/order.service";

function toNumber(value: { toNumber(): number } | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

async function resolveProductIdForMenuItem(
  businessId: string,
  menuItemId: string,
  menuItemName: string,
): Promise<string> {
  const linkedProduct = await prisma.product.findFirst({
    where: {
      businessId,
      OR: [{ id: menuItemId }, { name: menuItemName, status: "ACTIVE" }],
    },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });

  if (linkedProduct) {
    return linkedProduct.id;
  }

  throw new Error(`No active product found for menu item ${menuItemName}`);
}

function mapPosOrderType(orderNotes: string | null): (typeof ORDER_TYPES)[keyof typeof ORDER_TYPES] {
  if (orderNotes?.includes("TAKEAWAY")) {
    return ORDER_TYPES.TAKEAWAY;
  }
  if (orderNotes?.includes("DELIVERY")) {
    return ORDER_TYPES.DELIVERY;
  }
  return ORDER_TYPES.DINE_IN;
}

/** Creates a RestaurantOrder through OMS from an active POS order session + cart. */
export async function createOmsOrderFromSession(
  orderSessionId: string,
  branchId: string | null = null,
): Promise<OrderData> {
  const session = await prisma.orderSession.findUnique({
    where: { id: orderSessionId },
    include: {
      cart: {
        include: {
          items: {
            include: {
              menuItem: { select: { id: true, name: true } },
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

  if (session.status !== "ACTIVE" && session.status !== "READY") {
    throw new Error("Order session must be active");
  }

  if (session.cart.status !== "ACTIVE") {
    throw new Error("Cart must be active");
  }

  if (session.cart.items.length === 0) {
    throw new Error("Cart must contain at least one item");
  }

  const resolvedBranchId = branchId ?? session.branchId;
  if (!resolvedBranchId) {
    throw new Error("Branch is required to create an order");
  }

  const scope = buildOrderScopeFromInput({
    businessId: session.businessId,
    branchId: resolvedBranchId,
    userId: "pos-terminal",
  });
  const context = toOmsPlatformContext(scope);

  const orderItems = await Promise.all(
    session.cart.items.map(async (item) => ({
      productId: await resolveProductIdForMenuItem(
        session.businessId,
        item.menuItemId,
        item.menuItem.name,
      ),
      productName: item.menuItem.name,
      quantity: item.quantity,
      unitPricePence: Math.round(toNumber(item.unitPrice) * 100),
      notes: item.notes,
    })),
  );

  const record = await orderService.create(context, {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: resolvedBranchId,
    customerName: session.customerName,
    orderType: mapPosOrderType(session.orderNotes),
    source: ORDER_SOURCES.POS,
    tableId: session.tableId,
    notes: session.orderNotes,
    items: orderItems,
  });

  await runBatchTransaction([
    prisma.cart.update({
      where: { id: session.cartId },
      data: { status: "COMPLETED" },
    }),
    prisma.orderSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED" },
    }),
  ]);

  await publishModuleDomainEvent(
    {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      businessId: scope.businessId,
      branchId: resolvedBranchId,
      userId: scope.userId,
    },
    {
      eventType: DOMAIN_EVENT_TYPES.ORDER_CREATED,
      aggregateId: record.order.id,
      payload: {
        orderId: record.order.id,
        source: ORDER_SOURCES.POS,
        status: record.order.status,
      },
    },
  );

  const subtotal = calculateSubtotal(
    session.cart.items.map((item) => ({ totalPrice: toNumber(item.totalPrice) })),
  );

  const legacyOrderId = await syncLegacyOrderForKitchen({
    businessId: session.businessId,
    branchId: resolvedBranchId,
    orderSessionId: session.id,
    orderNumber: record.order.orderNumber,
    tableId: session.tableId,
    customerName: session.customerName,
    customerPhone: session.customerPhone,
    notes: session.orderNotes,
    subtotal,
    discount: record.order.discountTotalPence / 100,
    tax: record.order.taxTotalPence / 100,
    total: record.order.totalPence / 100,
    status: record.order.status,
    items: session.cart.items.map((item) => ({
      menuItemId: item.menuItemId,
      nameSnapshot: item.menuItem.name,
      unitPrice: toNumber(item.unitPrice),
      quantity: item.quantity,
      totalPrice: toNumber(item.totalPrice),
      notes: item.notes,
    })),
  });

  await enqueueOrder(session.businessId, legacyOrderId, { branchId: resolvedBranchId });

  return {
    id: record.order.id,
    businessId: record.order.businessId,
    orderSessionId: session.id,
    orderNumber: record.order.orderNumber,
    fulfilmentType: "DINE_IN",
    tableId: session.tableId,
    customerName: session.customerName,
    customerPhone: session.customerPhone,
    notes: session.orderNotes,
    subtotal,
    discount: record.order.discountTotalPence / 100,
    tax: record.order.taxTotalPence / 100,
    total: record.order.totalPence / 100,
    status: "PENDING",
    items: record.items.map((item) => ({
      id: item.id,
      orderId: record.order.id,
      menuItemId: item.productId,
      nameSnapshot: item.productName,
      unitPrice: item.unitPricePence / 100,
      quantity: item.quantity,
      totalPrice: item.lineTotalPence / 100,
      notes: item.notes,
      createdAt: new Date(record.order.createdAt),
    })),
    createdAt: new Date(record.order.createdAt),
    updatedAt: new Date(record.order.updatedAt),
  };
}
