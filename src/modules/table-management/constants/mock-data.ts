import {
  TABLE_KINDS,
  TABLE_RESERVATION_STATES,
  TABLE_STATUSES,
  TABLE_TIMELINE_EVENT_TYPES,
  ZONE_TYPES,
} from "@/modules/table-management/constants/table-status";
import type { FloorRecord, TableRecord } from "@/modules/table-management/types/table-management";

export const DEFAULT_TABLE_SCOPE = {
  tenantId: "tenant-harbour",
  workspaceId: "ws-harbour-kitchen",
  businessId: "biz-harbour-kitchen",
  branchId: "branch-harbour-main",
  userId: "user-harbour-owner",
} as const;

const FLOOR_MAIN = "floor-main";
const ZONE_MAIN = "zone-main-dining";
const ZONE_OUTDOOR = "zone-outdoor";
const ZONE_VIP = "zone-vip";
const ZONE_WAITING = "zone-waiting";

function buildSeats(tableId: string, capacity: number, occupiedCount = 0): TableRecord["seats"] {
  return Array.from({ length: capacity }, (_, index) => ({
    id: `${tableId}-seat-${index + 1}`,
    tableId,
    seatNumber: index + 1,
    label: `Seat ${index + 1}`,
    isOccupied: index < occupiedCount,
    guestId: index < occupiedCount ? `guest-${tableId}-${index + 1}` : null,
  }));
}

function buildTable(partial: {
  id: string;
  label: string;
  number: number;
  zoneId: string;
  status: (typeof TABLE_STATUSES)[keyof typeof TABLE_STATUSES];
  seatCapacity: number;
  minCapacity?: number;
  position: { x: number; y: number; rotation?: number };
  isVip?: boolean;
  isOutdoor?: boolean;
  isPrivateRoom?: boolean;
  kind?: (typeof TABLE_KINDS)[keyof typeof TABLE_KINDS];
  occupiedSeats?: number;
  utilizationScore?: number;
  waitTimeMinutes?: number;
}): TableRecord {
  const now = "2026-02-15T18:00:00.000Z";
  const occupied = partial.occupiedSeats ?? 0;

  return {
    table: {
      id: partial.id,
      floorId: FLOOR_MAIN,
      zoneId: partial.zoneId,
      branchId: DEFAULT_TABLE_SCOPE.branchId,
      label: partial.label,
      number: partial.number,
      kind: partial.kind ?? TABLE_KINDS.SINGLE,
      status: partial.status,
      seatCapacity: partial.seatCapacity,
      minCapacity: partial.minCapacity ?? 1,
      position: {
        x: partial.position.x,
        y: partial.position.y,
        rotation: partial.position.rotation ?? 0,
      },
      size: { width: 80, height: 80 },
      isVip: partial.isVip ?? false,
      isOutdoor: partial.isOutdoor ?? false,
      isPrivateRoom: partial.isPrivateRoom ?? false,
      mergedIntoTableId: null,
      splitFromTableId: null,
      groupId: null,
      dragDropReady: true,
      createdAt: now,
      updatedAt: now,
    },
    seats: buildSeats(partial.id, partial.seatCapacity, occupied),
    reservationState: {
      tableId: partial.id,
      reservationId: partial.status === TABLE_STATUSES.RESERVED ? `res-${partial.id}` : null,
      state:
        partial.status === TABLE_STATUSES.RESERVED
          ? TABLE_RESERVATION_STATES.UPCOMING
          : partial.status === TABLE_STATUSES.OCCUPIED
            ? TABLE_RESERVATION_STATES.SEATED
            : TABLE_RESERVATION_STATES.NONE,
      partySize: partial.status === TABLE_STATUSES.OCCUPIED ? occupied : 0,
      guestName: partial.status === TABLE_STATUSES.OCCUPIED ? "Walk-in party" : null,
      reservedAt: partial.status === TABLE_STATUSES.RESERVED ? now : null,
      expectedArrivalAt: partial.status === TABLE_STATUSES.RESERVED ? now : null,
      seatedAt: partial.status === TABLE_STATUSES.OCCUPIED ? now : null,
    },
    availability: {
      tableId: partial.id,
      isAvailable: partial.status === TABLE_STATUSES.AVAILABLE,
      availableAt: partial.status === TABLE_STATUSES.CLEANING ? "2026-02-15T18:15:00.000Z" : null,
      blockedReason:
        partial.status === TABLE_STATUSES.BLOCKED ? "Reserved for private event" : null,
      nextReservationAt:
        partial.status === TABLE_STATUSES.AVAILABLE ? "2026-02-15T19:30:00.000Z" : null,
      occupancyPercent: Math.round((occupied / partial.seatCapacity) * 100),
    },
    qrCode: {
      tableId: partial.id,
      token: `qr-${partial.id}`,
      url: `https://order.getbusal.com/t/${partial.id}`,
      isActive: partial.status !== TABLE_STATUSES.OUT_OF_SERVICE,
      lastScannedAt: partial.status === TABLE_STATUSES.OCCUPIED ? now : null,
    },
    analytics: {
      tableId: partial.id,
      turnoverRate: partial.utilizationScore ?? 0.65,
      avgOccupancyMinutes: 52,
      revenueTodayPence: 8400 + partial.number * 120,
      utilizationScore: partial.utilizationScore ?? 0.65,
      waitTimeMinutes: partial.waitTimeMinutes ?? 0,
    },
    aiContext: {
      tableId: partial.id,
      summary: `${partial.label} · ${partial.seatCapacity} seats · ${partial.status}`,
      insights: [
        `Utilization ${Math.round((partial.utilizationScore ?? 0.65) * 100)}% today`,
        partial.isVip ? "VIP table — prioritize for premium guests" : "Standard service table",
      ],
      recommendedActions:
        partial.status === TABLE_STATUSES.CLEANING
          ? ["Mark available when turnover complete"]
          : ["Monitor occupancy for next seating window"],
      waitTimePredictionMinutes: partial.waitTimeMinutes ?? null,
      seatingScore: partial.utilizationScore ?? 0.65,
      lastGeneratedAt: now,
    },
    timeline: [
      {
        id: `${partial.id}-tl-1`,
        tableId: partial.id,
        type: TABLE_TIMELINE_EVENT_TYPES.STATUS_CHANGED,
        timestamp: now,
        actorId: DEFAULT_TABLE_SCOPE.userId,
        payload: { status: partial.status },
      },
    ],
  };
}

