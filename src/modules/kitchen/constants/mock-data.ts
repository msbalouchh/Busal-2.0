import {
  KITCHEN_PRIORITIES,
  KITCHEN_QUEUE_SORT_STRATEGIES,
  KITCHEN_SCREEN_MODES,
  KITCHEN_STATION_TYPES,
  KITCHEN_STATUSES,
  KITCHEN_TIMELINE_EVENT_TYPES,
} from "@/modules/kitchen/constants/kitchen-status";
import type {
  Kitchen,
  KitchenItem,
  KitchenNote,
  KitchenOrder,
  KitchenQueue,
  KitchenRecord,
  KitchenScreen,
  KitchenStation,
  KitchenTicket,
} from "@/modules/kitchen/types/kitchen";

export const DEFAULT_KITCHEN_SCOPE = {
  tenantId: "tenant-harbour",
  workspaceId: "ws-harbour-kitchen",
  businessId: "biz-harbour-kitchen",
  branchId: "branch-harbour-main",
  userId: "user-harbour-owner",
  kitchenId: "kitchen-harbour-main",
} as const;

const NOW = "2026-02-15T18:30:00.000Z";

export const MOCK_KITCHEN: Kitchen = {
  id: DEFAULT_KITCHEN_SCOPE.kitchenId,
  tenantId: DEFAULT_KITCHEN_SCOPE.tenantId,
  workspaceId: DEFAULT_KITCHEN_SCOPE.workspaceId,
  businessId: DEFAULT_KITCHEN_SCOPE.businessId,
  branchId: DEFAULT_KITCHEN_SCOPE.branchId,
  name: "Main Kitchen",
  slug: "main-kitchen",
  isActive: true,
  timezone: "Europe/London",
  createdAt: NOW,
  updatedAt: NOW,
};

