import {
  TABLE_KINDS,
  TABLE_RESERVATION_STATES,
  TABLE_STATUSES,
  TABLE_TIMELINE_EVENT_TYPES,
} from "@/modules/table-management/constants/table-status";
import {
  DEFAULT_TABLE_SCOPE,
  MOCK_FLOOR_RECORDS,
} from "@/modules/table-management/constants/mock-data";
import type {
  AssignTableInput,
  CreateTableInput,
  FloorRecord,
  MergeTablesInput,
  SplitTableInput,
  TableRecord,
  TableSearchQuery,
  TransferTableInput,
  UpdateTableInput,
} from "@/modules/table-management/types/table-management";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** In-memory table repository (mock only, no backend). */
export class TableManagementRepository {
  private floors: FloorRecord[] = structuredClone(MOCK_FLOOR_RECORDS);

  listFloors(): FloorRecord[] {
    return structuredClone(this.floors);
  }

  findFloorById(floorId: string): FloorRecord | undefined {
    return this.floors.find((record) => record.floor.id === floorId);
  }

  listTables(): TableRecord[] {
    return this.floors.flatMap((floor) => floor.tables);
  }

  findTableById(tableId: string): TableRecord | undefined {
    for (const floor of this.floors) {
      const table = floor.tables.find((record) => record.table.id === tableId);
      if (table) return table;
    }
    return undefined;
  }

  searchTables(query: TableSearchQuery = {}): TableRecord[] {
    let results = this.listTables();

    if (query.tenantId) {
      results = results.filter((record) => {
        const floor = this.floors.find((f) => f.floor.id === record.table.floorId);
        return floor?.floor.tenantId === query.tenantId;
      });
    }

    if (query.businessId) {
      results = results.filter((record) => {
        const floor = this.floors.find((f) => f.floor.id === record.table.floorId);
        return floor?.floor.businessId === query.businessId;
      });
    }

    if (query.branchId) {
      results = results.filter((record) => record.table.branchId === query.branchId);
    }

    if (query.floorId) {
      results = results.filter((record) => record.table.floorId === query.floorId);
    }

    if (query.zoneId) {
      results = results.filter((record) => record.table.zoneId === query.zoneId);
    }

    if (query.status) {
      results = results.filter((record) => record.table.status === query.status);
    }

    if (query.kind) {
      results = results.filter((record) => record.table.kind === query.kind);
    }

    if (query.minCapacity) {
      results = results.filter((record) => record.table.seatCapacity >= query.minCapacity!);
    }

    if (query.query) {
      const normalized = query.query.toLowerCase();
      results = results.filter((record) => {
        const haystack = [
          record.table.label,
          record.table.id,
          record.reservationState.guestName ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalized);
      });
    }

    const limit = query.limit ?? results.length;
    return structuredClone(results.slice(0, limit));
  }

  createTable(input: CreateTableInput): TableRecord {
    const floor = this.findFloorById(input.floorId);
    if (!floor) {
      throw new Error(`Floor not found: ${input.floorId}`);
    }

    const id = createId("tbl");
    const now = new Date().toISOString();
    const number = floor.tables.length + 1;

    const record: TableRecord = {
      table: {
        id,
        floorId: input.floorId,
        zoneId: input.zoneId,
        branchId: floor.floor.branchId,
        label: input.label,
        number,
        kind: TABLE_KINDS.SINGLE,
        status: TABLE_STATUSES.AVAILABLE,
        seatCapacity: input.seatCapacity,
        minCapacity: input.minCapacity ?? 1,
        position: input.position ?? { x: 100, y: 100, rotation: 0 },
        size: input.size ?? { width: 80, height: 80 },
        isVip: input.isVip ?? false,
        isOutdoor: input.isOutdoor ?? false,
        isPrivateRoom: input.isPrivateRoom ?? false,
        mergedIntoTableId: null,
        splitFromTableId: null,
        groupId: null,
        dragDropReady: true,
        createdAt: now,
        updatedAt: now,
      },
      seats: Array.from({ length: input.seatCapacity }, (_, index) => ({
        id: `${id}-seat-${index + 1}`,
        tableId: id,
        seatNumber: index + 1,
        label: `Seat ${index + 1}`,
        isOccupied: false,
        guestId: null,
      })),
      reservationState: {
        tableId: id,
        reservationId: null,
        state: TABLE_RESERVATION_STATES.NONE,
        partySize: 0,
        guestName: null,
        reservedAt: null,
        expectedArrivalAt: null,
        seatedAt: null,
      },
      availability: {
        tableId: id,
        isAvailable: true,
        availableAt: null,
        blockedReason: null,
        nextReservationAt: null,
        occupancyPercent: 0,
      },
      qrCode: {
        tableId: id,
        token: `qr-${id}`,
        url: `https://order.getbusal.com/t/${id}`,
        isActive: true,
        lastScannedAt: null,
      },
      analytics: {
        tableId: id,
        turnoverRate: 0,
        avgOccupancyMinutes: 0,
        revenueTodayPence: 0,
        utilizationScore: 0,
        waitTimeMinutes: 0,
      },
      aiContext: {
        tableId: id,
        summary: `${input.label} · ${input.seatCapacity} seats · available`,
        insights: ["New table — no historical data yet"],
        recommendedActions: ["Assign QR code and verify floor plan position"],
        waitTimePredictionMinutes: null,
        seatingScore: 0.5,
        lastGeneratedAt: now,
      },
      timeline: [
        {
          id: `${id}-tl-create`,
          tableId: id,
          type: TABLE_TIMELINE_EVENT_TYPES.STATUS_CHANGED,
          timestamp: now,
          actorId: DEFAULT_TABLE_SCOPE.userId,
          payload: { status: TABLE_STATUSES.AVAILABLE, action: "created" },
        },
      ],
    };

    floor.tables.push(record);
    return structuredClone(record);
  }

