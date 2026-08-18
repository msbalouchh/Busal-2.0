import "server-only";

import { prisma } from "@/lib/prisma";
import { resolveOrderScopeFromBusiness, toOmsPlatformContext } from "@/modules/orders/lib/order-scope";
import { orderService } from "@/modules/orders/services/order.service";
import { ORDER_SOURCES, ORDER_STATUSES, ORDER_TYPES } from "@/modules/orders/constants/order-status";
import { getOrderSummary } from "@/modules/orders/utils/order-selectors";
import {
  AI_BUSINESS_TOOL_IDS,
  CUSTOMER_AI_TOOL_IDS,
} from "@/modules/customer-ai/constants/customer-ai.constants";
import type { AiBusinessToolDefinition } from "@/modules/customer-ai/tools/tool-types";

function formatOrder(record: Awaited<ReturnType<typeof orderService.getById>>) {
  if (!record) return null;
  return {
    orderId: record.order.id,
    orderNumber: record.order.orderNumber,
    status: record.order.status,
    totalPence: record.order.totalPence,
    customerId: record.order.customerId,
    placedAt: record.order.createdAt,
    summary: getOrderSummary(record),
  };
}

async function resolveOmsContext(businessId: string, branchId?: string | null, userId?: string) {
  const scope = branchId
    ? (await import("@/modules/orders/lib/order-scope")).buildOrderScopeFromInput({
        businessId,
        branchId,
        userId: userId ?? "system",
      })
    : await resolveOrderScopeFromBusiness(businessId);
  return toOmsPlatformContext(scope);
}

async function resolveValidatedOrderItems(
  businessId: string,
  rawItems: unknown,
): Promise<{ items: Array<{ productId: string; productName: string; quantity: number; unitPricePence: number }> } | { error: string }> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: "At least one order item is required. Provide productId and quantity for each item." };
  }

  const resolved: Array<{ productId: string; productName: string; quantity: number; unitPricePence: number }> = [];

  for (const raw of rawItems) {
    if (typeof raw !== "object" || raw === null) {
      return { error: "Each order item must be an object with productId and quantity." };
    }
    const item = raw as Record<string, unknown>;
    const productId = typeof item.productId === "string" ? item.productId : null;
    const productName = typeof item.productName === "string" ? item.productName.trim() : null;
    const quantity = typeof item.quantity === "number" ? item.quantity : 0;

    if (!productId && !productName) {
      return { error: "Each item requires a productId or productName from the business catalog." };
    }
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      return { error: "Each item requires a positive whole-number quantity." };
    }

    const product = productId
      ? await prisma.product.findFirst({
          where: { id: productId, businessId, status: "ACTIVE" },
          select: { id: true, name: true, price: true },
        })
      : await prisma.product.findFirst({
          where: {
            businessId,
            status: "ACTIVE",
            name: { equals: productName!, mode: "insensitive" },
          },
          select: { id: true, name: true, price: true },
        });

    if (!product) {
      return {
        error: `Product not found in catalog: ${productId ?? productName}. I cannot invent menu items or prices.`,
      };
    }

    if (product.price === null || Number(product.price) <= 0) {
      return { error: `Product "${product.name}" does not have a configured price.` };
    }

    resolved.push({
      productId: product.id,
      productName: product.name,
      quantity,
      unitPricePence: Math.round(Number(product.price) * 100),
    });
  }

  return { items: resolved };
}

