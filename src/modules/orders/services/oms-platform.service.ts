import "server-only";

import { ORDER_STATUSES, type OrderStatus } from "@/modules/orders/constants/order-status";
import { orderRepository } from "@/modules/orders/repository/order-repository";
import { buildOrderScopeFromInput } from "@/modules/orders/lib/order-scope";
import type { OmsPlatformContext, OrderRecord } from "@/modules/orders/types/order";

export interface OmsPlatformSnapshot {
  context: OmsPlatformContext;
  orders: OrderRecord[];
  activeCount: number;
  preparingCount: number;
  deliveryCount: number;
  completedTodayCount: number;
  totalRevenuePence: number;
}

export async function buildOmsPlatformSnapshot(
  context: OmsPlatformContext,
): Promise<OmsPlatformSnapshot> {
  const scope = buildOrderScopeFromInput(context);
  const orders = await orderRepository.list(scope);

  const activeStatuses = new Set<OrderStatus>([
    ORDER_STATUSES.PENDING,
    ORDER_STATUSES.CONFIRMED,
    ORDER_STATUSES.PREPARING,
    ORDER_STATUSES.READY,
    ORDER_STATUSES.SERVED,
    ORDER_STATUSES.OUT_FOR_DELIVERY,
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return {
    context,
    orders,
    activeCount: orders.filter((record) => activeStatuses.has(record.order.status)).length,
    preparingCount: orders.filter((record) => record.order.status === ORDER_STATUSES.PREPARING).length,
    deliveryCount: orders.filter((record) => record.order.status === ORDER_STATUSES.OUT_FOR_DELIVERY).length,
    completedTodayCount: orders.filter(
      (record) =>
        record.order.status === ORDER_STATUSES.COMPLETED &&
        record.order.completedAt?.slice(0, 10) === today,
    ).length,
    totalRevenuePence: orders
      .filter((record) => record.order.status === ORDER_STATUSES.COMPLETED)
      .reduce((sum, record) => sum + record.order.totalPence, 0),
  };
}
