import {
  KITCHEN_PRIORITIES,
  KITCHEN_STATUSES,
  KITCHEN_TIMELINE_EVENT_TYPES,
} from "@/modules/kitchen/constants/kitchen-status";
import {
  DEFAULT_KITCHEN_SCOPE,
  MOCK_KITCHEN_QUEUES,
  MOCK_KITCHEN_RECORDS,
  MOCK_KITCHEN_SCREENS,
  MOCK_KITCHEN_STATIONS,
} from "@/modules/kitchen/constants/mock-data";
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

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const PRIORITY_WEIGHT: Record<string, number> = {
  [KITCHEN_PRIORITIES.VIP]: 5,
  [KITCHEN_PRIORITIES.URGENT]: 4,
  [KITCHEN_PRIORITIES.HIGH]: 3,
  [KITCHEN_PRIORITIES.NORMAL]: 2,
  [KITCHEN_PRIORITIES.LOW]: 1,
};

/** In-memory kitchen repository (mock only, no backend). */
export class KitchenRepository {
  private records: KitchenRecord[] = structuredClone(MOCK_KITCHEN_RECORDS);
  private stations: KitchenStation[] = structuredClone(MOCK_KITCHEN_STATIONS);
  private screens: KitchenScreen[] = structuredClone(MOCK_KITCHEN_SCREENS);
  private queues: KitchenQueue[] = structuredClone(MOCK_KITCHEN_QUEUES);

  listRecords(): KitchenRecord[] {
    return structuredClone(this.records);
  }

  listStations(): KitchenStation[] {
    return structuredClone(this.stations);
  }

  listScreens(): KitchenScreen[] {
    return structuredClone(this.screens);
  }

  listQueues(): KitchenQueue[] {
    return structuredClone(this.queues);
  }

  findById(kitchenOrderId: string): KitchenRecord | undefined {
    return this.records.find((record) => record.order.id === kitchenOrderId);
  }

  findByStationId(stationId: string): KitchenRecord[] {
    return this.records.filter((record) =>
      record.tickets.some((ticket) => ticket.stationId === stationId),
    );
  }

  search(query: KitchenSearchQuery = {}): KitchenRecord[] {
    let results = this.listRecords();

    if (query.tenantId) {
      results = results.filter((r) => r.order.tenantId === query.tenantId);
    }

    if (query.businessId) {
      results = results.filter((r) => r.order.businessId === query.businessId);
    }

    if (query.branchId) {
      results = results.filter((r) => r.order.branchId === query.branchId);
    }

    if (query.kitchenId) {
      results = results.filter((r) => r.order.kitchenId === query.kitchenId);
    }

    if (query.stationId) {
      results = results.filter((r) =>
        r.tickets.some((ticket) => ticket.stationId === query.stationId),
      );
    }

    if (query.status) {
      results = results.filter((r) => r.order.status === query.status);
    }

    if (query.priority) {
      results = results.filter((r) => r.order.priority === query.priority);
    }

    if (query.stationType) {
      results = results.filter((r) =>
        r.items.some((item) => item.stationType === query.stationType),
      );
    }

    if (query.isRecalled !== undefined) {
      results = results.filter((r) => r.order.isRecalled === query.isRecalled);
    }

    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter(
        (r) =>
          r.order.orderNumber.toLowerCase().includes(term) ||
          r.items.some((item) => item.menuItemName.toLowerCase().includes(term)) ||
          (r.order.tableLabel?.toLowerCase().includes(term) ?? false),
      );
    }

    results = this.sortByPriority(results);

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  getQueueRecords(queueId: string): KitchenRecord[] {
    const queue = this.queues.find((q) => q.id === queueId);

    if (!queue) {
      return [];
    }

    const ticketSet = new Set(queue.ticketIds);
    const records = this.records.filter((record) =>
      record.tickets.some((ticket) => ticketSet.has(ticket.id)),
    );

    return this.sortQueueRecords(records, queue);
  }

