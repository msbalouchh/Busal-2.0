import "server-only";

import {
  type KitchenQueuePriority,
  type KitchenQueueStation,
  type KitchenQueueStatus,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";

export interface KitchenQueueItemData {
  id: string;
  businessId: string;
  orderId: string;
  priority: KitchenQueuePriority;
  station: KitchenQueueStation;
  status: KitchenQueueStatus;
  queuedAt: Date;
  acknowledgedAt: Date | null;
  preparingAt: Date | null;
  readyAt: Date | null;
  servedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListKitchenQueueFilters {
  status?: KitchenQueueStatus;
  station?: KitchenQueueStation;
  branchId?: string | null;
}

const VALID_TRANSITIONS: Record<KitchenQueueStatus, KitchenQueueStatus[]> = {
  NEW: ["ACKNOWLEDGED"],
  ACKNOWLEDGED: ["PREPARING"],
  PREPARING: ["READY"],
  READY: ["SERVED"],
  SERVED: [],
};

function mapKitchenQueueItem(item: {
  id: string;
  businessId: string;
  orderId: string;
  priority: KitchenQueuePriority;
  station: KitchenQueueStation;
  status: KitchenQueueStatus;
  queuedAt: Date;
  acknowledgedAt: Date | null;
  preparingAt: Date | null;
  readyAt: Date | null;
  servedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): KitchenQueueItemData {
  return {
    id: item.id,
    businessId: item.businessId,
    orderId: item.orderId,
    priority: item.priority,
    station: item.station,
    status: item.status,
    queuedAt: item.queuedAt,
    acknowledgedAt: item.acknowledgedAt,
    preparingAt: item.preparingAt,
    readyAt: item.readyAt,
    servedAt: item.servedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function getKitchenQueueRecord(queueItemId: string) {
  const item = await prisma.kitchenQueue.findUnique({
    where: { id: queueItemId },
  });

  if (!item) {
    throw new Error("Kitchen queue item not found");
  }

  return item;
}

function assertValidTransition(
  currentStatus: KitchenQueueStatus,
  nextStatus: KitchenQueueStatus,
): void {
  if (!(VALID_TRANSITIONS[currentStatus] ?? []).includes(nextStatus)) {
    throw new Error(
      `Invalid kitchen queue status transition from ${currentStatus} to ${nextStatus}`,
    );
  }
}

async function transitionQueueItem(
  queueItemId: string,
  nextStatus: KitchenQueueStatus,
  timestamps: Partial<{
    acknowledgedAt: Date;
    preparingAt: Date;
    readyAt: Date;
    servedAt: Date;
  }>,
): Promise<KitchenQueueItemData> {
  const existing = await getKitchenQueueRecord(queueItemId);
  assertValidTransition(existing.status, nextStatus);

  const updated = await prisma.kitchenQueue.update({
    where: { id: queueItemId },
    data: {
      status: nextStatus,
      ...timestamps,
    },
  });

  return mapKitchenQueueItem(updated);
}

export async function enqueueOrder(
  businessId: string,
  orderId: string,
  options: {
    priority?: KitchenQueuePriority;
    station?: KitchenQueueStation;
    branchId?: string | null;
  } = {},
): Promise<KitchenQueueItemData> {
  const order = await prisma.legacyOrder.findFirst({
    where: { id: orderId, businessId },
    select: { id: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const existing = await prisma.kitchenQueue.findUnique({
    where: { orderId },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Kitchen queue entry already exists for this order");
  }

  const item = await prisma.kitchenQueue.create({
    data: {
      businessId,
      branchId: options.branchId ?? null,
      orderId,
      priority: options.priority ?? "NORMAL",
      station: options.station ?? "GENERAL",
      status: "NEW",
    },
  });

  return mapKitchenQueueItem(item);
}

export async function enqueueOrderInTransaction(
  tx: Prisma.TransactionClient,
  businessId: string,
  orderId: string,
  branchId: string | null = null,
): Promise<KitchenQueueItemData> {
  const item = await tx.kitchenQueue.create({
    data: {
      businessId,
      branchId,
      orderId,
      priority: "NORMAL",
      station: "GENERAL",
      status: "NEW",
    },
  });

  return mapKitchenQueueItem(item);
}

export async function getQueue(
  businessId: string,
  filters: ListKitchenQueueFilters = {},
): Promise<KitchenQueueItemData[]> {
  const items = await prisma.kitchenQueue.findMany({
    where: {
      businessId,
      ...branchFilter(filters.branchId ?? null),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.station ? { station: filters.station } : {}),
    },
    orderBy: [{ queuedAt: "asc" }],
  });

  return items.map(mapKitchenQueueItem);
}

export async function getQueueItem(queueItemId: string): Promise<KitchenQueueItemData> {
  const item = await getKitchenQueueRecord(queueItemId);
  return mapKitchenQueueItem(item);
}

export async function acknowledgeOrder(queueItemId: string): Promise<KitchenQueueItemData> {
  return transitionQueueItem(queueItemId, "ACKNOWLEDGED", {
    acknowledgedAt: new Date(),
  });
}

export async function startPreparation(queueItemId: string): Promise<KitchenQueueItemData> {
  return transitionQueueItem(queueItemId, "PREPARING", {
    preparingAt: new Date(),
  });
}

export async function markReady(queueItemId: string): Promise<KitchenQueueItemData> {
  return transitionQueueItem(queueItemId, "READY", {
    readyAt: new Date(),
  });
}

export async function markServed(queueItemId: string): Promise<KitchenQueueItemData> {
  return transitionQueueItem(queueItemId, "SERVED", {
    servedAt: new Date(),
  });
}

export async function listOrdersByStatus(
  businessId: string,
  status: KitchenQueueStatus,
  branchId: string | null = null,
): Promise<KitchenQueueItemData[]> {
  return getQueue(businessId, { status, branchId });
}
