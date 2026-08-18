import "server-only";

import { NextResponse } from "next/server";

import { resolveOrderScopeFromBusiness, toOmsPlatformContext } from "@/modules/orders/lib/order-scope";
import { orderService } from "@/modules/orders/services/order.service";
import { createOrderSchema, orderSearchSchema } from "@/modules/orders/validation/order-schemas";
import { jsonSuccess, withPlatformApiAuth } from "@/modules/platform/api/v1/platform-api-handler";
import { PLATFORM_API_SCOPES } from "@/modules/platform/constants/api-scopes";

export async function handleV1ListOrders(request: Request) {
  return withPlatformApiAuth(request, [PLATFORM_API_SCOPES.ORDERS_READ], async (auth) => {
    const scope = await resolveOrderScopeFromBusiness(auth.businessId);
    const context = toOmsPlatformContext(scope);
    const url = new URL(request.url);
    const parsed = orderSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const result = await orderService.search(parsed, context);
    return jsonSuccess(result);
  });
}

export async function handleV1CreateOrder(request: Request) {
  return withPlatformApiAuth(request, [PLATFORM_API_SCOPES.ORDERS_WRITE], async (auth) => {
    const scope = await resolveOrderScopeFromBusiness(auth.businessId);
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
  });
}

export async function handleV1GetOrder(request: Request, orderId: string) {
  return withPlatformApiAuth(request, [PLATFORM_API_SCOPES.ORDERS_READ], async (auth) => {
    const scope = await resolveOrderScopeFromBusiness(auth.businessId);
    const context = toOmsPlatformContext(scope);
    const record = await orderService.getById(context, orderId);

    if (!record) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return jsonSuccess(record);
  });
}
