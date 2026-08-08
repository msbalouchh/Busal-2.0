import type {
  Prisma,
  Reservation,
  RestaurantFloor,
  RestaurantTable,
  RestaurantTableStatus,
  TableQRCode,
} from "@prisma/client";

import {
  TABLE_KINDS,
  TABLE_RESERVATION_STATES,
  TABLE_STATUSES,
  TABLE_TIMELINE_EVENT_TYPES,
  ZONE_TYPES,
  type TableKind,
  type TableStatus,
} from "@/modules/table-management/constants/table-status";
import type { TableTenantScope } from "@/modules/table-management/lib/table-scope";
import type {
  DiningTable,
  FloorRecord,
  FloorZone,
  RestaurantFloor as DomainFloor,
  Seat,
  TableAnalytics,
  TableAvailability,
  TableAiContext,
  TableGroup,
  TableQrCode,
  TableRecord,
  TableReservationState,
  TableTimelineEvent,
} from "@/modules/table-management/types/table-management";

export type RestaurantTableWithRelations = Prisma.RestaurantTableGetPayload<{
  include: {
    floor?: true;
    tableQrCodes: true;
    reservations: true;
    mergedSources: true;
  };
}>;

export type RestaurantFloorWithTables = Prisma.RestaurantFloorGetPayload<{
  include: {
    tables: {
      include: {
        tableQrCodes: true;
        reservations: true;
        mergedSources: true;
      };
    };
  };
}>;

const ACTIVE_RESERVATION_STATUSES = new Set(["PENDING", "CONFIRMED", "SEATED"]);

export function mapPrismaStatusToDomain(status: RestaurantTableStatus): TableStatus {
  switch (status) {
    case "AVAILABLE":
      return TABLE_STATUSES.AVAILABLE;
    case "OCCUPIED":
      return TABLE_STATUSES.OCCUPIED;
    case "RESERVED":
      return TABLE_STATUSES.RESERVED;
    case "DIRTY":
      return TABLE_STATUSES.CLEANING;
    case "OUT_OF_SERVICE":
      return TABLE_STATUSES.OUT_OF_SERVICE;
    case "ARCHIVED":
      return TABLE_STATUSES.OUT_OF_SERVICE;
    default:
      return TABLE_STATUSES.AVAILABLE;
  }
}

export function mapDomainStatusToPrisma(status: TableStatus): RestaurantTableStatus {
  switch (status) {
    case TABLE_STATUSES.AVAILABLE:
      return "AVAILABLE";
    case TABLE_STATUSES.OCCUPIED:
      return "OCCUPIED";
    case TABLE_STATUSES.RESERVED:
      return "RESERVED";
    case TABLE_STATUSES.CLEANING:
      return "DIRTY";
    case TABLE_STATUSES.BLOCKED:
    case TABLE_STATUSES.OUT_OF_SERVICE:
      return "OUT_OF_SERVICE";
    default:
      return "AVAILABLE";
  }
}

function resolveTableKind(table: RestaurantTableWithRelations): TableKind {
  if (table.mergedSources.length > 0) {
    return TABLE_KINDS.MERGED;
  }

  if (table.mergedIntoTableId) {
    return TABLE_KINDS.SPLIT;
  }

  return TABLE_KINDS.SINGLE;
}

function buildDefaultZone(floorId: string, scope: TableTenantScope): FloorZone {
  return {
    id: `${floorId}-main-dining`,
    floorId,
    name: "Main Dining",
    zoneType: ZONE_TYPES.MAIN_DINING,
    color: "#6366f1",
    sortOrder: 0,
    bounds: { x: 0, y: 0, width: 1200, height: 800 },
  };
}

function buildSeats(tableId: string, capacity: number, occupiedCount: number): Seat[] {
  return Array.from({ length: capacity }, (_, index) => ({
    id: `${tableId}-seat-${index + 1}`,
    tableId,
    seatNumber: index + 1,
    label: `Seat ${index + 1}`,
    isOccupied: index < occupiedCount,
    guestId: null,
  }));
}