  acceptOrder(input: AcceptKitchenOrderInput): KitchenRecord | null {
    const record = this.findById(input.kitchenOrderId);

    if (!record || record.order.status !== KITCHEN_STATUSES.QUEUED) {
      return null;
    }

    const now = new Date().toISOString();
    record.order.status = KITCHEN_STATUSES.ACCEPTED;
    record.order.acceptedAt = now;
    record.order.updatedAt = now;

    for (const ticket of record.tickets) {
      ticket.status = KITCHEN_STATUSES.ACCEPTED;
      ticket.updatedAt = now;
    }

    record.timeline.push({
      id: createId("tl"),
      kitchenOrderId: record.order.id,
      ticketId: record.tickets[0]?.id ?? null,
      itemId: null,
      eventType: KITCHEN_TIMELINE_EVENT_TYPES.ORDER_ACCEPTED,
      actorId: input.acceptedBy ?? DEFAULT_KITCHEN_SCOPE.userId,
      actorName: "Kitchen Staff",
      message: "Order accepted",
      metadata: {},
      occurredAt: now,
    });

    return structuredClone(record);
  }

  bumpOrder(input: BumpKitchenOrderInput): KitchenRecord | null {
    const record = this.findById(input.kitchenOrderId);

    if (!record || record.order.status !== KITCHEN_STATUSES.READY) {
      return null;
    }

    const now = new Date().toISOString();
    record.order.status = KITCHEN_STATUSES.SERVED;
    record.order.servedAt = now;
    record.order.bumpCount += 1;
    record.order.updatedAt = now;
    record.analytics.bumpCount += 1;

    record.timeline.push({
      id: createId("tl"),
      kitchenOrderId: record.order.id,
      ticketId: record.tickets[0]?.id ?? null,
      itemId: null,
      eventType: KITCHEN_TIMELINE_EVENT_TYPES.ORDER_BUMPED,
      actorId: input.bumpedBy ?? DEFAULT_KITCHEN_SCOPE.userId,
      actorName: "Expeditor",
      message: "Order bumped — served",
      metadata: { bumpCount: record.order.bumpCount },
      occurredAt: now,
    });

    return structuredClone(record);
  }

  recallOrder(input: RecallKitchenOrderInput): KitchenRecord | null {
    const record = this.findById(input.kitchenOrderId);

    if (!record) {
      return null;
    }

    const now = new Date().toISOString();
    record.order.isRecalled = true;
    record.order.status = KITCHEN_STATUSES.PREPARING;
    record.order.readyAt = null;
    record.order.updatedAt = now;
    record.analytics.recallCount += 1;

    for (const ticket of record.tickets) {
      ticket.status = KITCHEN_STATUSES.PREPARING;
      ticket.completedAt = null;
      ticket.updatedAt = now;
    }

    for (const item of record.items) {
      item.status = KITCHEN_STATUSES.PREPARING;
      item.completedAt = null;
      item.updatedAt = now;
    }

    record.timeline.push({
      id: createId("tl"),
      kitchenOrderId: record.order.id,
      ticketId: record.tickets[0]?.id ?? null,
      itemId: null,
      eventType: KITCHEN_TIMELINE_EVENT_TYPES.ORDER_RECALLED,
      actorId: input.recalledBy ?? DEFAULT_KITCHEN_SCOPE.userId,
      actorName: "Expeditor",
      message: input.reason ?? "Order recalled to kitchen",
      metadata: {},
      occurredAt: now,
    });

    return structuredClone(record);
  }

  assignStation(input: AssignStationInput): KitchenRecord | null {
    const record = this.records.find((r) =>
      r.tickets.some((ticket) => ticket.id === input.ticketId),
    );

    if (!record) {
      return null;
    }

    const now = new Date().toISOString();
    const ticket = record.tickets.find((t) => t.id === input.ticketId);

    if (!ticket) {
      return null;
    }

    ticket.stationId = input.stationId;
    ticket.updatedAt = now;

    for (const item of record.items.filter((i) => i.ticketId === input.ticketId)) {
      item.stationId = input.stationId;
      item.updatedAt = now;
    }

    record.assignments.push({
      id: createId("assign"),
      ticketId: input.ticketId,
      itemId: null,
      stationId: input.stationId,
      assignedToUserId: input.assignedBy ?? null,
      assignedToName: input.assignedBy ? "Kitchen Staff" : null,
      assignedAt: now,
      releasedAt: null,
      isAutoAssigned: input.isAutoAssigned ?? false,
    });

    record.timeline.push({
      id: createId("tl"),
      kitchenOrderId: record.order.id,
      ticketId: input.ticketId,
      itemId: null,
      eventType: KITCHEN_TIMELINE_EVENT_TYPES.STATION_ASSIGNED,
      actorId: input.assignedBy ?? null,
      actorName: input.isAutoAssigned ? "AI Router" : "Kitchen Manager",
      message: `Assigned to station ${input.stationId}`,
      metadata: { stationId: input.stationId },
      occurredAt: now,
    });

    return structuredClone(record);
  }

