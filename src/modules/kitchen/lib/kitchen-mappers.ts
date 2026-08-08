import type {
  KitchenQueue,
  KitchenQueuePriority,
  KitchenQueueStatus,
  KitchenStation as PrismaKitchenStation,
  KitchenStationStatus,
  Prisma,
  RestaurantOrder,
  RestaurantOrderItem,
  RestaurantOrderStatus,
} from "@prisma/client";

import {
  KITCHEN_PRIORITIES,
  KITCHEN_QUEUE_SORT_STRATEGIES,
  KITCHEN_SCREEN_MODES,
  KITCHEN_STATION_TYPES,
  KITCHEN_STATUSES,
  KITCHEN_TIMELINE_EVENT_TYPES,
  type KitchenPriority,
  type KitchenStationType,
  type KitchenStatus,
  type KitchenTimelineEventType,
} from "@/modules/kitchen/constants/kitchen-status";
import type { KitchenTenantScope } from "@/modules/kitchen/lib/kitchen-scope";
import type {
  Kitchen,
  KitchenAiContext,
  KitchenAnalytics,
  KitchenAssignment,
  KitchenCompletion,
  KitchenDelay,
  KitchenItem,
  KitchenNote,
  KitchenOrder,
  KitchenPreparation,
  KitchenQueue as DomainKitchenQueue,
  KitchenRecord,
  KitchenScreen,
  KitchenStation,
  KitchenTicket,
  KitchenTimelineEvent,
} from "@/modules/kitchen/types/kitchen";

export const KITCHEN_META_DELIMITER = "\n---BUSAL_KITCHEN_META---\n";
export const OMS_KITCHEN_ORDER_PREFIX = "ro-";

export interface StoredKitchenMeta {
  timeline?: KitchenTimelineEvent[];
  notes?: KitchenNote[];
  assignments?: KitchenAssignment[];
  preparations?: KitchenPreparation[];
  completions?: KitchenCompletion[];
  delays?: KitchenDelay[];
  isHeld?: boolean;
  isRecalled?: boolean;
  bumpCount?: number;
  ticketStationIds?: Record<string, string>;
  preparationStages?: Array<{
    id: string;
    name: string;
    stationId?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
  }>;
  archived?: boolean;
}

export interface StationDescriptionMeta {
  stationType?: KitchenStationType;
  customLabel?: string | null;
  maxConcurrentItems?: number;
  avgPrepMinutes?: number;
}

export type KitchenQueueWithOrder = Prisma.KitchenQueueGetPayload<{
  include: {
    order: {
      include: {
        table: { select: { id: true; name: true } };
        items: {
          orderBy: { createdAt: "asc" };
          select: {
            id: true;
            quantity: true;
            nameSnapshot: true;
            notes: true;
            menuItemId: true;
          };
        };
      };
    };
  };
}>;

export type RestaurantOrderWithKitchenRelations = Prisma.RestaurantOrderGetPayload<{
  include: {
    items: { include: { modifiers: true }; orderBy: { createdAt: "asc" } };
    restaurantTable: { select: { id: true; tableNumber: true; tableName: true } };
    staff: { select: { id: true; firstName: true; lastName: true } };
  };
}>;

function iso(value: Date | string | null | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }
  return value instanceof Date ? value.toISOString() : value;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function splitKitchenNotes(raw: string | null): {
  guestNotes: string | null;
  meta: StoredKitchenMeta;
} {
  if (!raw) {
    return { guestNotes: null, meta: {} };
  }

  const delimiterIndex = raw.indexOf(KITCHEN_META_DELIMITER);
  if (delimiterIndex === -1) {
    return { guestNotes: raw, meta: {} };
  }

  const guestNotes = raw.slice(0, delimiterIndex).trim() || null;
  const metaRaw = raw.slice(delimiterIndex + KITCHEN_META_DELIMITER.length).trim();

  try {
    return { guestNotes, meta: JSON.parse(metaRaw) as StoredKitchenMeta };
  } catch {
    return { guestNotes: raw, meta: {} };
  }
}