  updateTable(input: UpdateTableInput): TableRecord | undefined {
    const record = this.findTableById(input.tableId);
    if (!record) return undefined;

    if (input.label !== undefined) record.table.label = input.label;
    if (input.status !== undefined) record.table.status = input.status;
    if (input.seatCapacity !== undefined) record.table.seatCapacity = input.seatCapacity;
    if (input.position !== undefined) record.table.position = input.position;
    if (input.zoneId !== undefined) record.table.zoneId = input.zoneId;
    record.table.updatedAt = new Date().toISOString();

    return structuredClone(record);
  }

  mergeTables(input: MergeTablesInput): TableRecord | undefined {
    const floor = this.findFloorById(input.floorId);
    if (!floor || input.sourceTableIds.length < 2) return undefined;

    const sources = input.sourceTableIds
      .map((id) => floor.tables.find((t) => t.table.id === id))
      .filter(Boolean) as TableRecord[];

    if (sources.length !== input.sourceTableIds.length) return undefined;

    const targetId = createId("tbl-merged");
    const now = new Date().toISOString();
    const totalCapacity = sources.reduce((sum, s) => sum + s.table.seatCapacity, 0);
    const anchor = sources[0]!;

    const merged: TableRecord = {
      ...structuredClone(anchor),
      table: {
        ...anchor.table,
        id: targetId,
        label: input.mergedLabel,
        kind: TABLE_KINDS.MERGED,
        status: TABLE_STATUSES.AVAILABLE,
        seatCapacity: totalCapacity,
        mergedIntoTableId: null,
        groupId: createId("grp"),
        updatedAt: now,
      },
      seats: sources.flatMap((s) =>
        s.seats.map((seat, index) => ({
          ...seat,
          id: `${targetId}-seat-${index + 1}`,
          tableId: targetId,
        })),
      ),
      timeline: [
        ...anchor.timeline,
        {
          id: `${targetId}-tl-merge`,
          tableId: targetId,
          type: TABLE_TIMELINE_EVENT_TYPES.MERGED,
          timestamp: now,
          actorId: input.actorId ?? DEFAULT_TABLE_SCOPE.userId,
          payload: { sourceTableIds: input.sourceTableIds },
        },
      ],
    };

    for (const sourceId of input.sourceTableIds) {
      const index = floor.tables.findIndex((t) => t.table.id === sourceId);
      if (index >= 0) floor.tables.splice(index, 1);
    }

    floor.tables.push(merged);
    floor.groups.push({
      id: merged.table.groupId!,
      floorId: input.floorId,
      label: input.mergedLabel,
      tableIds: input.sourceTableIds,
      seatCapacity: totalCapacity,
      status: TABLE_STATUSES.AVAILABLE,
      createdAt: now,
    });

    return structuredClone(merged);
  }