  updateItemStatus(input: UpdateKitchenItemStatusInput): KitchenRecord | null {
    const record = this.records.find((r) => r.items.some((item) => item.id === input.itemId));

    if (!record) {
      return null;
    }

    const now = new Date().toISOString();
    const item = record.items.find((i) => i.id === input.itemId);

    if (!item) {
      return null;
    }

    item.status = input.status;
    item.updatedAt = now;

    if (input.status === KITCHEN_STATUSES.PREPARING && !item.startedAt) {
      item.startedAt = now;
    }

    if (input.status === KITCHEN_STATUSES.READY) {
      item.completedAt = now;
    }

    this.syncOrderStatus(record);

    return structuredClone(record);
  }

  addNote(input: AddKitchenNoteInput): KitchenRecord | null {
    const record = this.findById(input.kitchenOrderId);

    if (!record) {
      return null;
    }

    const now = new Date().toISOString();
    const note = {
      id: createId("note"),
      kitchenOrderId: input.kitchenOrderId,
      ticketId: input.ticketId ?? null,
      itemId: input.itemId ?? null,
      authorId: input.authorId,
      authorName: input.authorName,
      body: input.body,
      isInternal: input.isInternal ?? true,
      createdAt: now,
    };

    record.notes.push(note);

    if (input.ticketId) {
      const ticket = record.tickets.find((t) => t.id === input.ticketId);
      if (ticket) {
        ticket.noteCount += 1;
      }
    }

    record.timeline.push({
      id: createId("tl"),
      kitchenOrderId: input.kitchenOrderId,
      ticketId: input.ticketId ?? null,
      itemId: input.itemId ?? null,
      eventType: KITCHEN_TIMELINE_EVENT_TYPES.NOTE_ADDED,
      actorId: input.authorId,
      actorName: input.authorName,
      message: input.body,
      metadata: {},
      occurredAt: now,
    });

    return structuredClone(record);
  }

  private syncOrderStatus(record: KitchenRecord): void {
    const itemStatuses = record.items.map((item) => item.status);

    if (itemStatuses.every((s) => s === KITCHEN_STATUSES.READY || s === KITCHEN_STATUSES.SERVED)) {
      record.order.status = KITCHEN_STATUSES.READY;
      record.order.readyAt = new Date().toISOString();
    } else if (itemStatuses.some((s) => s === KITCHEN_STATUSES.PREPARING)) {
      record.order.status = KITCHEN_STATUSES.PREPARING;
    } else if (itemStatuses.some((s) => s === KITCHEN_STATUSES.DELAYED)) {
      record.order.status = KITCHEN_STATUSES.DELAYED;
    }

    record.order.updatedAt = new Date().toISOString();
  }

  private sortByPriority(records: KitchenRecord[]): KitchenRecord[] {
    return [...records].sort(
      (a, b) => (PRIORITY_WEIGHT[b.order.priority] ?? 0) - (PRIORITY_WEIGHT[a.order.priority] ?? 0),
    );
  }

  private sortQueueRecords(records: KitchenRecord[], queue: KitchenQueue): KitchenRecord[] {
    if (queue.sortStrategy === "fifo") {
      return [...records].sort(
        (a, b) => new Date(a.order.queuedAt).getTime() - new Date(b.order.queuedAt).getTime(),
      );
    }

    return this.sortByPriority(records);
  }
}

export const kitchenRepository = new KitchenRepository();
