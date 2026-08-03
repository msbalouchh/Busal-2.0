import { DEFAULT_OMS_SCOPE } from "@/modules/orders/constants/mock-data";
import { orderRepository } from "@/modules/orders/repository/order-repository";
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

export interface OmsPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId?: string;
  branchId?: string;
  userId?: string;
}

export function buildOmsPlatformContext(input: OmsPlatformInput = {}): OmsPlatformContext {
  return {
    tenantId: input.tenantId ?? DEFAULT_OMS_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_OMS_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_OMS_SCOPE.businessId,
    branchId: input.branchId ?? DEFAULT_OMS_SCOPE.branchId,
    userId: input.userId ?? DEFAULT_OMS_SCOPE.userId,
  };
}

export function buildOmsPlatformSnapshot(input: OmsPlatformInput = {}): OmsPlatformSnapshot {
  const context = buildOmsPlatformContext(input);
  const orders = orderRepository.search({
    tenantId: context.tenantId,
    businessId: context.businessId,
    branchId: context.branchId,
  });

  const activeStatuses = new Set([
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "out_for_delivery",
  ]);

  return {
    context,
    orders,
    activeCount: orders.filter((record) => activeStatuses.has(record.order.status)).length,
    preparingCount: orders.filter((record) => record.order.status === "preparing").length,
    deliveryCount: orders.filter((record) => record.order.status === "out_for_delivery").length,
    completedTodayCount: orders.filter((record) => record.order.status === "completed").length,
    totalRevenuePence: orders
      .filter((record) => record.order.status === "completed")
      .reduce((sum, record) => sum + record.order.totalPence, 0),
  };
}

export function getDefaultOmsSnapshot(): OmsPlatformSnapshot {
  return buildOmsPlatformSnapshot();
}