export function composeKitchenNotes(
  guestNotes: string | null,
  meta: StoredKitchenMeta,
): string | null {
  const hasMeta =
    (meta.timeline?.length ?? 0) > 0 ||
    (meta.notes?.length ?? 0) > 0 ||
    (meta.assignments?.length ?? 0) > 0 ||
    (meta.preparations?.length ?? 0) > 0 ||
    (meta.completions?.length ?? 0) > 0 ||
    (meta.delays?.length ?? 0) > 0 ||
    (meta.preparationStages?.length ?? 0) > 0 ||
    meta.isHeld ||
    meta.isRecalled ||
    (meta.bumpCount ?? 0) > 0 ||
    meta.archived;

  if (!guestNotes && !hasMeta) {
    return null;
  }

  if (!hasMeta) {
    return guestNotes;
  }

  return `${guestNotes ?? ""}${KITCHEN_META_DELIMITER}${JSON.stringify(meta)}`;
}

export function parseStationMeta(description: string | null): StationDescriptionMeta {
  if (!description) {
    return {};
  }

  try {
    return JSON.parse(description) as StationDescriptionMeta;
  } catch {
    return { customLabel: description };
  }
}

export function composeStationDescription(meta: StationDescriptionMeta): string | null {
  if (!meta.stationType && !meta.customLabel && !meta.maxConcurrentItems && !meta.avgPrepMinutes) {
    return null;
  }
  return JSON.stringify(meta);
}

export function inferStationType(name: string): KitchenStationType {
  const lower = name.trim().toLowerCase();
  if (lower.includes("grill")) return KITCHEN_STATION_TYPES.GRILL;
  if (lower.includes("fry")) return KITCHEN_STATION_TYPES.FRYER;
  if (lower.includes("pizza")) return KITCHEN_STATION_TYPES.PIZZA;
  if (lower.includes("salad")) return KITCHEN_STATION_TYPES.SALADS;
  if (lower.includes("dessert")) return KITCHEN_STATION_TYPES.DESSERTS;
  if (lower.includes("drink") || lower.includes("beverage")) return KITCHEN_STATION_TYPES.DRINKS;
  if (lower.includes("bar")) return KITCHEN_STATION_TYPES.BAR;
  return KITCHEN_STATION_TYPES.CUSTOM;
}

export function mapQueuePriority(priority: KitchenQueuePriority): KitchenPriority {
  return priority === "HIGH" ? KITCHEN_PRIORITIES.HIGH : KITCHEN_PRIORITIES.NORMAL;
}

export function mapDomainPriorityToQueue(priority: KitchenPriority): KitchenQueuePriority {
  switch (priority) {
    case KITCHEN_PRIORITIES.HIGH:
    case KITCHEN_PRIORITIES.URGENT:
    case KITCHEN_PRIORITIES.VIP:
      return "HIGH";
    default:
      return "NORMAL";
  }
}

export function mapQueueStatusToDomain(
  status: KitchenQueueStatus,
  meta: StoredKitchenMeta,
): KitchenStatus {
  if (meta.isHeld) {
    return KITCHEN_STATUSES.HELD;
  }

  switch (status) {
    case "NEW":
      return KITCHEN_STATUSES.PENDING;
    case "ACKNOWLEDGED":
      return KITCHEN_STATUSES.QUEUED;
    case "PREPARING":
      return meta.isRecalled ? KITCHEN_STATUSES.PREPARING : KITCHEN_STATUSES.PREPARING;
    case "READY":
      return KITCHEN_STATUSES.READY;
    case "SERVED":
      return KITCHEN_STATUSES.SERVED;
    default:
      return KITCHEN_STATUSES.PENDING;
  }
}

