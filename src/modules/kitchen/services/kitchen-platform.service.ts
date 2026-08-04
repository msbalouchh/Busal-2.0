import { KITCHEN_STATUSES } from "@/modules/kitchen/constants/kitchen-status";
import { DEFAULT_KITCHEN_SCOPE } from "@/modules/kitchen/constants/mock-data";
import { kitchenRepository } from "@/modules/kitchen/repository/kitchen-repository";
import type {
  KitchenPlatformContext,
  KitchenQueue,
  KitchenRecord,
  KitchenScreen,
  KitchenStation,
} from "@/modules/kitchen/types/kitchen";

export interface KitchenPlatformSnapshot {
  context: KitchenPlatformContext;
  records: KitchenRecord[];
  stations: KitchenStation[];
  screens: KitchenScreen[];
  queues: KitchenQueue[];
  orderCount: number;
  queuedCount: number;
  acceptedCount: number;
  preparingCount: number;
  readyCount: number;
  delayedCount: number;
  recalledCount: number;
  avgPrepMinutes: number;
  onTimePercentage: number;
}

export interface KitchenPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId?: string;
  branchId?: string;
  userId?: string;
  kitchenId?: string;
}

export function buildKitchenPlatformContext(
  input: KitchenPlatformInput = {},
): KitchenPlatformContext {
  return {
    tenantId: input.tenantId ?? DEFAULT_KITCHEN_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_KITCHEN_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_KITCHEN_SCOPE.businessId,
    branchId: input.branchId ?? DEFAULT_KITCHEN_SCOPE.branchId,
    userId: input.userId ?? DEFAULT_KITCHEN_SCOPE.userId,
    kitchenId: input.kitchenId ?? DEFAULT_KITCHEN_SCOPE.kitchenId,
  };
}

export function buildKitchenPlatformSnapshot(
  input: KitchenPlatformInput = {},
): KitchenPlatformSnapshot {
  const context = buildKitchenPlatformContext(input);
  const records = kitchenRepository
    .listRecords()
    .filter(
      (record) =>
        record.order.tenantId === context.tenantId &&
        record.order.businessId === context.businessId &&
        record.order.kitchenId === context.kitchenId,
    );

  const countByStatus = (status: string) =>
    records.filter((record) => record.order.status === status).length;

  const prepSum = records.reduce((sum, r) => sum + r.analytics.totalPrepMinutes, 0);
  const onTimeSum = records.reduce((sum, r) => sum + r.analytics.onTimePercentage, 0);

  return {
    context,
    records,
    stations: kitchenRepository.listStations(),
    screens: kitchenRepository.listScreens(),
    queues: kitchenRepository.listQueues(),
    orderCount: records.length,
    queuedCount: countByStatus(KITCHEN_STATUSES.QUEUED),
    acceptedCount: countByStatus(KITCHEN_STATUSES.ACCEPTED),
    preparingCount: countByStatus(KITCHEN_STATUSES.PREPARING),
    readyCount: countByStatus(KITCHEN_STATUSES.READY),
    delayedCount: countByStatus(KITCHEN_STATUSES.DELAYED),
    recalledCount: records.filter((r) => r.order.isRecalled).length,
    avgPrepMinutes: records.length > 0 ? prepSum / records.length : 0,
    onTimePercentage: records.length > 0 ? onTimeSum / records.length : 100,
  };
}

export function getDefaultKitchenSnapshot(): KitchenPlatformSnapshot {
  return buildKitchenPlatformSnapshot();
}

export function getActiveKitchenOrders(limit = 10): KitchenRecord[] {
  return kitchenRepository
    .search({
      status: KITCHEN_STATUSES.PREPARING,
      limit,
    })
    .concat(
      kitchenRepository.search({
        status: KITCHEN_STATUSES.QUEUED,
        limit,
      }),
    )
    .slice(0, limit);
}

export function getDelayedKitchenOrders(): KitchenRecord[] {
  return kitchenRepository.search({ status: KITCHEN_STATUSES.DELAYED });
}
