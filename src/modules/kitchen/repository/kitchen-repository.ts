import "server-only";

import type { KitchenQueueStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { runBatchTransaction } from "@/lib/prisma-transaction";
import {
  KITCHEN_PRIORITIES,
  KITCHEN_STATUSES,
} from "@/modules/kitchen/constants/kitchen-status";
import type { KitchenTenantScope } from "@/modules/kitchen/lib/kitchen-scope";
import {
  appendKitchenNote,
  appendTimelineEvent,
  composeKitchenNotes,
  composeStationDescription,
  extractRestaurantOrderId,
  isOmsKitchenOrderId,
  mapDomainStatusToRestaurant,
  mapPrismaStationToDomain,
  mapQueueToRecord,
  mapRestaurantOrderToRecord,
  mapStationStatusToPrisma,
  OMS_KITCHEN_ORDER_PREFIX,
  parseStationMeta,
  splitKitchenNotes,
  synthesizeQueues,
  synthesizeScreens,
  timelineTypeForAction,
  type KitchenQueueWithOrder,
  type RestaurantOrderWithKitchenRelations,
  type StoredKitchenMeta,
} from "@/modules/kitchen/lib/kitchen-mappers";
import type {
  AcceptKitchenOrderInput,
  AddKitchenNoteInput,
  AssignStationInput,
  BumpKitchenOrderInput,
  KitchenQueue,
  KitchenRecord,
  KitchenScreen,
  KitchenSearchQuery,
  KitchenStation,
  RecallKitchenOrderInput,
  UpdateKitchenItemStatusInput,
} from "@/modules/kitchen/types/kitchen";
import type {
  CreateKitchenStationSchemaInput,
  KitchenSearchSchemaInput,
  UpdateKitchenStationSchemaInput,
} from "@/modules/kitchen/validation/kitchen-schemas";

const DEFAULT_PAGE_SIZE = 25;

const queueInclude = {
  order: {
    include: {
      table: { select: { id: true, name: true } },
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          quantity: true,
          nameSnapshot: true,
          notes: true,
          menuItemId: true,
        },
      },
    },
  },
} satisfies Prisma.KitchenQueueInclude;

