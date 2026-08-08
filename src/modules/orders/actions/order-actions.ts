"use server";

import { revalidatePath } from "next/cache";

import { ORDER_MODULE_PERMISSIONS } from "@/modules/orders/constants/permissions";
import { resolveOrderScope, toOmsPlatformContext } from "@/modules/orders/lib/order-scope";
import { orderService } from "@/modules/orders/services/order.service";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import {
  assignOrderCustomerSchema,
  assignOrderTableSchema,
  bulkUpdateOrdersSchema,
  cancelOrderSchema,
  createOrderSchema,
  mergeOrdersSchema,
  modifyOrderSchema,
  refundOrderSchema,
  splitOrderSchema,
  transferOrderSchema,
} from "@/modules/orders/validation/order-schemas";

function revalidateOrderPages() {
  revalidatePath("/dashboard/restaurant/orders");
  revalidatePath("/app/restaurant/orders");
}

export async function createOrderAction(input: unknown) {
  return protectedAction(ORDER_MODULE_PERMISSIONS.ORDER_CREATE, async ({ platform }) => {
    const body = createOrderSchema.parse(input);
    const scope = resolveOrderScope(platform);
    const context = toOmsPlatformContext(scope);
    const record = await orderService.create(context, {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      businessId: scope.businessId,
      branchId: body.branchId ?? scope.branchId,
      customerId: body.customerId,
      customerName: body.customerName,
      orderType: body.orderType,
      source: body.source,
      tableId: body.tableId,
      reservationId: body.reservationId,
      qrSessionId: body.qrSessionId,
      scheduledFor: body.scheduledFor,
      notes: body.notes,
      discountAmountPence: body.discountAmountPence,
      serviceChargePence: body.serviceChargePence,
      deliveryChargePence: body.deliveryChargePence,
      items: body.items,
    });
    revalidateOrderPages();
    return { success: true as const, record };
  });
}

export async function modifyOrderAction(input: unknown) {
  return protectedAction(ORDER_MODULE_PERMISSIONS.ORDER_UPDATE, async ({ platform }) => {
    const body = modifyOrderSchema.parse(input);
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const record = await orderService.modify(context, body);
    revalidateOrderPages();
    return { success: true as const, record };
  });
}

export async function cancelOrderAction(input: unknown) {
  return protectedAction(ORDER_MODULE_PERMISSIONS.ORDER_CANCEL, async ({ platform }) => {
    const body = cancelOrderSchema.parse(input);
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const record = await orderService.cancel(context, body.orderId, body.reason);
    revalidateOrderPages();
    return { success: true as const, record };
  });
}

export async function refundOrderAction(input: unknown) {
  return protectedAction(ORDER_MODULE_PERMISSIONS.ORDER_REFUND, async ({ platform }) => {
    const body = refundOrderSchema.parse(input);
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const record = await orderService.refund(context, body.orderId, body.reason);
    revalidateOrderPages();
    return { success: true as const, record };
  });
}

export async function assignOrderTableAction(input: unknown) {
  return protectedAction(ORDER_MODULE_PERMISSIONS.ORDER_UPDATE, async ({ platform }) => {
    const body = assignOrderTableSchema.parse(input);
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const record = await orderService.assignTable(context, body.orderId, body.tableId);
    revalidateOrderPages();
    return { success: true as const, record };
  });
}

export async function assignOrderCustomerAction(input: unknown) {
  return protectedAction(ORDER_MODULE_PERMISSIONS.ORDER_UPDATE, async ({ platform }) => {
    const body = assignOrderCustomerSchema.parse(input);
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const record = await orderService.assignCustomer(context, body.orderId, body.customerId);
    revalidateOrderPages();
    return { success: true as const, record };
  });
}

export async function transferOrderAction(input: unknown) {
  return protectedAction(ORDER_MODULE_PERMISSIONS.ORDER_TRANSFER, async ({ platform }) => {
    const body = transferOrderSchema.parse(input);
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const record = await orderService.transfer(
      context,
      body.orderId,
      body.targetBranchId,
      body.targetTableId,
    );
    revalidateOrderPages();
    return { success: true as const, record };
  });
}

export async function mergeOrdersAction(input: unknown) {
  return protectedAction(ORDER_MODULE_PERMISSIONS.ORDER_UPDATE, async ({ platform }) => {
    const body = mergeOrdersSchema.parse(input);
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const record = await orderService.mergeOrders(context, body);
    revalidateOrderPages();
    return { success: true as const, record };
  });
}

export async function splitOrderAction(input: unknown) {
  return protectedAction(ORDER_MODULE_PERMISSIONS.ORDER_UPDATE, async ({ platform }) => {
    const body = splitOrderSchema.parse(input);
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const records = await orderService.splitOrder(context, body);
    revalidateOrderPages();
    return { success: true as const, records };
  });
}

export async function bulkUpdateOrdersAction(input: unknown) {
  return protectedAction(ORDER_MODULE_PERMISSIONS.ORDER_UPDATE, async ({ platform }) => {
    const body = bulkUpdateOrdersSchema.parse(input);
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const updated = await orderService.bulkUpdate(context, body);
    revalidateOrderPages();
    return { success: true as const, updated };
  });
}

export async function archiveOrderAction(orderId: string) {
  return protectedAction(ORDER_MODULE_PERMISSIONS.ORDER_DELETE, async ({ platform }) => {
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const record = await orderService.archive(context, orderId);
    revalidateOrderPages();
    return { success: true as const, record };
  });
}

export async function restoreOrderAction(orderId: string) {
  return protectedAction(ORDER_MODULE_PERMISSIONS.ORDER_UPDATE, async ({ platform }) => {
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const record = await orderService.restore(context, orderId);
    revalidateOrderPages();
    return { success: true as const, record };
  });
}