function resolveReservationState(
  table: RestaurantTableWithRelations,
): TableReservationState {
  const reservation = table.reservations.find((entry) =>
    ACTIVE_RESERVATION_STATUSES.has(entry.status),
  );

  if (!reservation) {
    return {
      tableId: table.id,
      reservationId: null,
      state: TABLE_RESERVATION_STATES.NONE,
      partySize: 0,
      guestName: null,
      reservedAt: null,
      expectedArrivalAt: null,
      seatedAt: null,
    };
  }

  const state =
    reservation.status === "SEATED"
      ? TABLE_RESERVATION_STATES.SEATED
      : TABLE_RESERVATION_STATES.UPCOMING;

  return {
    tableId: table.id,
    reservationId: reservation.id,
    state,
    partySize: reservation.partySize,
    guestName: reservation.guestName,
    reservedAt: reservation.createdAt.toISOString(),
    expectedArrivalAt: `${reservation.reservationDate.toISOString().slice(0, 10)}T${reservation.startTime}`,
    seatedAt: reservation.checkInTime?.toISOString() ?? null,
  };
}

function mapQrCode(tableId: string, qr: TableQRCode | undefined): TableQrCode | null {
  if (!qr) {
    return null;
  }

  return {
    tableId,
    token: qr.token,
    url: qr.qrCodeUrl,
    isActive: qr.status === "ACTIVE",
    lastScannedAt: qr.updatedAt.toISOString(),
  };
}

function buildAnalytics(table: RestaurantTableWithRelations): TableAnalytics {
  const reservationCount = table.reservations.length;
  const utilizationScore = Math.min(
    1,
    table.status === "OCCUPIED"
      ? 0.85
      : table.status === "RESERVED"
        ? 0.55
        : reservationCount > 0
          ? 0.35
          : 0.15,
  );

  return {
    tableId: table.id,
    turnoverRate: reservationCount > 0 ? Math.min(1, reservationCount / 10) : 0,
    avgOccupancyMinutes: table.status === "OCCUPIED" ? 42 : 0,
    revenueTodayPence: 0,
    utilizationScore,
    waitTimeMinutes: table.status === "RESERVED" ? 12 : 0,
  };
}

function buildAiContext(table: RestaurantTableWithRelations): TableAiContext {
  const label = table.tableName ?? `Table ${table.tableNumber}`;
  const status = mapPrismaStatusToDomain(table.status);

  return {
    tableId: table.id,
    summary: `${label} · ${table.capacity} seats · ${status.replace("_", " ")}`,
    insights: [
      `Capacity ${table.minimumCapacity}-${table.capacity}`,
      table.isReservable ? "Reservable" : "Walk-in only",
    ],
    recommendedActions:
      status === TABLE_STATUSES.CLEANING
        ? ["Complete cleaning and mark available"]
        : status === TABLE_STATUSES.AVAILABLE
          ? ["Ready for seating"]
          : ["Monitor turnover"],
    waitTimePredictionMinutes: status === TABLE_STATUSES.RESERVED ? 10 : null,
    seatingScore: Math.min(1, table.capacity / 8),
    lastGeneratedAt: new Date().toISOString(),
  };
}

function buildAvailability(
  table: RestaurantTableWithRelations,
  reservationState: TableReservationState,
): TableAvailability {
  const status = mapPrismaStatusToDomain(table.status);
  const isAvailable = status === TABLE_STATUSES.AVAILABLE;

  return {
    tableId: table.id,
    isAvailable,
    availableAt: status === TABLE_STATUSES.CLEANING ? new Date().toISOString() : null,
    blockedReason:
      status === TABLE_STATUSES.BLOCKED || status === TABLE_STATUSES.OUT_OF_SERVICE
        ? table.notes
        : null,
    nextReservationAt: reservationState.expectedArrivalAt,
    occupancyPercent:
      table.status === "OCCUPIED"
        ? 100
        : reservationState.partySize > 0
          ? Math.round((reservationState.partySize / table.capacity) * 100)
          : 0,
  };
}

function buildTimeline(table: RestaurantTableWithRelations): TableTimelineEvent[] {
  return [
    {
      id: `${table.id}-updated`,
      tableId: table.id,
      type: TABLE_TIMELINE_EVENT_TYPES.STATUS_CHANGED,
      timestamp: table.updatedAt.toISOString(),
      actorId: null,
      payload: { status: mapPrismaStatusToDomain(table.status) },
    },
  ];
}