export const MOCK_TABLE_RECORDS: TableRecord[] = [
  buildTable({
    id: "tbl-101",
    label: "T1",
    number: 1,
    zoneId: ZONE_MAIN,
    status: TABLE_STATUSES.AVAILABLE,
    seatCapacity: 2,
    position: { x: 120, y: 140 },
    utilizationScore: 0.72,
  }),
  buildTable({
    id: "tbl-102",
    label: "T2",
    number: 2,
    zoneId: ZONE_MAIN,
    status: TABLE_STATUSES.OCCUPIED,
    seatCapacity: 4,
    occupiedSeats: 3,
    position: { x: 240, y: 140 },
    utilizationScore: 0.88,
  }),
  buildTable({
    id: "tbl-103",
    label: "T3",
    number: 3,
    zoneId: ZONE_MAIN,
    status: TABLE_STATUSES.RESERVED,
    seatCapacity: 4,
    position: { x: 360, y: 140 },
    utilizationScore: 0.61,
    waitTimeMinutes: 12,
  }),
  buildTable({
    id: "tbl-104",
    label: "T4",
    number: 4,
    zoneId: ZONE_MAIN,
    status: TABLE_STATUSES.CLEANING,
    seatCapacity: 6,
    position: { x: 480, y: 140 },
    utilizationScore: 0.55,
  }),
  buildTable({
    id: "tbl-vip-1",
    label: "VIP 1",
    number: 10,
    zoneId: ZONE_VIP,
    status: TABLE_STATUSES.OCCUPIED,
    seatCapacity: 6,
    occupiedSeats: 4,
    position: { x: 120, y: 320 },
    isVip: true,
    utilizationScore: 0.92,
  }),
  buildTable({
    id: "tbl-out-1",
    label: "Patio 1",
    number: 20,
    zoneId: ZONE_OUTDOOR,
    status: TABLE_STATUSES.AVAILABLE,
    seatCapacity: 4,
    position: { x: 120, y: 460 },
    isOutdoor: true,
    utilizationScore: 0.48,
  }),
  buildTable({
    id: "tbl-private-1",
    label: "Room A",
    number: 30,
    zoneId: ZONE_VIP,
    status: TABLE_STATUSES.BLOCKED,
    seatCapacity: 10,
    minCapacity: 6,
    position: { x: 360, y: 320 },
    isPrivateRoom: true,
    utilizationScore: 0.35,
  }),
  buildTable({
    id: "tbl-wait-1",
    label: "Waiting 1",
    number: 40,
    zoneId: ZONE_WAITING,
    status: TABLE_STATUSES.OUT_OF_SERVICE,
    seatCapacity: 2,
    position: { x: 120, y: 580 },
    utilizationScore: 0,
  }),
];

export const MOCK_FLOOR_RECORD: FloorRecord = {
  floor: {
    id: FLOOR_MAIN,
    tenantId: DEFAULT_TABLE_SCOPE.tenantId,
    workspaceId: DEFAULT_TABLE_SCOPE.workspaceId,
    businessId: DEFAULT_TABLE_SCOPE.businessId,
    branchId: DEFAULT_TABLE_SCOPE.branchId,
    name: "Main Dining",
    level: 0,
    sortOrder: 0,
    isActive: true,
    layoutWidth: 960,
    layoutHeight: 720,
    createdAt: "2026-02-15T12:00:00.000Z",
    updatedAt: "2026-02-15T18:00:00.000Z",
  },
  zones: [
    {
      id: ZONE_MAIN,
      floorId: FLOOR_MAIN,
      name: "Main Dining",
      zoneType: ZONE_TYPES.MAIN_DINING,
      color: "#3b82f6",
      sortOrder: 0,
      bounds: { x: 80, y: 80, width: 520, height: 200 },
    },
    {
      id: ZONE_VIP,
      floorId: FLOOR_MAIN,
      name: "VIP & Private",
      zoneType: ZONE_TYPES.VIP,
      color: "#8b5cf6",
      sortOrder: 1,
      bounds: { x: 80, y: 280, width: 520, height: 140 },
    },
    {
      id: ZONE_OUTDOOR,
      floorId: FLOOR_MAIN,
      name: "Outdoor Patio",
      zoneType: ZONE_TYPES.OUTDOOR,
      color: "#22c55e",
      sortOrder: 2,
      bounds: { x: 80, y: 420, width: 520, height: 120 },
    },
    {
      id: ZONE_WAITING,
      floorId: FLOOR_MAIN,
      name: "Waiting Area",
      zoneType: ZONE_TYPES.WAITING_AREA,
      color: "#64748b",
      sortOrder: 3,
      bounds: { x: 80, y: 540, width: 520, height: 100 },
    },
  ],
  tables: MOCK_TABLE_RECORDS,
  groups: [],
};

export const MOCK_FLOOR_RECORDS: FloorRecord[] = [MOCK_FLOOR_RECORD];

export const MOCK_TABLE_RECORD = MOCK_TABLE_RECORDS[0]!;
