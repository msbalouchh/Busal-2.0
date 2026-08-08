import "server-only";

import { NextResponse } from "next/server";

import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";
import { ORDER_MODULE_PERMISSIONS } from "@/modules/orders/constants/permissions";
import { resolveOrderScope, toOmsPlatformContext } from "@/modules/orders/lib/order-scope";
import { orderService } from "@/modules/orders/services/order.service";
import { buildOmsPlatformSnapshot } from "@/modules/orders/services/oms-platform.service";
import {
  bulkUpdateOrdersSchema,
  cancelOrderSchema,
  createOrderSchema,
  modifyOrderSchema,
  orderSearchSchema,
  refundOrderSchema,
} from "@/modules/orders/validation/order-schemas";

function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export async function handleListOrders(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ORDER_MODULE_PERMISSIONS.ORDER_READ });
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const url = new URL(request.url);
    const parsed = orderSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const [result, snapshot] = await Promise.all([
      orderService.search(parsed, context),
      buildOmsPlatformSnapshot(context),
    ]);
    return jsonSuccess({ ...result, snapshot });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateOrder(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ORDER_MODULE_PERMISSIONS.ORDER_CREATE });
    const scope = resolveOrderScope(platform);
    const context = toOmsPlatformContext(scope);
    const body = createOrderSchema.parse(await request.json());
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
    return jsonSuccess(record, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleGetOrder(_request: Request, orderId: string) {
  try {
    const platform = await protectedRoute({ permission: ORDER_MODULE_PERMISSIONS.ORDER_READ });
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const record = await orderService.getById(context, orderId);
    if (!record) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdateOrder(request: Request, orderId: string) {
  try {
    const platform = await protectedRoute({ permission: ORDER_MODULE_PERMISSIONS.ORDER_UPDATE });
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const body = modifyOrderSchema.parse({ ...(await request.json()), orderId });
    const record = await orderService.modify(context, body);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCancelOrder(request: Request, orderId: string) {
  try {
    const platform = await protectedRoute({ permission: ORDER_MODULE_PERMISSIONS.ORDER_CANCEL });
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const body = cancelOrderSchema.parse({ ...(await request.json()), orderId });
    const record = await orderService.cancel(context, body.orderId, body.reason);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleRefundOrder(request: Request, orderId: string) {
  try {
    const platform = await protectedRoute({ permission: ORDER_MODULE_PERMISSIONS.ORDER_REFUND });
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const body = refundOrderSchema.parse({ ...(await request.json()), orderId });
    const record = await orderService.refund(context, body.orderId, body.reason);
    return jsonSuccess(record);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleBulkUpdateOrders(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ORDER_MODULE_PERMISSIONS.ORDER_UPDATE });
    const context = toOmsPlatformContext(resolveOrderScope(platform));
    const body = bulkUpdateOrdersSchema.parse(await request.json());
    const updated = await orderService.bulkUpdate(context, body);
    return jsonSuccess({ updated });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