export const MOCK_KITCHEN_STATIONS: KitchenStation[] = [
  {
    id: "station-grill",
    kitchenId: DEFAULT_KITCHEN_SCOPE.kitchenId,
    tenantId: DEFAULT_KITCHEN_SCOPE.tenantId,
    businessId: DEFAULT_KITCHEN_SCOPE.businessId,
    branchId: DEFAULT_KITCHEN_SCOPE.branchId,
    name: "Grill",
    stationType: KITCHEN_STATION_TYPES.GRILL,
    customLabel: null,
    displayOrder: 1,
    isActive: true,
    maxConcurrentItems: 6,
    avgPrepMinutes: 12,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "station-fryer",
    kitchenId: DEFAULT_KITCHEN_SCOPE.kitchenId,
    tenantId: DEFAULT_KITCHEN_SCOPE.tenantId,
    businessId: DEFAULT_KITCHEN_SCOPE.businessId,
    branchId: DEFAULT_KITCHEN_SCOPE.branchId,
    name: "Fryer",
    stationType: KITCHEN_STATION_TYPES.FRYER,
    customLabel: null,
    displayOrder: 2,
    isActive: true,
    maxConcurrentItems: 4,
    avgPrepMinutes: 8,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "station-pizza",
    kitchenId: DEFAULT_KITCHEN_SCOPE.kitchenId,
    tenantId: DEFAULT_KITCHEN_SCOPE.tenantId,
    businessId: DEFAULT_KITCHEN_SCOPE.businessId,
    branchId: DEFAULT_KITCHEN_SCOPE.branchId,
    name: "Pizza",
    stationType: KITCHEN_STATION_TYPES.PIZZA,
    customLabel: null,
    displayOrder: 3,
    isActive: true,
    maxConcurrentItems: 5,
    avgPrepMinutes: 15,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "station-drinks",
    kitchenId: DEFAULT_KITCHEN_SCOPE.kitchenId,
    tenantId: DEFAULT_KITCHEN_SCOPE.tenantId,
    businessId: DEFAULT_KITCHEN_SCOPE.businessId,
    branchId: DEFAULT_KITCHEN_SCOPE.branchId,
    name: "Drinks",
    stationType: KITCHEN_STATION_TYPES.DRINKS,
    customLabel: null,
    displayOrder: 4,
    isActive: true,
    maxConcurrentItems: 8,
    avgPrepMinutes: 3,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "station-desserts",
    kitchenId: DEFAULT_KITCHEN_SCOPE.kitchenId,
    tenantId: DEFAULT_KITCHEN_SCOPE.tenantId,
    businessId: DEFAULT_KITCHEN_SCOPE.businessId,
    branchId: DEFAULT_KITCHEN_SCOPE.branchId,
    name: "Desserts",
    stationType: KITCHEN_STATION_TYPES.DESSERTS,
    customLabel: null,
    displayOrder: 5,
    isActive: true,
    maxConcurrentItems: 4,
    avgPrepMinutes: 6,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "station-salads",
    kitchenId: DEFAULT_KITCHEN_SCOPE.kitchenId,
    tenantId: DEFAULT_KITCHEN_SCOPE.tenantId,
    businessId: DEFAULT_KITCHEN_SCOPE.businessId,
    branchId: DEFAULT_KITCHEN_SCOPE.branchId,
    name: "Salads",
    stationType: KITCHEN_STATION_TYPES.SALADS,
    customLabel: null,
    displayOrder: 6,
    isActive: true,
    maxConcurrentItems: 5,
    avgPrepMinutes: 5,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "station-bar",
    kitchenId: DEFAULT_KITCHEN_SCOPE.kitchenId,
    tenantId: DEFAULT_KITCHEN_SCOPE.tenantId,
    businessId: DEFAULT_KITCHEN_SCOPE.businessId,
    branchId: DEFAULT_KITCHEN_SCOPE.branchId,
    name: "Bar",
    stationType: KITCHEN_STATION_TYPES.BAR,
    customLabel: null,
    displayOrder: 7,
    isActive: true,
    maxConcurrentItems: 6,
    avgPrepMinutes: 4,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "station-custom-pasta",
    kitchenId: DEFAULT_KITCHEN_SCOPE.kitchenId,
    tenantId: DEFAULT_KITCHEN_SCOPE.tenantId,
    businessId: DEFAULT_KITCHEN_SCOPE.businessId,
    branchId: DEFAULT_KITCHEN_SCOPE.branchId,
    name: "Pasta Station",
    stationType: KITCHEN_STATION_TYPES.CUSTOM,
    customLabel: "Fresh Pasta",
    displayOrder: 8,
    isActive: true,
    maxConcurrentItems: 3,
    avgPrepMinutes: 10,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const MOCK_KITCHEN_SCREENS: KitchenScreen[] = [
  {
    id: "screen-expedite",
    kitchenId: DEFAULT_KITCHEN_SCOPE.kitchenId,
    tenantId: DEFAULT_KITCHEN_SCOPE.tenantId,
    businessId: DEFAULT_KITCHEN_SCOPE.businessId,
    branchId: DEFAULT_KITCHEN_SCOPE.branchId,
    name: "Expedite Screen",
    mode: KITCHEN_SCREEN_MODES.EXPEDITE,
    stationIds: [],
    showCompletedOrders: true,
    autoBumpEnabled: false,
    refreshIntervalMs: 5000,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "screen-grill",
    kitchenId: DEFAULT_KITCHEN_SCOPE.kitchenId,
    tenantId: DEFAULT_KITCHEN_SCOPE.tenantId,
    businessId: DEFAULT_KITCHEN_SCOPE.businessId,
    branchId: DEFAULT_KITCHEN_SCOPE.branchId,
    name: "Grill Station Screen",
    mode: KITCHEN_SCREEN_MODES.STATION,
    stationIds: ["station-grill"],
    showCompletedOrders: false,
    autoBumpEnabled: true,
    refreshIntervalMs: 3000,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const MOCK_KITCHEN_QUEUES: KitchenQueue[] = [
  {
    id: "queue-main",
    kitchenId: DEFAULT_KITCHEN_SCOPE.kitchenId,
    tenantId: DEFAULT_KITCHEN_SCOPE.tenantId,
    businessId: DEFAULT_KITCHEN_SCOPE.businessId,
    branchId: DEFAULT_KITCHEN_SCOPE.branchId,
    stationId: null,
    name: "Main Queue",
    sortStrategy: KITCHEN_QUEUE_SORT_STRATEGIES.PRIORITY,
    ticketIds: ["ticket-ko-001", "ticket-ko-002", "ticket-ko-003"],
    maxVisibleTickets: 20,
    isActive: true,
    updatedAt: NOW,
  },
  {
    id: "queue-grill",
    kitchenId: DEFAULT_KITCHEN_SCOPE.kitchenId,
    tenantId: DEFAULT_KITCHEN_SCOPE.tenantId,
    businessId: DEFAULT_KITCHEN_SCOPE.businessId,
    branchId: DEFAULT_KITCHEN_SCOPE.branchId,
    stationId: "station-grill",
    name: "Grill Queue",
    sortStrategy: KITCHEN_QUEUE_SORT_STRATEGIES.FIFO,
    ticketIds: ["ticket-ko-001"],
    maxVisibleTickets: 10,
    isActive: true,
    updatedAt: NOW,
  },
];

function buildOrder(partial: {
  id: string;
  orderNumber: string;
  ticketId: string;
  status: (typeof KITCHEN_STATUSES)[keyof typeof KITCHEN_STATUSES];
  priority: (typeof KITCHEN_PRIORITIES)[keyof typeof KITCHEN_PRIORITIES];
  tableLabel?: string;
  guestCount?: number;
  isRecalled?: boolean;
  bumpCount?: number;
}): KitchenOrder {
  const queuedAt = "2026-02-15T18:10:00.000Z";

  return {
    id: partial.id,
    kitchenId: DEFAULT_KITCHEN_SCOPE.kitchenId,
    tenantId: DEFAULT_KITCHEN_SCOPE.tenantId,
    workspaceId: DEFAULT_KITCHEN_SCOPE.workspaceId,
    businessId: DEFAULT_KITCHEN_SCOPE.businessId,
    branchId: DEFAULT_KITCHEN_SCOPE.branchId,
    orderId: `order-${partial.id}`,
    orderNumber: partial.orderNumber,
    ticketId: partial.ticketId,
    status: partial.status,
    priority: partial.priority,
    source: "dine_in",
    tableId: partial.tableLabel ? "table-12" : null,
    tableLabel: partial.tableLabel ?? null,
    guestCount: partial.guestCount ?? null,
    serverName: "Alex",
    promisedAt: "2026-02-15T18:25:00.000Z",
    queuedAt,
    acceptedAt: partial.status !== KITCHEN_STATUSES.QUEUED ? "2026-02-15T18:11:00.000Z" : null,
    readyAt: partial.status === KITCHEN_STATUSES.READY ? "2026-02-15T18:28:00.000Z" : null,
    servedAt: null,
    isRecalled: partial.isRecalled ?? false,
    bumpCount: partial.bumpCount ?? 0,
    createdAt: queuedAt,
    updatedAt: NOW,
  };
}

function buildTicket(partial: {
  id: string;
  kitchenOrderId: string;
  ticketNumber: string;
  status: (typeof KITCHEN_STATUSES)[keyof typeof KITCHEN_STATUSES];
  priority: (typeof KITCHEN_PRIORITIES)[keyof typeof KITCHEN_PRIORITIES];
  stationId: string;
  itemIds: string[];
}): KitchenTicket {
  return {
    id: partial.id,
    kitchenId: DEFAULT_KITCHEN_SCOPE.kitchenId,
    kitchenOrderId: partial.kitchenOrderId,
    tenantId: DEFAULT_KITCHEN_SCOPE.tenantId,
    businessId: DEFAULT_KITCHEN_SCOPE.businessId,
    branchId: DEFAULT_KITCHEN_SCOPE.branchId,
    ticketNumber: partial.ticketNumber,
    status: partial.status,
    priority: partial.priority,
    stationId: partial.stationId,
    itemIds: partial.itemIds,
    noteCount: 0,
    estimatedPrepMinutes: 12,
    actualPrepMinutes: partial.status === KITCHEN_STATUSES.READY ? 11 : null,
    queuedAt: "2026-02-15T18:10:00.000Z",
    startedAt: partial.status !== KITCHEN_STATUSES.QUEUED ? "2026-02-15T18:12:00.000Z" : null,
    completedAt: partial.status === KITCHEN_STATUSES.READY ? "2026-02-15T18:28:00.000Z" : null,
    createdAt: "2026-02-15T18:10:00.000Z",
    updatedAt: NOW,
  };
}

function buildItem(partial: {
  id: string;
  ticketId: string;
  kitchenOrderId: string;
  name: string;
  stationId: string;
  stationType: (typeof KITCHEN_STATION_TYPES)[keyof typeof KITCHEN_STATION_TYPES];
  status: (typeof KITCHEN_STATUSES)[keyof typeof KITCHEN_STATUSES];
  modifiers?: string[];
}): KitchenItem {
  return {
    id: partial.id,
    ticketId: partial.ticketId,
    kitchenOrderId: partial.kitchenOrderId,
    menuItemId: `menu-${partial.id}`,
    menuItemName: partial.name,
    quantity: 1,
    status: partial.status,
    stationId: partial.stationId,
    stationType: partial.stationType,
    modifiers: partial.modifiers ?? [],
    allergens: [],
    specialInstructions: null,
    estimatedPrepMinutes: 10,
    startedAt: partial.status !== KITCHEN_STATUSES.QUEUED ? "2026-02-15T18:12:00.000Z" : null,
    completedAt: partial.status === KITCHEN_STATUSES.READY ? "2026-02-15T18:27:00.000Z" : null,
    createdAt: "2026-02-15T18:10:00.000Z",
    updatedAt: NOW,
  };
}

function buildRecord(partial: {
  orderId: string;
  orderNumber: string;
  ticketId: string;
  ticketNumber: string;
  status: (typeof KITCHEN_STATUSES)[keyof typeof KITCHEN_STATUSES];
  priority: (typeof KITCHEN_PRIORITIES)[keyof typeof KITCHEN_PRIORITIES];
  stationId: string;
  stationType: (typeof KITCHEN_STATION_TYPES)[keyof typeof KITCHEN_STATION_TYPES];
  itemName: string;
  tableLabel?: string;
  isRecalled?: boolean;
  delayMinutes?: number;
}): KitchenRecord {
  const itemId = `item-${partial.orderId}`;

  const order = buildOrder({
    id: partial.orderId,
    orderNumber: partial.orderNumber,
    ticketId: partial.ticketId,
    status: partial.status,
    priority: partial.priority,
    tableLabel: partial.tableLabel,
    isRecalled: partial.isRecalled,
  });

  const ticket = buildTicket({
    id: partial.ticketId,
    kitchenOrderId: partial.orderId,
    ticketNumber: partial.ticketNumber,
    status: partial.status,
    priority: partial.priority,
    stationId: partial.stationId,
    itemIds: [itemId],
  });

  const item = buildItem({
    id: itemId,
    ticketId: partial.ticketId,
    kitchenOrderId: partial.orderId,
    name: partial.itemName,
    stationId: partial.stationId,
    stationType: partial.stationType,
    status: partial.status,
  });

  const notes: KitchenNote[] = partial.isRecalled
    ? [
        {
          id: `note-${partial.orderId}`,
          kitchenOrderId: partial.orderId,
          ticketId: partial.ticketId,
          itemId: null,
          authorId: DEFAULT_KITCHEN_SCOPE.userId,
          authorName: "Head Chef",
          body: "Recalled — missing garnish",
          isInternal: true,
          createdAt: NOW,
        },
      ]
    : [];

  const delayCount = partial.delayMinutes ? 1 : 0;

  return {
    kitchen: MOCK_KITCHEN,
    order,
    tickets: [ticket],
    items: [item],
    timeline: [
      {
        id: `tl-${partial.orderId}-received`,
        kitchenOrderId: partial.orderId,
        ticketId: partial.ticketId,
        itemId: null,
        eventType: KITCHEN_TIMELINE_EVENT_TYPES.ORDER_RECEIVED,
        actorId: null,
        actorName: "POS",
        message: `Order ${partial.orderNumber} received`,
        metadata: { source: "pos" },
        occurredAt: "2026-02-15T18:10:00.000Z",
      },
      ...(partial.status !== KITCHEN_STATUSES.QUEUED
        ? [
            {
              id: `tl-${partial.orderId}-accepted`,
              kitchenOrderId: partial.orderId,
              ticketId: partial.ticketId,
              itemId: null,
              eventType: KITCHEN_TIMELINE_EVENT_TYPES.ORDER_ACCEPTED,
              actorId: DEFAULT_KITCHEN_SCOPE.userId,
              actorName: "Line Cook",
              message: "Order accepted",
              metadata: {},
              occurredAt: "2026-02-15T18:11:00.000Z",
            },
          ]
        : []),
    ],
    assignments: [
      {
        id: `assign-${partial.orderId}`,
        ticketId: partial.ticketId,
        itemId: itemId,
        stationId: partial.stationId,
        assignedToUserId: null,
        assignedToName: "Line Cook",
        assignedAt: "2026-02-15T18:11:30.000Z",
        releasedAt: null,
        isAutoAssigned: true,
      },
    ],
    preparations:
      partial.status === KITCHEN_STATUSES.PREPARING
        ? [
            {
              id: `prep-${partial.orderId}`,
              ticketId: partial.ticketId,
              itemId: itemId,
              stationId: partial.stationId,
              startedAt: "2026-02-15T18:12:00.000Z",
              estimatedEndAt: "2026-02-15T18:22:00.000Z",
              elapsedSeconds: 480,
              isPaused: false,
              pausedAt: null,
            },
          ]
        : [],
    completions:
      partial.status === KITCHEN_STATUSES.READY
        ? [
            {
              id: `complete-${partial.orderId}`,
              ticketId: partial.ticketId,
              itemId: itemId,
              completedAt: "2026-02-15T18:28:00.000Z",
              completedByUserId: DEFAULT_KITCHEN_SCOPE.userId,
              completedByName: "Line Cook",
              actualPrepMinutes: 11,
              targetPrepMinutes: 12,
              wasOnTime: true,
            },
          ]
        : [],
    delays: partial.delayMinutes
      ? [
          {
            id: `delay-${partial.orderId}`,
            kitchenOrderId: partial.orderId,
            ticketId: partial.ticketId,
            reason: "Station backlog",
            delayMinutes: partial.delayMinutes,
            detectedAt: "2026-02-15T18:20:00.000Z",
            resolvedAt: null,
            isResolved: false,
          },
        ]
      : [],
    notes,
    analytics: {
      kitchenOrderId: partial.orderId,
      avgItemPrepMinutes: 10,
      totalPrepMinutes: partial.status === KITCHEN_STATUSES.READY ? 11 : 0,
      targetPrepMinutes: 12,
      onTimePercentage: partial.status === KITCHEN_STATUSES.READY ? 100 : 0,
      delayCount,
      bumpCount: 0,
      recallCount: partial.isRecalled ? 1 : 0,
      stationUtilization: { [partial.stationId]: 0.75 },
      bottleneckStationId: partial.delayMinutes ? partial.stationId : null,
    },
    aiContext: {
      kitchenOrderId: partial.orderId,
      summary: `${partial.orderNumber} — ${partial.itemName} at ${partial.tableLabel ?? "counter"}`,
      suggestedStationIds: [partial.stationId],
      estimatedCompletionAt: "2026-02-15T18:25:00.000Z",
      delayRiskScore: partial.delayMinutes ? 0.72 : 0.15,
      bottleneckStationId: partial.delayMinutes ? partial.stationId : null,
      insights: partial.delayMinutes ? ["Grill station running 8 min behind"] : [],
      recommendedActions: partial.delayMinutes ? ["Re-route salads to backup station"] : [],
      lastGeneratedAt: NOW,
    },
  };
}

export const MOCK_KITCHEN_RECORDS: KitchenRecord[] = [
  buildRecord({
    orderId: "ko-001",
    orderNumber: "1042",
    ticketId: "ticket-ko-001",
    ticketNumber: "T-1042-A",
    status: KITCHEN_STATUSES.PREPARING,
    priority: KITCHEN_PRIORITIES.HIGH,
    stationId: "station-grill",
    stationType: KITCHEN_STATION_TYPES.GRILL,
    itemName: "Ribeye Steak",
    tableLabel: "Table 12",
  }),
  buildRecord({
    orderId: "ko-002",
    orderNumber: "1043",
    ticketId: "ticket-ko-002",
    ticketNumber: "T-1043-A",
    status: KITCHEN_STATUSES.QUEUED,
    priority: KITCHEN_PRIORITIES.NORMAL,
    stationId: "station-pizza",
    stationType: KITCHEN_STATION_TYPES.PIZZA,
    itemName: "Margherita Pizza",
    tableLabel: "Table 7",
  }),
  buildRecord({
    orderId: "ko-003",
    orderNumber: "1044",
    ticketId: "ticket-ko-003",
    ticketNumber: "T-1044-A",
    status: KITCHEN_STATUSES.DELAYED,
    priority: KITCHEN_PRIORITIES.VIP,
    stationId: "station-grill",
    stationType: KITCHEN_STATION_TYPES.GRILL,
    itemName: "Surf & Turf",
    tableLabel: "Table 3",
    delayMinutes: 8,
  }),
  buildRecord({
    orderId: "ko-004",
    orderNumber: "1045",
    ticketId: "ticket-ko-004",
    ticketNumber: "T-1045-A",
    status: KITCHEN_STATUSES.READY,
    priority: KITCHEN_PRIORITIES.NORMAL,
    stationId: "station-salads",
    stationType: KITCHEN_STATION_TYPES.SALADS,
    itemName: "Caesar Salad",
    tableLabel: "Table 15",
  }),
  buildRecord({
    orderId: "ko-005",
    orderNumber: "1046",
    ticketId: "ticket-ko-005",
    ticketNumber: "T-1046-A",
    status: KITCHEN_STATUSES.ACCEPTED,
    priority: KITCHEN_PRIORITIES.URGENT,
    stationId: "station-fryer",
    stationType: KITCHEN_STATION_TYPES.FRYER,
    itemName: "Truffle Fries",
    tableLabel: "Bar 2",
    isRecalled: true,
  }),
];
