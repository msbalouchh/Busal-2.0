import type {
  KitchenPriority,
  KitchenQueueSortStrategy,
  KitchenScreenMode,
  KitchenStationType,
  KitchenStatus,
  KitchenTimelineEventType,
} from "@/modules/kitchen/constants/kitchen-status";

/** Tenant-scoped kitchen (supports multi-kitchen per branch). */
export interface Kitchen {
  id: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  name: string;
  slug: string;
  isActive: boolean;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

/** Physical or logical prep station within a kitchen. */
export interface KitchenStation {
  id: string;
  kitchenId: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  name: string;
  stationType: KitchenStationType;
  customLabel: string | null;
  displayOrder: number;
  isActive: boolean;
  maxConcurrentItems: number;
  avgPrepMinutes: number;
  createdAt: string;
  updatedAt: string;
}

/** KDS display terminal configuration. */
export interface KitchenScreen {
  id: string;
  kitchenId: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  name: string;
  mode: KitchenScreenMode;
  stationIds: string[];
  showCompletedOrders: boolean;
  autoBumpEnabled: boolean;
  refreshIntervalMs: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Ordered queue of tickets for a kitchen or station. */
export interface KitchenQueue {
  id: string;
  kitchenId: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  stationId: string | null;
  name: string;
  sortStrategy: KitchenQueueSortStrategy;
  ticketIds: string[];
  maxVisibleTickets: number;
  isActive: boolean;
  updatedAt: string;
}

/** Kitchen-facing order aggregate header. */
export interface KitchenOrder {
  id: string;
  kitchenId: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  orderId: string;
  orderNumber: string;
  ticketId: string;
  status: KitchenStatus;
  priority: KitchenPriority;
  source: "dine_in" | "takeaway" | "delivery" | "pos" | "online";
  tableId: string | null;
  tableLabel: string | null;
  guestCount: number | null;
  serverName: string | null;
  promisedAt: string | null;
  queuedAt: string;
  acceptedAt: string | null;
  readyAt: string | null;
  servedAt: string | null;
  isRecalled: boolean;
  bumpCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Ticket grouping items routed to kitchen stations. */
export interface KitchenTicket {
  id: string;
  kitchenId: string;
  kitchenOrderId: string;
  tenantId: string;
  businessId: string;
  branchId: string;
  ticketNumber: string;
  status: KitchenStatus;
  priority: KitchenPriority;
  stationId: string | null;
  itemIds: string[];
  noteCount: number;
  estimatedPrepMinutes: number;
  actualPrepMinutes: number | null;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Individual menu item on a kitchen ticket. */
export interface KitchenItem {
  id: string;
  ticketId: string;
  kitchenOrderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  status: KitchenStatus;
  stationId: string;
  stationType: KitchenStationType;
  modifiers: string[];
  allergens: string[];
  specialInstructions: string | null;
  estimatedPrepMinutes: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Timeline audit event for kitchen operations. */
export interface KitchenTimelineEvent {
  id: string;
  kitchenOrderId: string;
  ticketId: string | null;
  itemId: string | null;
  eventType: KitchenTimelineEventType;
  actorId: string | null;
  actorName: string | null;
  message: string;
  metadata: Record<string, string | number | boolean | null>;
  occurredAt: string;
}

/** Station or staff assignment for a ticket or item. */
export interface KitchenAssignment {
  id: string;
  ticketId: string;
  itemId: string | null;
  stationId: string;
  assignedToUserId: string | null;
  assignedToName: string | null;
  assignedAt: string;
  releasedAt: string | null;
  isAutoAssigned: boolean;
}

/** Active preparation session for an item or ticket. */
export interface KitchenPreparation {
  id: string;
  ticketId: string;
  itemId: string | null;
  stationId: string;
  startedAt: string;
  estimatedEndAt: string;
  elapsedSeconds: number;
  isPaused: boolean;
  pausedAt: string | null;
}

/** Completion record when item or ticket is marked ready. */
export interface KitchenCompletion {
  id: string;
  ticketId: string;
  itemId: string | null;
  completedAt: string;
  completedByUserId: string | null;
  completedByName: string | null;
  actualPrepMinutes: number;
  targetPrepMinutes: number;
  wasOnTime: boolean;
}

/** Delay tracking for SLA and AI prediction. */
export interface KitchenDelay {
  id: string;
  kitchenOrderId: string;
  ticketId: string | null;
  reason: string;
  delayMinutes: number;
  detectedAt: string;
  resolvedAt: string | null;
  isResolved: boolean;
}

/** Staff note attached to order, ticket, or item. */
export interface KitchenNote {
  id: string;
  kitchenOrderId: string;
  ticketId: string | null;
  itemId: string | null;
  authorId: string;
  authorName: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

/** Performance metrics for kitchen operations. */
export interface KitchenAnalytics {
  kitchenOrderId: string;
  avgItemPrepMinutes: number;
  totalPrepMinutes: number;
  targetPrepMinutes: number;
  onTimePercentage: number;
  delayCount: number;
  bumpCount: number;
  recallCount: number;
  stationUtilization: Record<string, number>;
  bottleneckStationId: string | null;
}

/** AI-enriched context for kitchen intelligence. */
export interface KitchenAiContext {
  kitchenOrderId: string;
  summary: string;
  suggestedStationIds: string[];
  estimatedCompletionAt: string | null;
  delayRiskScore: number;
  bottleneckStationId: string | null;
  insights: string[];
  recommendedActions: string[];
  lastGeneratedAt: string;
}

/** Full kitchen order aggregate — single source of truth. */
export interface KitchenRecord {
  kitchen: Kitchen;
  order: KitchenOrder;
  tickets: KitchenTicket[];
  items: KitchenItem[];
  timeline: KitchenTimelineEvent[];
  assignments: KitchenAssignment[];
  preparations: KitchenPreparation[];
  completions: KitchenCompletion[];
  delays: KitchenDelay[];
  notes: KitchenNote[];
  analytics: KitchenAnalytics;
  aiContext: KitchenAiContext;
}

export interface KitchenSearchQuery {
  query?: string;
  tenantId?: string;
  businessId?: string;
  branchId?: string;
  kitchenId?: string;
  stationId?: string;
  status?: KitchenStatus;
  priority?: KitchenPriority;
  stationType?: KitchenStationType;
  isRecalled?: boolean;
  limit?: number;
}

export interface AcceptKitchenOrderInput {
  kitchenOrderId: string;
  acceptedBy?: string;
}

export interface BumpKitchenOrderInput {
  kitchenOrderId: string;
  bumpedBy?: string;
}

export interface RecallKitchenOrderInput {
  kitchenOrderId: string;
  reason?: string;
  recalledBy?: string;
}

export interface AssignStationInput {
  ticketId: string;
  stationId: string;
  assignedBy?: string;
  isAutoAssigned?: boolean;
}

export interface UpdateKitchenItemStatusInput {
  itemId: string;
  status: KitchenStatus;
  updatedBy?: string;
}

export interface AddKitchenNoteInput {
  kitchenOrderId: string;
  ticketId?: string;
  itemId?: string;
  body: string;
  authorId: string;
  authorName: string;
  isInternal?: boolean;
}

export interface KitchenPlatformContext {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
  kitchenId: string;
}

export interface KitchenContextValue {
  context: KitchenPlatformContext;
  records: KitchenRecord[];
  stations: KitchenStation[];
  screens: KitchenScreen[];
  queues: KitchenQueue[];
  selectedOrderId: string | null;
  selectedOrder: KitchenRecord | null;
  selectOrder: (orderId: string | null) => void;
  searchOrders: (query: KitchenSearchQuery) => KitchenRecord[];
  refresh: () => void;
}

export interface KitchenQueueContextValue {
  queue: KitchenQueue | null;
  queuedRecords: KitchenRecord[];
  sortStrategy: KitchenQueueSortStrategy;
  refresh: () => void;
}

export interface KitchenStationContextValue {
  station: KitchenStation | null;
  activeRecords: KitchenRecord[];
  refresh: () => void;
}