const restaurantOrderInclude = {
  items: { include: { modifiers: true }, orderBy: { createdAt: "asc" } },
  restaurantTable: { select: { id: true, tableNumber: true, tableName: true } },
  staff: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.RestaurantOrderInclude;

export interface KitchenSearchResult {
  records: KitchenRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const ACTIVE_QUEUE_STATUSES: KitchenQueueStatus[] = [
  "NEW",
  "ACKNOWLEDGED",
  "PREPARING",
  "READY",
];

const ACTIVE_RESTAURANT_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
] as const;

function scopeWhere(scope: KitchenTenantScope): Prisma.KitchenQueueWhereInput {
  return {
    businessId: scope.businessId,
    branchId: scope.branchId,
  };
}

function restaurantScopeWhere(scope: KitchenTenantScope): Prisma.RestaurantOrderWhereInput {
  return {
    businessId: scope.businessId,
    branchId: scope.branchId,
  };
}

function priorityWeight(priority: string): number {
  switch (priority) {
    case KITCHEN_PRIORITIES.VIP:
      return 5;
    case KITCHEN_PRIORITIES.URGENT:
      return 4;
    case KITCHEN_PRIORITIES.HIGH:
      return 3;
    case KITCHEN_PRIORITIES.NORMAL:
      return 2;
    case KITCHEN_PRIORITIES.LOW:
    default:
      return 1;
  }
}

function filterRecords(records: KitchenRecord[], query: KitchenSearchQuery): KitchenRecord[] {
  let results = [...records];

  if (query.kitchenId) {
    results = results.filter((record) => record.order.kitchenId === query.kitchenId);
  }

  if (query.stationId) {
    results = results.filter((record) =>
      record.tickets.some((ticket) => ticket.stationId === query.stationId),
    );
  }

  if (query.status) {
    results = results.filter((record) => record.order.status === query.status);
  }

  if (query.priority) {
    results = results.filter((record) => record.order.priority === query.priority);
  }

  if (query.stationType) {
    results = results.filter((record) =>
      record.items.some((item) => item.stationType === query.stationType),
    );
  }

  if (query.isRecalled !== undefined) {
    results = results.filter((record) => record.order.isRecalled === query.isRecalled);
  }

  if (query.query) {
    const term = query.query.toLowerCase();
    results = results.filter(
      (record) =>
        record.order.orderNumber.toLowerCase().includes(term) ||
        record.items.some((item) => item.menuItemName.toLowerCase().includes(term)) ||
        (record.order.tableLabel?.toLowerCase().includes(term) ?? false),
    );
  }

  results.sort(
    (a, b) => priorityWeight(b.order.priority) - priorityWeight(a.order.priority),
  );

  if (query.limit) {
    results = results.slice(0, query.limit);
  }

  return results;
}

function sortRecords(
  records: KitchenRecord[],
  sortBy: KitchenSearchSchemaInput["sortBy"] = "queuedAt",
  sortDirection: "asc" | "desc" = "asc",
): KitchenRecord[] {
  const direction = sortDirection === "asc" ? 1 : -1;

  return [...records].sort((a, b) => {
    switch (sortBy) {
      case "priority":
        return (priorityWeight(b.order.priority) - priorityWeight(a.order.priority)) * direction;
      case "orderNumber":
        return a.order.orderNumber.localeCompare(b.order.orderNumber) * direction;
      case "status":
        return a.order.status.localeCompare(b.order.status) * direction;
      case "queuedAt":
      default:
        return (
          (new Date(a.order.queuedAt).getTime() - new Date(b.order.queuedAt).getTime()) *
          direction
        );
    }
  });
}

/** Prisma-backed kitchen repository with tenant scoping. */
export class KitchenRepository {
  private async loadStations(scope: KitchenTenantScope): Promise<KitchenStation[]> {
    const stations = await prisma.kitchenStation.findMany({
      where: {
        businessId: scope.businessId,
        branchId: scope.branchId,
        status: { not: "ARCHIVED" },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });

    return stations.map((station) => mapPrismaStationToDomain(station, scope));
  }

  private async loadQueueRecords(scope: KitchenTenantScope): Promise<KitchenRecord[]> {
    const [queueItems, stations] = await Promise.all([
      prisma.kitchenQueue.findMany({
        where: {
          ...scopeWhere(scope),
          status: { in: ACTIVE_QUEUE_STATUSES },
        },
        include: queueInclude,
        orderBy: [{ priority: "desc" }, { queuedAt: "asc" }],
      }),
      this.loadStations(scope),
    ]);

    return queueItems.map((item) => mapQueueToRecord(item as KitchenQueueWithOrder, scope, stations));
  }

  private async loadOmsRecords(scope: KitchenTenantScope): Promise<KitchenRecord[]> {
    const [orders, stations, existingQueueOrderIds] = await Promise.all([
      prisma.restaurantOrder.findMany({
        where: {
          ...restaurantScopeWhere(scope),
          status: { in: [...ACTIVE_RESTAURANT_STATUSES] },
        },
        include: restaurantOrderInclude,
        orderBy: [{ isPriority: "desc" }, { placedAt: "asc" }],
      }),
      this.loadStations(scope),
      prisma.kitchenQueue.findMany({
        where: scopeWhere(scope),
        select: { orderId: true },
      }),
    ]);

    const queueOrderIdSet = new Set(existingQueueOrderIds.map((entry) => entry.orderId));

    return orders
      .filter((order) => !queueOrderIdSet.has(order.id))
      .map((order) =>
        mapRestaurantOrderToRecord(order as RestaurantOrderWithKitchenRelations, scope, stations),
      );
  }

  private async loadAllRecords(scope: KitchenTenantScope): Promise<KitchenRecord[]> {
    const [queueRecords, omsRecords] = await Promise.all([
      this.loadQueueRecords(scope),
      this.loadOmsRecords(scope),
    ]);

    return [...queueRecords, ...omsRecords];
  }

  async listRecords(scope: KitchenTenantScope): Promise<KitchenRecord[]> {
    return this.loadAllRecords(scope);
  }

  async listStations(scope: KitchenTenantScope): Promise<KitchenStation[]> {
    return this.loadStations(scope);
  }

  async listScreens(scope: KitchenTenantScope): Promise<KitchenScreen[]> {
    const stations = await this.loadStations(scope);
    return synthesizeScreens(scope, stations);
  }

  async listQueues(scope: KitchenTenantScope): Promise<KitchenQueue[]> {
    const [stations, records] = await Promise.all([
      this.loadStations(scope),
      this.loadAllRecords(scope),
    ]);
    return synthesizeQueues(scope, stations, records);
  }

  async findById(scope: KitchenTenantScope, kitchenOrderId: string): Promise<KitchenRecord | null> {
    if (isOmsKitchenOrderId(kitchenOrderId)) {
      const orderId = extractRestaurantOrderId(kitchenOrderId);
      const [order, stations] = await Promise.all([
        prisma.restaurantOrder.findFirst({
          where: { id: orderId, ...restaurantScopeWhere(scope) },
          include: restaurantOrderInclude,
        }),
        this.loadStations(scope),
      ]);

      if (!order) {
        return null;
      }

      return mapRestaurantOrderToRecord(order as RestaurantOrderWithKitchenRelations, scope, stations);
    }

    const [queue, stations] = await Promise.all([
      prisma.kitchenQueue.findFirst({
        where: { id: kitchenOrderId, ...scopeWhere(scope) },
        include: queueInclude,
      }),
      this.loadStations(scope),
    ]);

    if (!queue) {
      return null;
    }

    return mapQueueToRecord(queue as KitchenQueueWithOrder, scope, stations);
  }

  async findByStationId(scope: KitchenTenantScope, stationId: string): Promise<KitchenRecord[]> {
    const records = await this.loadAllRecords(scope);
    return records.filter((record) =>
      record.tickets.some((ticket) => ticket.stationId === stationId),
    );
  }

  async search(
    scope: KitchenTenantScope,
    query: KitchenSearchQuery & KitchenSearchSchemaInput = { page: 1, pageSize: DEFAULT_PAGE_SIZE, sortBy: "queuedAt", sortDirection: "asc" },
  ): Promise<KitchenSearchResult> {
    const records = sortRecords(
      filterRecords(await this.loadAllRecords(scope), query),
      query.sortBy,
      query.sortDirection,
    );

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? query.limit ?? DEFAULT_PAGE_SIZE;
    const total = records.length;
    const start = (page - 1) * pageSize;

    return {
      records: records.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getQueueRecords(scope: KitchenTenantScope, queueId: string): Promise<KitchenRecord[]> {
    const queues = await this.listQueues(scope);
    const queue = queues.find((entry) => entry.id === queueId);
    if (!queue) {
      return [];
    }

    const ticketSet = new Set(queue.ticketIds);
    const records = (await this.loadAllRecords(scope)).filter((record) =>
      record.tickets.some((ticket) => ticketSet.has(ticket.id)),
    );

    if (queue.sortStrategy === "fifo") {
      return records.sort(
        (a, b) =>
          new Date(a.order.queuedAt).getTime() - new Date(b.order.queuedAt).getTime(),
      );
    }

    return records.sort(
      (a, b) => priorityWeight(b.order.priority) - priorityWeight(a.order.priority),
    );
  }

  async createStation(
    scope: KitchenTenantScope,
    input: CreateKitchenStationSchemaInput,
  ): Promise<KitchenStation> {
    const station = await prisma.kitchenStation.create({
      data: {
        businessId: scope.businessId,
        branchId: scope.branchId,
        name: input.name,
        displayOrder: input.displayOrder,
        status: mapStationStatusToPrisma(input.isActive),
        description: composeStationDescription({
          stationType: input.stationType,
          customLabel: input.customLabel ?? null,
          maxConcurrentItems: input.maxConcurrentItems,
          avgPrepMinutes: input.avgPrepMinutes,
        }),
      },
    });

    return mapPrismaStationToDomain(station, scope);
  }

  async updateStation(
    scope: KitchenTenantScope,
    input: UpdateKitchenStationSchemaInput,
  ): Promise<KitchenStation | null> {
    const existing = await prisma.kitchenStation.findFirst({
      where: { id: input.stationId, businessId: scope.businessId, branchId: scope.branchId },
    });

    if (!existing) {
      return null;
    }

    const currentMeta = parseStationMeta(existing.description);
    const description = composeStationDescription({
      stationType: input.stationType ?? currentMeta.stationType,
      customLabel: input.customLabel ?? currentMeta.customLabel,
      maxConcurrentItems: input.maxConcurrentItems ?? currentMeta.maxConcurrentItems,
      avgPrepMinutes: input.avgPrepMinutes ?? currentMeta.avgPrepMinutes,
    });

    const station = await prisma.kitchenStation.update({
      where: { id: input.stationId },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
        ...(input.isActive !== undefined
          ? { status: mapStationStatusToPrisma(input.isActive) }
          : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });

    return mapPrismaStationToDomain(station, scope);
  }

  async archiveStation(scope: KitchenTenantScope, stationId: string): Promise<boolean> {
    const existing = await prisma.kitchenStation.findFirst({
      where: { id: stationId, businessId: scope.businessId, branchId: scope.branchId },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await prisma.kitchenStation.update({
      where: { id: stationId },
      data: { status: "ARCHIVED" },
    });

    return true;
  }

  private async mutateQueueMeta(
    scope: KitchenTenantScope,
    kitchenOrderId: string,
    updater: (meta: StoredKitchenMeta, record: KitchenRecord) => StoredKitchenMeta,
    queueUpdater?: (status: KitchenQueueStatus, now: Date) => Prisma.KitchenQueueUpdateInput,
  ): Promise<KitchenRecord | null> {
    const queue = await prisma.kitchenQueue.findFirst({
      where: { id: kitchenOrderId, ...scopeWhere(scope) },
      include: queueInclude,
    });

    if (!queue) {
      return null;
    }

    const stations = await this.loadStations(scope);
    const record = mapQueueToRecord(queue as KitchenQueueWithOrder, scope, stations);
    const { guestNotes, meta } = splitKitchenNotes(queue.order.notes);
    const nextMeta = updater(meta, record);
    const now = new Date();

    await runBatchTransaction([
      prisma.kitchenQueue.update({
        where: { id: kitchenOrderId },
        data: queueUpdater?.(queue.status, now) ?? {},
      }),
      prisma.restaurantOrder.update({
        where: { id: queue.orderId },
        data: {
          notes: composeKitchenNotes(guestNotes, nextMeta),
        },
      }),
    ]);

    return this.findById(scope, kitchenOrderId);
  }

  private async mutateOmsMeta(
    scope: KitchenTenantScope,
    kitchenOrderId: string,
    updater: (meta: StoredKitchenMeta, record: KitchenRecord) => StoredKitchenMeta,
    orderUpdater?: (now: Date) => Prisma.RestaurantOrderUpdateInput,
  ): Promise<KitchenRecord | null> {
    const orderId = extractRestaurantOrderId(kitchenOrderId);
    const order = await prisma.restaurantOrder.findFirst({
      where: { id: orderId, ...restaurantScopeWhere(scope) },
      include: restaurantOrderInclude,
    });

    if (!order) {
      return null;
    }

    const stations = await this.loadStations(scope);
    const record = mapRestaurantOrderToRecord(order as RestaurantOrderWithKitchenRelations, scope, stations);
    const { guestNotes, meta } = splitKitchenNotes(order.notes);
    const nextMeta = updater(meta, record);
    const now = new Date();

    await prisma.restaurantOrder.update({
      where: { id: orderId },
      data: {
        notes: composeKitchenNotes(guestNotes, nextMeta),
        ...(orderUpdater?.(now) ?? {}),
      },
    });

    return this.findById(scope, kitchenOrderId);
  }

  private async mutateRecordMeta(
    scope: KitchenTenantScope,
    kitchenOrderId: string,
    updater: (meta: StoredKitchenMeta, record: KitchenRecord) => StoredKitchenMeta,
    options?: {
      queueStatus?: KitchenQueueStatus;
      restaurantStatus?: ReturnType<typeof mapDomainStatusToRestaurant>;
      action?: string;
      actorId?: string | null;
      actorName?: string | null;
      message?: string;
    },
  ): Promise<KitchenRecord | null> {
    const appendEvent = (meta: StoredKitchenMeta, record: KitchenRecord): StoredKitchenMeta => {
      if (!options?.action) {
        return updater(meta, record);
      }

      return updater(
        appendTimelineEvent(meta, {
          kitchenOrderId,
          ticketId: record.tickets[0]?.id ?? null,
          itemId: null,
          eventType: timelineTypeForAction(options.action),
          actorId: options.actorId ?? scope.userId,
          actorName: options.actorName ?? "Kitchen Staff",
          message: options.message ?? options.action,
          metadata: {},
          occurredAt: new Date().toISOString(),
        }),
        record,
      );
    };

    if (isOmsKitchenOrderId(kitchenOrderId)) {
      return this.mutateOmsMeta(scope, kitchenOrderId, appendEvent, (now) => {
        const data: Prisma.RestaurantOrderUpdateInput = {};
        if (options?.restaurantStatus) {
          data.status = options.restaurantStatus;
        }
        if (options?.action === "accept") {
          data.kitchenAcceptedAt = now;
        }
        if (options?.action === "fire" || options?.action === "prepare") {
          data.kitchenPreparingAt = now;
        }
        if (options?.action === "ready") {
          data.kitchenReadyAt = now;
        }
        if (options?.action === "bump" || options?.action === "serve" || options?.action === "complete") {
          data.kitchenServedAt = now;
        }
        if (options?.action === "complete") {
          data.completedAt = now;
        }
        if (options?.action === "cancel") {
          data.cancelledAt = now;
        }
        return data;
      });
    }

    return this.mutateQueueMeta(
      scope,
      kitchenOrderId,
      appendEvent,
      (_status, now) => {
        const data: Prisma.KitchenQueueUpdateInput = {};
        if (options?.queueStatus) {
          data.status = options.queueStatus;
        }
        if (options?.action === "accept") {
          data.acknowledgedAt = now;
          data.status = "ACKNOWLEDGED";
        }
        if (options?.action === "fire" || options?.action === "prepare") {
          data.preparingAt = now;
          data.status = "PREPARING";
        }
        if (options?.action === "ready") {
          data.readyAt = now;
          data.status = "READY";
        }
        if (options?.action === "bump" || options?.action === "serve" || options?.action === "complete") {
          data.servedAt = now;
          data.status = "SERVED";
        }
        return data;
      },
    );
  }

  async acceptOrder(
    scope: KitchenTenantScope,
    input: AcceptKitchenOrderInput,
  ): Promise<KitchenRecord | null> {
    return this.mutateRecordMeta(scope, input.kitchenOrderId, (meta) => meta, {
      action: "accept",
      actorId: input.acceptedBy ?? scope.userId,
      message: "Order accepted",
      queueStatus: "ACKNOWLEDGED",
      restaurantStatus: "CONFIRMED",
    });
  }

  async fireOrder(scope: KitchenTenantScope, kitchenOrderId: string): Promise<KitchenRecord | null> {
    return this.mutateRecordMeta(
      scope,
      kitchenOrderId,
      (meta) => ({ ...meta, isHeld: false }),
      {
        action: "fire",
        message: "Order fired to kitchen",
        queueStatus: "PREPARING",
        restaurantStatus: "PREPARING",
      },
    );
  }

  async holdOrder(scope: KitchenTenantScope, kitchenOrderId: string): Promise<KitchenRecord | null> {
    return this.mutateRecordMeta(
      scope,
      kitchenOrderId,
      (meta) => ({ ...meta, isHeld: true }),
      {
        action: "hold",
        message: "Order held",
      },
    );
  }

  async resumeOrder(scope: KitchenTenantScope, kitchenOrderId: string): Promise<KitchenRecord | null> {
    return this.mutateRecordMeta(
      scope,
      kitchenOrderId,
      (meta) => ({ ...meta, isHeld: false }),
      {
        action: "prepare",
        message: "Order resumed",
      },
    );
  }

  async markReady(scope: KitchenTenantScope, kitchenOrderId: string): Promise<KitchenRecord | null> {
    return this.mutateRecordMeta(scope, kitchenOrderId, (meta) => meta, {
      action: "ready",
      message: "Order ready for service",
      queueStatus: "READY",
      restaurantStatus: "READY",
    });
  }

  async bumpOrder(
    scope: KitchenTenantScope,
    input: BumpKitchenOrderInput,
  ): Promise<KitchenRecord | null> {
    return this.mutateRecordMeta(
      scope,
      input.kitchenOrderId,
      (meta) => ({ ...meta, bumpCount: (meta.bumpCount ?? 0) + 1 }),
      {
        action: "bump",
        actorId: input.bumpedBy ?? scope.userId,
        message: "Order bumped — served",
        queueStatus: "SERVED",
        restaurantStatus: "SERVED",
      },
    );
  }

  async completeOrder(scope: KitchenTenantScope, kitchenOrderId: string): Promise<KitchenRecord | null> {
    return this.mutateRecordMeta(scope, kitchenOrderId, (meta) => meta, {
      action: "complete",
      message: "Order completed",
      queueStatus: "SERVED",
      restaurantStatus: "COMPLETED",
    });
  }

  async recallOrder(
    scope: KitchenTenantScope,
    input: RecallKitchenOrderInput,
  ): Promise<KitchenRecord | null> {
    return this.mutateRecordMeta(
      scope,
      input.kitchenOrderId,
      (meta) => ({ ...meta, isRecalled: true, isHeld: false }),
      {
        action: "recall",
        actorId: input.recalledBy ?? scope.userId,
        message: input.reason ?? "Order recalled to kitchen",
        queueStatus: "PREPARING",
        restaurantStatus: "PREPARING",
      },
    );
  }

  async cancelOrder(scope: KitchenTenantScope, kitchenOrderId: string): Promise<KitchenRecord | null> {
    return this.mutateRecordMeta(scope, kitchenOrderId, (meta) => meta, {
      action: "cancel",
      message: "Order cancelled",
      restaurantStatus: "CANCELLED",
    });
  }

  async assignStation(
    scope: KitchenTenantScope,
    input: AssignStationInput,
  ): Promise<KitchenRecord | null> {
    const records = await this.loadAllRecords(scope);
    const record = records.find((entry) =>
      entry.tickets.some((ticket) => ticket.id === input.ticketId),
    );

    if (!record) {
      return null;
    }

    return this.mutateRecordMeta(
      scope,
      record.order.id,
      (meta) => ({
        ...meta,
        ticketStationIds: {
          ...(meta.ticketStationIds ?? {}),
          [input.ticketId]: input.stationId,
        },
        assignments: [
          ...(meta.assignments ?? []),
          {
            id: `assign-${Date.now()}`,
            ticketId: input.ticketId,
            itemId: null,
            stationId: input.stationId,
            assignedToUserId: input.assignedBy ?? scope.userId,
            assignedToName: input.isAutoAssigned ? "AI Router" : "Kitchen Staff",
            assignedAt: new Date().toISOString(),
            releasedAt: null,
            isAutoAssigned: input.isAutoAssigned ?? false,
          },
        ],
      }),
      {
        action: "prepare",
        actorId: input.assignedBy ?? scope.userId,
        actorName: input.isAutoAssigned ? "AI Router" : "Kitchen Manager",
        message: `Assigned to station ${input.stationId}`,
      },
    );
  }

  async updateItemStatus(
    scope: KitchenTenantScope,
    input: UpdateKitchenItemStatusInput,
  ): Promise<KitchenRecord | null> {
    const records = await this.loadAllRecords(scope);
    const record = records.find((entry) => entry.items.some((item) => item.id === input.itemId));

    if (!record) {
      return null;
    }

    const nextStatus = input.status;
    const allReady = record.items.every(
      (item) =>
        item.id === input.itemId
          ? nextStatus === KITCHEN_STATUSES.READY || nextStatus === KITCHEN_STATUSES.SERVED
          : item.status === KITCHEN_STATUSES.READY || item.status === KITCHEN_STATUSES.SERVED,
    );

    if (allReady) {
      return this.markReady(scope, record.order.id);
    }

    if (nextStatus === KITCHEN_STATUSES.PREPARING) {
      return this.fireOrder(scope, record.order.id);
    }

    return this.findById(scope, record.order.id);
  }

  async addNote(
    scope: KitchenTenantScope,
    input: AddKitchenNoteInput,
  ): Promise<KitchenRecord | null> {
    return this.mutateRecordMeta(
      scope,
      input.kitchenOrderId,
      (meta) =>
        appendKitchenNote(meta, {
          kitchenOrderId: input.kitchenOrderId,
          ticketId: input.ticketId ?? null,
          itemId: input.itemId ?? null,
          authorId: input.authorId,
          authorName: input.authorName,
          body: input.body,
          isInternal: input.isInternal ?? true,
        }),
      {
        action: "note",
        actorId: input.authorId,
        actorName: input.authorName,
        message: input.body,
      },
    );
  }

  async receiveFromOms(
    scope: KitchenTenantScope,
    restaurantOrderId: string,
    priority?: string,
  ): Promise<KitchenRecord | null> {
    const order = await prisma.restaurantOrder.findFirst({
      where: { id: restaurantOrderId, ...restaurantScopeWhere(scope) },
      include: restaurantOrderInclude,
    });

    if (!order) {
      return null;
    }

    await prisma.restaurantOrder.update({
      where: { id: restaurantOrderId },
      data: {
        status: "CONFIRMED",
        kitchenAcceptedAt: new Date(),
        ...(priority ? { isPriority: priority !== KITCHEN_PRIORITIES.NORMAL } : {}),
      },
    });

    return this.findById(scope, `${OMS_KITCHEN_ORDER_PREFIX}${restaurantOrderId}`);
  }

  async loadDisplayCards(scope: KitchenTenantScope) {
    const queueItems = await prisma.kitchenQueue.findMany({
      where: {
        ...scopeWhere(scope),
        status: { in: ACTIVE_QUEUE_STATUSES },
      },
      include: queueInclude,
      orderBy: [{ priority: "desc" }, { queuedAt: "asc" }],
    });

    return queueItems;
  }
}

export const kitchenRepository = new KitchenRepository();