export function mapRestaurantStatusToDomain(status: RestaurantOrderStatus, meta: StoredKitchenMeta): KitchenStatus {
  if (meta.isHeld) {
    return KITCHEN_STATUSES.HELD;
  }

  switch (status) {
    case "PENDING":
      return KITCHEN_STATUSES.PENDING;
    case "CONFIRMED":
      return KITCHEN_STATUSES.QUEUED;
    case "PREPARING":
      return KITCHEN_STATUSES.PREPARING;
    case "READY":
      return KITCHEN_STATUSES.READY;
    case "SERVED":
      return KITCHEN_STATUSES.SERVED;
    case "COMPLETED":
      return KITCHEN_STATUSES.COMPLETED;
    case "CANCELLED":
      return KITCHEN_STATUSES.CANCELLED;
    default:
      return KITCHEN_STATUSES.PENDING;
  }
}

export function mapDomainStatusToQueue(status: KitchenStatus): KitchenQueueStatus {
  switch (status) {
    case KITCHEN_STATUSES.PENDING:
      return "NEW";
    case KITCHEN_STATUSES.QUEUED:
    case KITCHEN_STATUSES.ACCEPTED:
      return "ACKNOWLEDGED";
    case KITCHEN_STATUSES.PREPARING:
    case KITCHEN_STATUSES.HELD:
    case KITCHEN_STATUSES.DELAYED:
      return "PREPARING";
    case KITCHEN_STATUSES.READY:
      return "READY";
    case KITCHEN_STATUSES.SERVED:
    case KITCHEN_STATUSES.COMPLETED:
      return "SERVED";
    default:
      return "NEW";
  }
}

export function mapDomainStatusToRestaurant(status: KitchenStatus): RestaurantOrderStatus | null {
  switch (status) {
    case KITCHEN_STATUSES.PENDING:
      return "PENDING";
    case KITCHEN_STATUSES.QUEUED:
    case KITCHEN_STATUSES.ACCEPTED:
      return "CONFIRMED";
    case KITCHEN_STATUSES.PREPARING:
    case KITCHEN_STATUSES.HELD:
    case KITCHEN_STATUSES.DELAYED:
      return "PREPARING";
    case KITCHEN_STATUSES.READY:
      return "READY";
    case KITCHEN_STATUSES.SERVED:
      return "SERVED";
    case KITCHEN_STATUSES.COMPLETED:
      return "COMPLETED";
    case KITCHEN_STATUSES.CANCELLED:
      return "CANCELLED";
    default:
      return null;
  }
}

function mapFulfilmentSource(
  fulfilmentType: string,
): KitchenOrder["source"] {
  switch (fulfilmentType) {
    case "DINE_IN":
      return "dine_in";
    case "TAKEAWAY":
      return "takeaway";
    case "DELIVERY":
      return "delivery";
    default:
      return "pos";
  }
}

function mapOrderTypeSource(orderType: string): KitchenOrder["source"] {
  switch (orderType) {
    case "DINE_IN":
      return "dine_in";
    case "TAKEAWAY":
      return "takeaway";
    case "DELIVERY":
      return "delivery";
    case "QR":
      return "online";
    default:
      return "pos";
  }
}

export function buildKitchenEntity(scope: KitchenTenantScope): Kitchen {
  const now = new Date().toISOString();
  return {
    id: scope.kitchenId,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    name: "Kitchen",
    slug: "kitchen",
    isActive: true,
    timezone: "UTC",
    createdAt: now,
    updatedAt: now,
  };
}

export function mapPrismaStationToDomain(
  station: PrismaKitchenStation,
  scope: KitchenTenantScope,
): KitchenStation {
  const meta = parseStationMeta(station.description);
  const stationType = meta.stationType ?? inferStationType(station.name);

  return {
    id: station.id,
    kitchenId: scope.kitchenId,
    tenantId: scope.tenantId,
    businessId: station.businessId,
    branchId: station.branchId,
    name: station.name,
    stationType,
    customLabel: meta.customLabel ?? null,
    displayOrder: station.displayOrder,
    isActive: station.status === "ACTIVE",
    maxConcurrentItems: meta.maxConcurrentItems ?? 4,
    avgPrepMinutes: meta.avgPrepMinutes ?? 10,
    createdAt: iso(station.createdAt),
    updatedAt: iso(station.updatedAt),
  };
}