export function mapTableToRecord(
  table: RestaurantTableWithRelations,
  scope: TableTenantScope,
  zoneId: string,
): TableRecord {
  const reservationState = resolveReservationState(table);
  const occupiedSeats =
    table.status === "OCCUPIED" ? Math.max(1, reservationState.partySize) : 0;
  const parsedNumber = Number.parseInt(table.tableNumber, 10);

  const diningTable: DiningTable = {
    id: table.id,
    floorId: table.floorId,
    zoneId,
    branchId: table.branchId,
    label: table.tableName ?? `Table ${table.tableNumber}`,
    number: Number.isFinite(parsedNumber) ? parsedNumber : 0,
    kind: resolveTableKind(table),
    status: mapPrismaStatusToDomain(table.status),
    seatCapacity: table.capacity,
    minCapacity: table.minimumCapacity,
    position: {
      x: table.positionX,
      y: table.positionY,
      rotation: table.rotation,
    },
    size: {
      width: table.width,
      height: table.height,
    },
    isVip: table.notes?.toLowerCase().includes("vip") ?? false,
    isOutdoor: table.notes?.toLowerCase().includes("outdoor") ?? false,
    isPrivateRoom: table.notes?.toLowerCase().includes("private") ?? false,
    mergedIntoTableId: table.mergedIntoTableId,
    splitFromTableId: table.mergedIntoTableId,
    groupId: table.mergedSources.length > 0 ? `${table.id}-group` : null,
    dragDropReady: table.status !== "ARCHIVED",
    createdAt: table.createdAt.toISOString(),
    updatedAt: table.updatedAt.toISOString(),
  };

  return {
    table: diningTable,
    seats: buildSeats(table.id, table.capacity, occupiedSeats),
    reservationState,
    availability: buildAvailability(table, reservationState),
    qrCode: mapQrCode(table.id, table.tableQrCodes[0]),
    analytics: buildAnalytics(table),
    aiContext: buildAiContext(table),
    timeline: buildTimeline(table),
  };
}

function buildGroups(floorId: string, tables: TableRecord[]): TableGroup[] {
  const groups: TableGroup[] = [];

  for (const record of tables) {
    if (record.table.kind !== TABLE_KINDS.MERGED || !record.table.groupId) {
      continue;
    }

    groups.push({
      id: record.table.groupId,
      floorId,
      label: record.table.label,
      tableIds: [record.table.id],
      seatCapacity: record.table.seatCapacity,
      status: record.table.status,
      createdAt: record.table.createdAt,
    });
  }

  return groups;
}

export function mapFloorToRecord(
  floor: RestaurantFloorWithTables,
  scope: TableTenantScope,
): FloorRecord {
  const zone = buildDefaultZone(floor.id, scope);
  const tables = floor.tables.map((table) =>
    mapTableToRecord(table as RestaurantTableWithRelations, scope, zone.id),
  );

  const domainFloor: DomainFloor = {
    id: floor.id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    businessId: floor.businessId,
    branchId: floor.branchId,
    name: floor.name,
    level: floor.displayOrder,
    sortOrder: floor.displayOrder,
    isActive: floor.status === "ACTIVE",
    layoutWidth: 1200,
    layoutHeight: 800,
    createdAt: floor.createdAt.toISOString(),
    updatedAt: floor.updatedAt.toISOString(),
  };

  return {
    floor: domainFloor,
    zones: [zone],
    tables,
    groups: buildGroups(floor.id, tables),
  };
}

export function mapFloorSummary(floor: RestaurantFloor): DomainFloor {
  return {
    id: floor.id,
    tenantId: floor.businessId,
    workspaceId: floor.businessId,
    businessId: floor.businessId,
    branchId: floor.branchId,
    name: floor.name,
    level: floor.displayOrder,
    sortOrder: floor.displayOrder,
    isActive: floor.status === "ACTIVE",
    layoutWidth: 1200,
    layoutHeight: 800,
    createdAt: floor.createdAt.toISOString(),
    updatedAt: floor.updatedAt.toISOString(),
  };
}

export function activeReservationWhere(
  businessId: string,
  branchId: string,
): Prisma.ReservationWhereInput {
  return {
    businessId,
    branchId,
    status: { in: Array.from(ACTIVE_RESERVATION_STATUSES) as Reservation["status"][] },
  };
}
