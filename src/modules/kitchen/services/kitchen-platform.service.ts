import "server-only";

import { KITCHEN_STATUSES } from "@/modules/kitchen/constants/kitchen-status";
import { buildKitchenPlatformContext } from "@/modules/kitchen/lib/kitchen-platform-context";
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
  businessId: string;
  branchId: string;
  userId?: string;
  kitchenId?: string;
}

function countByStatus(records: KitchenRecord[], status: string): number {
  return records.filter((record) => record.order.status === status).length;
}

export async function buildKitchenPlatformSnapshot(
  input: KitchenPlatformInput,
): Promise<KitchenPlatformSnapshot> {
  const context = buildKitchenPlatformContext(input);
  const scope = {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
    kitchenId: context.kitchenId,
  };

  const [records, stations, screens, queues] = await Promise.all([
    kitchenRepository.listRecords(scope),
    kitchenRepository.listStations(scope),
    kitchenRepository.listScreens(scope),
    kitchenRepository.listQueues(scope),
  ]);

  const prepSum = records.reduce((sum, record) => sum + record.analytics.totalPrepMinutes, 0);
  const onTimeSum = records.reduce((sum, record) => sum + record.analytics.onTimePercentage, 0);

  return {
    context,
    records,
    stations,
    screens,
    queues,
    orderCount: records.length,
    queuedCount: countByStatus(records, KITCHEN_STATUSES.QUEUED),
    acceptedCount: countByStatus(records, KITCHEN_STATUSES.ACCEPTED),
    preparingCount: countByStatus(records, KITCHEN_STATUSES.PREPARING),
    readyCount: countByStatus(records, KITCHEN_STATUSES.READY),
    delayedCount: countByStatus(records, KITCHEN_STATUSES.DELAYED),
    recalledCount: records.filter((record) => record.order.isRecalled).length,
    avgPrepMinutes: records.length > 0 ? prepSum / records.length : 0,
    onTimePercentage: records.length > 0 ? onTimeSum / records.length : 100,
  };
}

export async function getActiveKitchenOrders(
  input: KitchenPlatformInput,
  limit = 10,
): Promise<KitchenRecord[]> {
  const snapshot = await buildKitchenPlatformSnapshot(input);
  return snapshot.records
    .filter(
      (record) =>
        record.order.status !== KITCHEN_STATUSES.SERVED &&
        record.order.status !== KITCHEN_STATUSES.COMPLETED &&
        record.order.status !== KITCHEN_STATUSES.CANCELLED,
    )
    .slice(0, limit);
}

export async function getDelayedKitchenOrders(input: KitchenPlatformInput): Promise<KitchenRecord[]> {
  const snapshot = await buildKitchenPlatformSnapshot(input);
  return snapshot.records.filter((record) => record.order.status === KITCHEN_STATUSES.DELAYED);
}

export { buildKitchenPlatformContext };