  splitTable(input: SplitTableInput): TableRecord[] | undefined {
    const floor = this.findFloorById(input.floorId);
    if (!floor) return undefined;

    const sourceIndex = floor.tables.findIndex((t) => t.table.id === input.sourceTableId);
    if (sourceIndex < 0) return undefined;

    const source = floor.tables[sourceIndex]!;
    const now = new Date().toISOString();
    const capacityEach = Math.max(
      1,
      Math.floor(source.table.seatCapacity / input.newLabels.length),
    );

    const created = input.newLabels.map((label, index) => {
      const id = createId("tbl-split");
      return {
        ...structuredClone(source),
        table: {
          ...source.table,
          id,
          label,
          number: floor.tables.length + index + 1,
          kind: TABLE_KINDS.SPLIT,
          status: TABLE_STATUSES.AVAILABLE,
          seatCapacity: capacityEach,
          splitFromTableId: input.sourceTableId,
          groupId: null,
          updatedAt: now,
        },
        seats: buildSeats(id, capacityEach),
        timeline: [
          {
            id: `${id}-tl-split`,
            tableId: id,
            type: TABLE_TIMELINE_EVENT_TYPES.SPLIT,
            timestamp: now,
            actorId: input.actorId ?? DEFAULT_TABLE_SCOPE.userId,
            payload: { sourceTableId: input.sourceTableId },
          },
        ],
      } satisfies TableRecord;
    });

    floor.tables.splice(sourceIndex, 1, ...created);
    return structuredClone(created);
  }

  assignTable(input: AssignTableInput): TableRecord | undefined {
    const record = this.findTableById(input.tableId);
    if (!record) return undefined;

    const now = new Date().toISOString();
    record.table.status = TABLE_STATUSES.OCCUPIED;
    record.reservationState = {
      ...record.reservationState,
      reservationId: input.reservationId ?? record.reservationState.reservationId,
      state: TABLE_RESERVATION_STATES.SEATED,
      partySize: input.partySize,
      guestName: input.guestName ?? record.reservationState.guestName,
      seatedAt: now,
    };
    record.availability.isAvailable = false;
    record.availability.occupancyPercent = Math.round(
      (input.partySize / record.table.seatCapacity) * 100,
    );
    record.timeline.push({
      id: `${input.tableId}-tl-assign-${now}`,
      tableId: input.tableId,
      type: TABLE_TIMELINE_EVENT_TYPES.ASSIGNED,
      timestamp: now,
      actorId: input.actorId ?? DEFAULT_TABLE_SCOPE.userId,
      payload: { partySize: input.partySize },
    });

    return structuredClone(record);
  }

  transferTable(input: TransferTableInput): TableRecord | undefined {
    const from = this.findTableById(input.fromTableId);
    const to = this.findTableById(input.toTableId);
    if (!from || !to) return undefined;

    const now = new Date().toISOString();
    from.table.status = TABLE_STATUSES.CLEANING;
    from.availability.isAvailable = false;
    from.availability.availableAt = now;
    from.reservationState.state = TABLE_RESERVATION_STATES.NONE;

    to.table.status = TABLE_STATUSES.OCCUPIED;
    to.reservationState = {
      ...to.reservationState,
      state: TABLE_RESERVATION_STATES.SEATED,
      partySize: input.partySize,
      seatedAt: now,
    };
    to.availability.isAvailable = false;
    to.timeline.push({
      id: `${input.toTableId}-tl-transfer-${now}`,
      tableId: input.toTableId,
      type: TABLE_TIMELINE_EVENT_TYPES.TRANSFERRED,
      timestamp: now,
      actorId: input.actorId ?? DEFAULT_TABLE_SCOPE.userId,
      payload: { fromTableId: input.fromTableId, orderId: input.orderId ?? null },
    });

    return structuredClone(to);
  }

  getAvailableTables(partySize: number, floorId?: string): TableRecord[] {
    return this.searchTables({
      floorId,
      minCapacity: partySize,
      status: TABLE_STATUSES.AVAILABLE,
    }).filter((record) => record.availability.isAvailable);
  }
}

function buildSeats(tableId: string, capacity: number): TableRecord["seats"] {
  return Array.from({ length: capacity }, (_, index) => ({
    id: `${tableId}-seat-${index + 1}`,
    tableId,
    seatNumber: index + 1,
    label: `Seat ${index + 1}`,
    isOccupied: false,
    guestId: null,
  }));
}

export const tableManagementRepository = new TableManagementRepository();