export const orderTools: AiBusinessToolDefinition[] = [
  {
    toolId: CUSTOMER_AI_TOOL_IDS.CREATE_ORDER,
    name: "Create Order",
    description:
      "Create a customer order using real catalog products, quantities, and prices. Requires confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        orderType: { type: "string", enum: ["takeaway", "delivery", "dine_in"] },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              productId: { type: "string" },
              productName: { type: "string" },
              quantity: { type: "number" },
            },
            required: ["quantity"],
          },
        },
        notes: { type: "string" },
      },
      required: ["items"],
    },
    permission: "ai.orders.create",
    riskLevel: "WRITE",
    audience: "CUSTOMER",
    requiresCustomerVerification: true,
    buildConfirmationActionId: (input) => {
      const items = Array.isArray(input.items) ? input.items : [];
      const key = items
        .map((i) =>
          typeof i === "object" && i !== null
            ? `${(i as Record<string, unknown>).productId ?? (i as Record<string, unknown>).productName}:${(i as Record<string, unknown>).quantity}`
            : "",
        )
        .join("|");
      return `create-order:${key}`;
    },
    buildConfirmationMessage: (_input, preview) => {
      const total = typeof preview?.estimatedTotal === "number" ? preview.estimatedTotal : null;
      return total != null
        ? `Confirm order for ${preview?.itemCount ?? "?"} item(s), total ${total}?`
        : "Please confirm you would like to place this order.";
    },
    validateArgs: async (input, context) => {
      const validated = await resolveValidatedOrderItems(context.businessId, input.items);
      if ("error" in validated) return { valid: false, error: validated.error };
      const estimatedTotal =
        validated.items.reduce((sum, item) => sum + item.unitPricePence * item.quantity, 0) / 100;
      return {
        valid: true,
        preview: {
          itemCount: validated.items.length,
          estimatedTotal,
          items: validated.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
          })),
        },
      };
    },
    handler: async (input, context) => {
      if (!context.customerId) {
        return { error: "Customer verification required.", requiresVerification: true };
      }

      const validated = await resolveValidatedOrderItems(context.businessId, input.items);
      if ("error" in validated) return { error: validated.error };

      const orderTypeRaw = typeof input.orderType === "string" ? input.orderType : "takeaway";
      const orderType =
        orderTypeRaw === "delivery"
          ? ORDER_TYPES.DELIVERY
          : orderTypeRaw === "dine_in"
            ? ORDER_TYPES.DINE_IN
            : ORDER_TYPES.TAKEAWAY;

      const estimatedTotal =
        validated.items.reduce((sum, item) => sum + item.unitPricePence * item.quantity, 0) / 100;

      const oms = await resolveOmsContext(context.businessId, context.branchId);
      const record = await orderService.create(oms, {
        tenantId: oms.tenantId,
        workspaceId: oms.workspaceId,
        businessId: oms.businessId,
        branchId: oms.branchId,
        customerId: context.customerId,
        orderType,
        source: ORDER_SOURCES.WEB,
        notes: typeof input.notes === "string" ? input.notes : null,
        items: validated.items,
      });

      return {
        success: true,
        orderId: record.order.id,
        orderNumber: record.order.orderNumber,
        status: record.order.status,
        totalPence: record.order.totalPence,
        total: record.order.totalPence / 100,
        itemCount: validated.items.length,
        estimatedTotal,
        summary: getOrderSummary(record),
      };
    },
  },
  {
    toolId: CUSTOMER_AI_TOOL_IDS.VIEW_ORDER_STATUS,
    name: "View Order Status",
    description: "Look up the latest or specified order for a verified customer.",
    inputSchema: {
      type: "object",
      properties: { orderNumber: { type: "string" } },
    },
    permission: "ai.orders.read",
    riskLevel: "READ",
    audience: "CUSTOMER",
    requiresCustomerVerification: true,
    handler: async (input, context) => {
      if (!context.customerId) {
        return { error: "Customer verification required.", requiresVerification: true };
      }
      const oms = await resolveOmsContext(context.businessId, context.branchId);
      const orderNumber = typeof input.orderNumber === "string" ? input.orderNumber : undefined;
      const record = orderNumber
        ? await orderService.getByOrderNumber(oms, orderNumber)
        : (
            await orderService.search(
              { customerId: context.customerId, pageSize: 1, sortBy: "placedAt", sortDirection: "desc" },
              oms,
            )
          ).records[0] ?? null;

      if (!record || record.order.customerId !== context.customerId) {
        return { error: "No order found for your account." };
      }
      return formatOrder(record);
    },
  },
  {
    toolId: CUSTOMER_AI_TOOL_IDS.SEARCH_ORDERS,
    name: "Search Customer Orders",
    description: "Search orders for the verified customer.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, limit: { type: "number" } },
    },
    permission: "ai.orders.read",
    riskLevel: "READ",
    audience: "CUSTOMER",
    requiresCustomerVerification: true,
    handler: async (input, context) => {
      if (!context.customerId) {
        return { error: "Customer verification required.", requiresVerification: true };
      }
      const oms = await resolveOmsContext(context.businessId, context.branchId);
      const result = await orderService.search(
        {
          customerId: context.customerId,
          query: typeof input.query === "string" ? input.query : undefined,
          pageSize: typeof input.limit === "number" ? input.limit : 10,
        },
        oms,
      );
      return {
        orders: result.records.map((record) => formatOrder(record)),
        total: result.total,
      };
    },
  },
  {
    toolId: CUSTOMER_AI_TOOL_IDS.ORDER_HISTORY,
    name: "Customer Order History",
    description: "Retrieve recent order history for the verified customer.",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
    permission: "ai.orders.read",
    riskLevel: "READ",
    audience: "CUSTOMER",
    requiresCustomerVerification: true,
    handler: async (input, context) => {
      if (!context.customerId) {
        return { error: "Customer verification required.", requiresVerification: true };
      }
      const oms = await resolveOmsContext(context.businessId, context.branchId);
      const result = await orderService.search(
        { customerId: context.customerId, pageSize: typeof input.limit === "number" ? input.limit : 10 },
        oms,
      );
      return { orders: result.records.map((record) => formatOrder(record)), total: result.total };
    },
  },
  {
    toolId: CUSTOMER_AI_TOOL_IDS.CANCEL_ORDER,
    name: "Cancel Order",
    description: "Cancel a customer order when eligible.",
    inputSchema: {
      type: "object",
      properties: { orderId: { type: "string" }, orderNumber: { type: "string" }, reason: { type: "string" } },
      required: ["orderId"],
    },
    permission: "ai.orders.cancel",
    riskLevel: "DESTRUCTIVE",
    audience: "CUSTOMER",
    requiresCustomerVerification: true,
    buildConfirmationActionId: (input) =>
      `cancel-order:${String(input.orderId ?? input.orderNumber ?? "")}`,
    buildConfirmationMessage: (_input, preview) =>
      `Cancel order ${String(preview?.orderNumber ?? preview?.orderId ?? "")}? This cannot be undone.`,
    handler: async (input, context) => {
      if (!context.customerId) {
        return { error: "Customer verification required.", requiresVerification: true };
      }
      const oms = await resolveOmsContext(context.businessId, context.branchId);
      const orderId = typeof input.orderId === "string" ? input.orderId : "";
      const record = orderId
        ? await orderService.getById(oms, orderId)
        : typeof input.orderNumber === "string"
          ? await orderService.getByOrderNumber(oms, input.orderNumber)
          : null;

      if (!record || record.order.customerId !== context.customerId) {
        return { error: "Order not found for your account." };
      }

      if (record.order.status === ORDER_STATUSES.CANCELLED) {
        return { error: "Order is already cancelled.", orderNumber: record.order.orderNumber };
      }

      if (record.order.status === ORDER_STATUSES.COMPLETED) {
        return { error: "Completed orders cannot be cancelled.", orderNumber: record.order.orderNumber };
      }

      const cancelled = await orderService.cancel(
        oms,
        record.order.id,
        typeof input.reason === "string" ? input.reason : "Customer requested cancellation",
      );

      if (!cancelled) {
        return { error: "Unable to cancel this order.", orderNumber: record.order.orderNumber };
      }

      return {
        success: true,
        orderNumber: cancelled.order.orderNumber,
        status: cancelled.order.status,
      };
    },
  },
  {
    toolId: AI_BUSINESS_TOOL_IDS.SEARCH_ORDERS,
    name: "Search Orders",
    description: "Search business orders by query, status, or customer.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        status: { type: "string" },
        customerId: { type: "string" },
        limit: { type: "number" },
      },
    },
    permission: "ai.orders.read",
    riskLevel: "READ",
    audience: "OWNER",
    handler: async (input, context) => {
      const oms = await resolveOmsContext(context.businessId, context.branchId, context.ownerId ?? undefined);
      const result = await orderService.search(
        {
          query: typeof input.query === "string" ? input.query : undefined,
          status: typeof input.status === "string" ? (input.status as never) : undefined,
          customerId: typeof input.customerId === "string" ? input.customerId : undefined,
          pageSize: typeof input.limit === "number" ? input.limit : 20,
        },
        oms,
      );
      return { orders: result.records.map((record) => formatOrder(record)), total: result.total };
    },
  },
  {
    toolId: AI_BUSINESS_TOOL_IDS.GET_ORDER,
    name: "Get Order",
    description: "Retrieve a specific order by ID or order number.",
    inputSchema: {
      type: "object",
      properties: { orderId: { type: "string" }, orderNumber: { type: "string" } },
    },
    permission: "ai.orders.read",
    riskLevel: "READ",
    audience: "OWNER",
    handler: async (input, context) => {
      const oms = await resolveOmsContext(context.businessId, context.branchId, context.ownerId ?? undefined);
      const record =
        typeof input.orderId === "string"
          ? await orderService.getById(oms, input.orderId)
          : typeof input.orderNumber === "string"
            ? await orderService.getByOrderNumber(oms, input.orderNumber)
            : null;
      if (!record) return { error: "Order not found." };
      return formatOrder(record);
    },
  },
  {
    toolId: AI_BUSINESS_TOOL_IDS.ORDERS_SUMMARY_TODAY,
    name: "Today's Orders Summary",
    description: "Summarize orders received today.",
    inputSchema: { type: "object", properties: {} },
    permission: "ai.analytics.read",
    riskLevel: "READ",
    audience: "OWNER",
    handler: async (_input, context) => {
      const oms = await resolveOmsContext(context.businessId, context.branchId, context.ownerId ?? undefined);
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const result = await orderService.search({ pageSize: 200 }, oms);
      const today = result.records.filter((record) => new Date(record.order.createdAt) >= start);
      const revenuePence = today.reduce((sum, record) => sum + record.order.totalPence, 0);
      return {
        count: today.length,
        revenuePence,
        revenue: revenuePence / 100,
        statuses: today.reduce<Record<string, number>>((acc, record) => {
          acc[record.order.status] = (acc[record.order.status] ?? 0) + 1;
          return acc;
        }, {}),
      };
    },
  },
  {
    toolId: AI_BUSINESS_TOOL_IDS.PENDING_ORDERS,
    name: "Pending Orders",
    description: "List pending or in-progress orders.",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
    permission: "ai.orders.read",
    riskLevel: "READ",
    audience: "OWNER",
    handler: async (input, context) => {
      const oms = await resolveOmsContext(context.businessId, context.branchId, context.ownerId ?? undefined);
      const result = await orderService.search(
        { status: ORDER_STATUSES.PENDING, pageSize: typeof input.limit === "number" ? input.limit : 20 },
        oms,
      );
      return { orders: result.records.map((record) => formatOrder(record)), total: result.total };
    },
  },
  {
    toolId: AI_BUSINESS_TOOL_IDS.DELAYED_ORDERS,
    name: "Delayed Orders",
    description: "Identify orders with elevated delay risk.",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
    permission: "ai.orders.read",
    riskLevel: "READ",
    audience: "OWNER",
    handler: async (input, context) => {
      const oms = await resolveOmsContext(context.businessId, context.branchId, context.ownerId ?? undefined);
      const result = await orderService.search({ pageSize: 100 }, oms);
      const delayed = result.records
        .filter((record) => record.analytics.delayRiskScore >= 0.6)
        .slice(0, typeof input.limit === "number" ? input.limit : 10);
      return {
        orders: delayed.map((record) => ({
          ...formatOrder(record),
          delayRiskScore: record.analytics.delayRiskScore,
        })),
      };
    },
  },
  {
    toolId: AI_BUSINESS_TOOL_IDS.CANCEL_ORDER,
    name: "Cancel Order (Owner)",
    description: "Cancel an order on behalf of the business.",
    inputSchema: {
      type: "object",
      properties: { orderId: { type: "string" }, reason: { type: "string" } },
      required: ["orderId"],
    },
    permission: "ai.orders.cancel",
    riskLevel: "DESTRUCTIVE",
    audience: "OWNER",
    buildConfirmationActionId: (input) => `owner-cancel-order:${String(input.orderId)}`,
    buildConfirmationMessage: (_input, preview) =>
      `Cancel order ${String(preview?.orderNumber ?? preview?.orderId ?? "")}?`,
    handler: async (input, context) => {
      const oms = await resolveOmsContext(context.businessId, context.branchId, context.ownerId ?? undefined);
      const orderId = String(input.orderId);
      const record = await orderService.getById(oms, orderId);
      if (!record) return { error: "Order not found." };
      const cancelled = await orderService.cancel(
        oms,
        orderId,
        typeof input.reason === "string" ? input.reason : "Owner requested cancellation",
      );
      if (!cancelled) return { error: "Unable to cancel order." };
      return { success: true, orderNumber: cancelled.order.orderNumber, status: cancelled.order.status };
    },
  },
];

export async function lookupRestaurantOrderForCustomer(
  businessId: string,
  customerId: string,
  orderNumber?: string,
) {
  return prisma.restaurantOrder.findFirst({
    where: {
      businessId,
      customerId,
      ...(orderNumber ? { orderNumber } : {}),
    },
    orderBy: { placedAt: "desc" },
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      totalAmount: true,
      placedAt: true,
    },
  });
}