export function mapStationStatusToPrisma(isActive: boolean): KitchenStationStatus {
  return isActive ? "ACTIVE" : "INACTIVE";
}

function estimateItemPrepMinutes(stationType: KitchenStationType): number {
  switch (stationType) {
    case KITCHEN_STATION_TYPES.GRILL:
      return 12;
    case KITCHEN_STATION_TYPES.FRYER:
      return 8;
    case KITCHEN_STATION_TYPES.PIZZA:
      return 15;
    case KITCHEN_STATION_TYPES.SALADS:
      return 5;
    case KITCHEN_STATION_TYPES.DESSERTS:
      return 7;
    case KITCHEN_STATION_TYPES.DRINKS:
    case KITCHEN_STATION_TYPES.BAR:
      return 3;
    default:
      return 10;
  }
}

function buildAiContext(
  kitchenOrderId: string,
  orderNumber: string,
  status: KitchenStatus,
  items: KitchenItem[],
  stations: KitchenStation[],
  meta: StoredKitchenMeta,
): KitchenAiContext {
  const totalPrep = items.reduce((sum, item) => sum + item.estimatedPrepMinutes, 0);
  const stationLoad = new Map<string, number>();

  for (const item of items) {
    stationLoad.set(item.stationId, (stationLoad.get(item.stationId) ?? 0) + item.quantity);
  }

  let bottleneckStationId: string | null = null;
  let maxLoad = 0;
  for (const [stationId, load] of stationLoad) {
    const station = stations.find((entry) => entry.id === stationId);
    const utilization = station ? load / station.maxConcurrentItems : load;
    if (utilization > maxLoad) {
      maxLoad = utilization;
      bottleneckStationId = stationId;
    }
  }

  const delayRiskScore = status === KITCHEN_STATUSES.DELAYED ? 0.85 : Math.min(maxLoad / 4, 0.9);
  const suggestedStationIds = stations
    .filter((station) => station.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((station) => station.id);

  return {
    kitchenOrderId,
    summary: `Order ${orderNumber} — ${items.length} item(s), status ${status}`,
    suggestedStationIds,
    estimatedCompletionAt:
      totalPrep > 0 ? new Date(Date.now() + totalPrep * 60_000).toISOString() : null,
    delayRiskScore,
    bottleneckStationId,
    insights: meta.delays?.length
      ? [`${meta.delays.length} delay event(s) recorded`]
      : ["Operating within expected prep window"],
    recommendedActions:
      delayRiskScore >= 0.7
        ? ["Re-route items to backup station", "Expedite high-priority tickets"]
        : ["Maintain current station assignments"],
    lastGeneratedAt: new Date().toISOString(),
  };
}

function buildAnalytics(
  kitchenOrderId: string,
  items: KitchenItem[],
  meta: StoredKitchenMeta,
  stations: KitchenStation[],
): KitchenAnalytics {
  const totalPrepMinutes = items.reduce((sum, item) => sum + item.estimatedPrepMinutes, 0);
  const stationUtilization: Record<string, number> = {};

  for (const station of stations) {
    const count = items.filter((item) => item.stationId === station.id).length;
    stationUtilization[station.id] =
      station.maxConcurrentItems > 0 ? count / station.maxConcurrentItems : count;
  }

  return {
    kitchenOrderId,
    avgItemPrepMinutes: items.length > 0 ? totalPrepMinutes / items.length : 0,
    totalPrepMinutes,
    targetPrepMinutes: totalPrepMinutes,
    onTimePercentage: (meta.delays?.length ?? 0) > 0 ? 75 : 95,
    delayCount: meta.delays?.length ?? 0,
    bumpCount: meta.bumpCount ?? 0,
    recallCount: meta.isRecalled ? 1 : 0,
    stationUtilization,
    bottleneckStationId: Object.entries(stationUtilization).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
  };
}

function buildQueueItems(
  queue: KitchenQueueWithOrder,
  ticketId: string,
  kitchenOrderId: string,
  status: KitchenStatus,
  stations: KitchenStation[],
  meta: StoredKitchenMeta,
): KitchenItem[] {
  const defaultStation = stations.find((station) => station.isActive) ?? stations[0];

  return queue.order.items.map((item) => {
    const stationId = meta.ticketStationIds?.[ticketId] ?? defaultStation?.id ?? "unassigned";
    const station = stations.find((entry) => entry.id === stationId);
    const stationType = station?.stationType ?? KITCHEN_STATION_TYPES.CUSTOM;

    return {
      id: item.id,
      ticketId,
      kitchenOrderId,
      menuItemId: item.menuItemId,
      menuItemName: item.nameSnapshot,
      quantity: item.quantity,
      status,
      stationId,
      stationType,
      modifiers: [],
      allergens: [],
      specialInstructions: item.notes,
      estimatedPrepMinutes: estimateItemPrepMinutes(stationType),
      startedAt: queue.preparingAt ? iso(queue.preparingAt) : null,
      completedAt: queue.readyAt ? iso(queue.readyAt) : null,
      createdAt: iso(queue.createdAt),
      updatedAt: iso(queue.updatedAt),
    };
  });
}

function buildRestaurantItems(
  order: RestaurantOrderWithKitchenRelations,
  ticketId: string,
  kitchenOrderId: string,
  status: KitchenStatus,
  stations: KitchenStation[],
  meta: StoredKitchenMeta,
): KitchenItem[] {
  const defaultStation = stations.find((station) => station.isActive) ?? stations[0];

  return order.items.map((item) => {
    const stationId = meta.ticketStationIds?.[ticketId] ?? defaultStation?.id ?? "unassigned";
    const station = stations.find((entry) => entry.id === stationId);
    const stationType = station?.stationType ?? KITCHEN_STATION_TYPES.CUSTOM;

    return {
      id: item.id,
      ticketId,
      kitchenOrderId,
      menuItemId: item.productId,
      menuItemName: item.productNameSnapshot,
      quantity: item.quantity,
      status,
      stationId,
      stationType,
      modifiers: item.modifiers.map((modifier) => modifier.nameSnapshot),
      allergens: [],
      specialInstructions: item.specialInstructions,
      estimatedPrepMinutes: estimateItemPrepMinutes(stationType),
      startedAt: item.preparingStartedAt ? iso(item.preparingStartedAt) : null,
      completedAt: item.readyAt ? iso(item.readyAt) : null,
      createdAt: iso(item.createdAt),
      updatedAt: iso(item.updatedAt),
    };
  });
}

export function mapQueueToRecord(
  queue: KitchenQueueWithOrder,
  scope: KitchenTenantScope,
  stations: KitchenStation[],
): KitchenRecord {
  const { guestNotes, meta } = splitKitchenNotes(queue.order.notes);
  const kitchenOrderId = queue.id;
  const ticketId = `ticket-${queue.id}`;
  const status = mapQueueStatusToDomain(queue.status, meta);
  const priority = mapQueuePriority(queue.priority);
  const items = buildQueueItems(queue, ticketId, kitchenOrderId, status, stations, meta);

  const order: KitchenOrder = {
    id: kitchenOrderId,
    kitchenId: scope.kitchenId,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    orderId: queue.orderId,
    orderNumber: queue.order.orderNumber,
    ticketId,
    status,
    priority,
    source: mapFulfilmentSource(queue.order.fulfilmentType),
    tableId: queue.order.table?.id ?? null,
    tableLabel: queue.order.table?.name ?? null,
    guestCount: null,
    serverName: null,
    promisedAt: null,
    queuedAt: iso(queue.queuedAt),
    acceptedAt: queue.acknowledgedAt ? iso(queue.acknowledgedAt) : null,
    readyAt: queue.readyAt ? iso(queue.readyAt) : null,
    servedAt: queue.servedAt ? iso(queue.servedAt) : null,
    isRecalled: meta.isRecalled ?? false,
    bumpCount: meta.bumpCount ?? 0,
    createdAt: iso(queue.createdAt),
    updatedAt: iso(queue.updatedAt),
  };

  const ticket: KitchenTicket = {
    id: ticketId,
    kitchenId: scope.kitchenId,
    kitchenOrderId,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    ticketNumber: queue.order.orderNumber,
    status,
    priority,
    stationId: meta.ticketStationIds?.[ticketId] ?? stations[0]?.id ?? null,
    itemIds: items.map((item) => item.id),
    noteCount: meta.notes?.length ?? 0,
    estimatedPrepMinutes: items.reduce((sum, item) => sum + item.estimatedPrepMinutes, 0),
    actualPrepMinutes: queue.readyAt && queue.preparingAt
      ? Math.max(1, Math.round((queue.readyAt.getTime() - queue.preparingAt.getTime()) / 60_000))
      : null,
    queuedAt: iso(queue.queuedAt),
    startedAt: queue.preparingAt ? iso(queue.preparingAt) : null,
    completedAt: queue.readyAt ? iso(queue.readyAt) : null,
    createdAt: iso(queue.createdAt),
    updatedAt: iso(queue.updatedAt),
  };

  const timeline = meta.timeline ?? [];
  if (timeline.length === 0) {
    timeline.push({
      id: createId("tl"),
      kitchenOrderId,
      ticketId,
      itemId: null,
      eventType: KITCHEN_TIMELINE_EVENT_TYPES.ORDER_RECEIVED,
      actorId: null,
      actorName: "System",
      message: guestNotes ? `Order received — ${guestNotes}` : "Order received in kitchen queue",
      metadata: { source: order.source },
      occurredAt: iso(queue.queuedAt),
    });
  }

  return {
    kitchen: buildKitchenEntity(scope),
    order,
    tickets: [ticket],
    items,
    timeline,
    assignments: meta.assignments ?? [],
    preparations: meta.preparations ?? [],
    completions: meta.completions ?? [],
    delays: meta.delays ?? [],
    notes: meta.notes ?? [],
    analytics: buildAnalytics(kitchenOrderId, items, meta, stations),
    aiContext: buildAiContext(kitchenOrderId, order.orderNumber, status, items, stations, meta),
  };
}

export function mapRestaurantOrderToRecord(
  order: RestaurantOrderWithKitchenRelations,
  scope: KitchenTenantScope,
  stations: KitchenStation[],
): KitchenRecord {
  const { meta } = splitKitchenNotes(order.notes);
  const kitchenOrderId = `${OMS_KITCHEN_ORDER_PREFIX}${order.id}`;
  const ticketId = `ticket-${order.id}`;
  const status = mapRestaurantStatusToDomain(order.status, meta);
  const priority = order.isPriority ? KITCHEN_PRIORITIES.HIGH : KITCHEN_PRIORITIES.NORMAL;
  const items = buildRestaurantItems(order, ticketId, kitchenOrderId, status, stations, meta);

  const kitchenOrder: KitchenOrder = {
    id: kitchenOrderId,
    kitchenId: scope.kitchenId,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    orderId: order.id,
    orderNumber: order.orderNumber,
    ticketId,
    status,
    priority,
    source: mapOrderTypeSource(order.orderType),
    tableId: order.restaurantTable?.id ?? null,
    tableLabel: order.restaurantTable?.tableName ?? order.restaurantTable?.tableNumber ?? null,
    guestCount: null,
    serverName: order.staff
      ? `${order.staff.firstName} ${order.staff.lastName}`.trim()
      : null,
    promisedAt: null,
    queuedAt: iso(order.placedAt),
    acceptedAt: order.kitchenAcceptedAt ? iso(order.kitchenAcceptedAt) : null,
    readyAt: order.kitchenReadyAt ? iso(order.kitchenReadyAt) : null,
    servedAt: order.kitchenServedAt ? iso(order.kitchenServedAt) : null,
    isRecalled: meta.isRecalled ?? false,
    bumpCount: meta.bumpCount ?? 0,
    createdAt: iso(order.createdAt),
    updatedAt: iso(order.updatedAt),
  };

  const ticket: KitchenTicket = {
    id: ticketId,
    kitchenId: scope.kitchenId,
    kitchenOrderId,
    tenantId: scope.tenantId,
    businessId: scope.businessId,
    branchId: scope.branchId,
    ticketNumber: order.orderNumber,
    status,
    priority,
    stationId: meta.ticketStationIds?.[ticketId] ?? stations[0]?.id ?? null,
    itemIds: items.map((item) => item.id),
    noteCount: meta.notes?.length ?? 0,
    estimatedPrepMinutes: items.reduce((sum, item) => sum + item.estimatedPrepMinutes, 0),
    actualPrepMinutes:
      order.kitchenReadyAt && order.kitchenPreparingAt
        ? Math.max(
            1,
            Math.round(
              (order.kitchenReadyAt.getTime() - order.kitchenPreparingAt.getTime()) / 60_000,
            ),
          )
        : null,
    queuedAt: iso(order.placedAt),
    startedAt: order.kitchenPreparingAt ? iso(order.kitchenPreparingAt) : null,
    completedAt: order.kitchenReadyAt ? iso(order.kitchenReadyAt) : null,
    createdAt: iso(order.createdAt),
    updatedAt: iso(order.updatedAt),
  };

  const timeline = meta.timeline ?? [];
  if (timeline.length === 0) {
    timeline.push({
      id: createId("tl"),
      kitchenOrderId,
      ticketId,
      itemId: null,
      eventType: KITCHEN_TIMELINE_EVENT_TYPES.ORDER_RECEIVED,
      actorId: null,
      actorName: "OMS",
      message: "Order received from order management system",
      metadata: { source: kitchenOrder.source },
      occurredAt: iso(order.placedAt),
    });
  }

  return {
    kitchen: buildKitchenEntity(scope),
    order: kitchenOrder,
    tickets: [ticket],
    items,
    timeline,
    assignments: meta.assignments ?? [],
    preparations: meta.preparations ?? [],
    completions: meta.completions ?? [],
    delays: meta.delays ?? [],
    notes: meta.notes ?? [],
    analytics: buildAnalytics(kitchenOrderId, items, meta, stations),
    aiContext: buildAiContext(
      kitchenOrderId,
      kitchenOrder.orderNumber,
      status,
      items,
      stations,
      meta,
    ),
  };
}

export function synthesizeScreens(
  scope: KitchenTenantScope,
  stations: KitchenStation[],
): KitchenScreen[] {
  const now = new Date().toISOString();
  return [
    {
      id: `${scope.kitchenId}-expedite`,
      kitchenId: scope.kitchenId,
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      name: "Expedite",
      mode: KITCHEN_SCREEN_MODES.EXPEDITE,
      stationIds: stations.map((station) => station.id),
      showCompletedOrders: false,
      autoBumpEnabled: true,
      refreshIntervalMs: 15_000,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    ...stations.map((station) => ({
      id: `${scope.kitchenId}-screen-${station.id}`,
      kitchenId: scope.kitchenId,
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      name: `${station.name} Screen`,
      mode: KITCHEN_SCREEN_MODES.STATION,
      stationIds: [station.id],
      showCompletedOrders: false,
      autoBumpEnabled: false,
      refreshIntervalMs: 15_000,
      isActive: station.isActive,
      createdAt: now,
      updatedAt: now,
    })),
  ];
}

export function synthesizeQueues(
  scope: KitchenTenantScope,
  stations: KitchenStation[],
  records: KitchenRecord[],
): DomainKitchenQueue[] {
  const now = new Date().toISOString();
  const mainTicketIds = records.flatMap((record) => record.tickets.map((ticket) => ticket.id));

  const queues: DomainKitchenQueue[] = [
    {
      id: `${scope.kitchenId}-queue-main`,
      kitchenId: scope.kitchenId,
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      stationId: null,
      name: "Main Queue",
      sortStrategy: KITCHEN_QUEUE_SORT_STRATEGIES.PRIORITY,
      ticketIds: mainTicketIds,
      maxVisibleTickets: 50,
      isActive: true,
      updatedAt: now,
    },
  ];

  for (const station of stations) {
    const ticketIds = records.flatMap((record) =>
      record.tickets
        .filter((ticket) => ticket.stationId === station.id)
        .map((ticket) => ticket.id),
    );

    queues.push({
      id: `${scope.kitchenId}-queue-${station.id}`,
      kitchenId: scope.kitchenId,
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      stationId: station.id,
      name: `${station.name} Queue`,
      sortStrategy: KITCHEN_QUEUE_SORT_STRATEGIES.FIFO,
      ticketIds,
      maxVisibleTickets: station.maxConcurrentItems * 3,
      isActive: station.isActive,
      updatedAt: now,
    });
  }

  return queues;
}

export function appendTimelineEvent(
  meta: StoredKitchenMeta,
  event: Omit<KitchenTimelineEvent, "id">,
): StoredKitchenMeta {
  const timeline = meta.timeline ?? [];
  return {
    ...meta,
    timeline: [...timeline, { ...event, id: createId("tl") }],
  };
}

export function appendKitchenNote(
  meta: StoredKitchenMeta,
  note: Omit<KitchenNote, "id" | "createdAt">,
): StoredKitchenMeta {
  const notes = meta.notes ?? [];
  return {
    ...meta,
    notes: [...notes, { ...note, id: createId("note"), createdAt: new Date().toISOString() }],
  };
}

export function isOmsKitchenOrderId(kitchenOrderId: string): boolean {
  return kitchenOrderId.startsWith(OMS_KITCHEN_ORDER_PREFIX);
}

export function extractRestaurantOrderId(kitchenOrderId: string): string {
  return kitchenOrderId.slice(OMS_KITCHEN_ORDER_PREFIX.length);
}

export function timelineTypeForAction(action: string): KitchenTimelineEventType {
  switch (action) {
    case "accept":
      return KITCHEN_TIMELINE_EVENT_TYPES.ORDER_ACCEPTED;
    case "fire":
    case "prepare":
      return KITCHEN_TIMELINE_EVENT_TYPES.PREPARATION_STARTED;
    case "ready":
      return KITCHEN_TIMELINE_EVENT_TYPES.ORDER_READY;
    case "bump":
    case "serve":
      return KITCHEN_TIMELINE_EVENT_TYPES.ORDER_BUMPED;
    case "recall":
      return KITCHEN_TIMELINE_EVENT_TYPES.ORDER_RECALLED;
    case "hold":
      return KITCHEN_TIMELINE_EVENT_TYPES.ORDER_DELAYED;
    case "cancel":
      return KITCHEN_TIMELINE_EVENT_TYPES.ORDER_CANCELLED;
    case "note":
      return KITCHEN_TIMELINE_EVENT_TYPES.NOTE_ADDED;
    default:
      return KITCHEN_TIMELINE_EVENT_TYPES.ORDER_RECEIVED;
  }
}
