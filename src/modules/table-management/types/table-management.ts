import type {
  TableKind,
  TableReservationStateKind,
  TableStatus,
  TableTimelineEventType,
  ZoneType,
} from "@/modules/table-management/constants/table-status";

/** Tenant-scoped restaurant floor (supports multiple floors per branch). */
export interface RestaurantFloor {
  id: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  name: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
  /** Canvas dimensions for drag-and-drop floor plan editor. */
  layoutWidth: number;
  layoutHeight: number;
  createdAt: string;
  updatedAt: string;
}

/** Named zone within a floor (VIP, outdoor, private room, waiting area, etc.). */
export interface FloorZone {
  id: string;
  floorId: string;
  name: string;
  zoneType: ZoneType;
  color: string;
  sortOrder: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/** Physical dining table with layout coordinates and capacity. */
export interface DiningTable {
  id: string;
  floorId: string;
  zoneId: string;
  branchId: string;
  label: string;
  number: number;
  kind: TableKind;
  status: TableStatus;
  seatCapacity: number;
  minCapacity: number;
  position: {
    x: number;
    y: number;
    rotation: number;
  };
  size: {
    width: number;
    height: number;
  };
  isVip: boolean;
  isOutdoor: boolean;
  isPrivateRoom: boolean;
  mergedIntoTableId: string | null;
  splitFromTableId: string | null;
  groupId: string | null;
  dragDropReady: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Logical grouping for merged tables. */
export interface TableGroup {
  id: string;
  floorId: string;
  label: string;
  tableIds: string[];
  seatCapacity: number;
  status: TableStatus;
  createdAt: string;
}

/** Individual seat at a table for occupancy tracking. */
export interface Seat {
  id: string;
  tableId: string;
  seatNumber: number;
  label: string;
  isOccupied: boolean;
  guestId: string | null;
}

/** Reservation linkage for a table. */
export interface TableReservationState {
  tableId: string;
  reservationId: string | null;
  state: TableReservationStateKind;
  partySize: number;
  guestName: string | null;
  reservedAt: string | null;
  expectedArrivalAt: string | null;
  seatedAt: string | null;
}

/** Real-time availability snapshot for a table. */
export interface TableAvailability {
  tableId: string;
  isAvailable: boolean;
  availableAt: string | null;
  blockedReason: string | null;
  nextReservationAt: string | null;
  occupancyPercent: number;
}

/** Merge operation audit record. */
export interface TableMerge {
  id: string;
  floorId: string;
  sourceTableIds: string[];
  targetTableId: string;
  mergedLabel: string;
  mergedAt: string;
  mergedBy: string;
}

/** Split operation audit record. */
export interface TableSplit {
  id: string;
  floorId: string;
  sourceTableId: string;
  newTableIds: string[];
  splitAt: string;
  splitBy: string;
}

/** Transfer of guests/order between tables. */
export interface TableTransfer {
  id: string;
  floorId: string;
  fromTableId: string;
  toTableId: string;
  orderId: string | null;
  partySize: number;
  transferredAt: string;
  transferredBy: string;
}

/** Chronological activity on a table. */
export interface TableTimelineEvent {
  id: string;
  tableId: string;
  type: TableTimelineEventType;
  timestamp: string;
  actorId: string | null;
  payload: Record<string, unknown>;
}

/** QR ordering token assignment for a table. */
export interface TableQrCode {
  tableId: string;
  token: string;
  url: string;
  isActive: boolean;
  lastScannedAt: string | null;
}

/** Operational analytics for a table. */
export interface TableAnalytics {
  tableId: string;
  turnoverRate: number;
  avgOccupancyMinutes: number;
  revenueTodayPence: number;
  utilizationScore: number;
  waitTimeMinutes: number;
}

/** AI-enriched context for table recommendations. */
export interface TableAiContext {
  tableId: string;
  summary: string;
  insights: string[];
  recommendedActions: string[];
  waitTimePredictionMinutes: number | null;
  seatingScore: number;
  lastGeneratedAt: string;
}

/** Full table aggregate — single source of truth per table. */
export interface TableRecord {
  table: DiningTable;
  seats: Seat[];
  reservationState: TableReservationState;
  availability: TableAvailability;
  qrCode: TableQrCode | null;
  analytics: TableAnalytics;
  aiContext: TableAiContext;
  timeline: TableTimelineEvent[];
}

/** Floor with nested zones, tables, and groups. */
export interface FloorRecord {
  floor: RestaurantFloor;
  zones: FloorZone[];
  tables: TableRecord[];
  groups: TableGroup[];
}

export interface TableSearchQuery {
  query?: string;
  tenantId?: string;
  businessId?: string;
  branchId?: string;
  floorId?: string;
  zoneId?: string;
  status?: TableStatus;
  zoneType?: ZoneType;
  kind?: TableKind;
  minCapacity?: number;
  limit?: number;
  page?: number;
  pageSize?: number;
  sortBy?: "label" | "number" | "capacity" | "status" | "createdAt";
  sortDirection?: "asc" | "desc";
  includeArchived?: boolean;
}

export interface CreateTableInput {
  floorId: string;
  zoneId?: string;
  label: string;
  seatCapacity: number;
  minCapacity?: number;
  position?: {
    x: number;
    y: number;
    rotation?: number;
  };
  size?: DiningTable["size"];
  isVip?: boolean;
  isOutdoor?: boolean;
  isPrivateRoom?: boolean;
}

export interface UpdateTableInput {
  tableId: string;
  label?: string;
  status?: TableStatus;
  seatCapacity?: number;
  position?: {
    x: number;
    y: number;
    rotation?: number;
  };
  zoneId?: string;
}

export interface MergeTablesInput {
  floorId: string;
  sourceTableIds: string[];
  mergedLabel: string;
  actorId?: string;
}

export interface SplitTableInput {
  floorId: string;
  sourceTableId: string;
  newLabels: string[];
  actorId?: string;
}

export interface AssignTableInput {
  tableId: string;
  reservationId?: string;
  partySize: number;
  guestName?: string;
  actorId?: string;
}

export interface TransferTableInput {
  fromTableId: string;
  toTableId: string;
  orderId?: string;
  partySize: number;
  actorId?: string;
}

export interface TablePlatformContext {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
}

export interface TablePlatformSnapshot {
  context: TablePlatformContext;
  floors: FloorRecord[];
  tableCount: number;
  availableCount: number;
  occupiedCount: number;
  reservedCount: number;
  cleaningCount: number;
  blockedCount: number;
  outOfServiceCount: number;
  avgUtilizationScore: number;
  realtimeOccupancyPercent: number;
}

export interface TableManagementContextValue {
  context: TablePlatformContext;
  floors: FloorRecord[];
  snapshot: TablePlatformSnapshot | null;
  selectedFloor: FloorRecord | null;
  selectedTable: TableRecord | null;
  selectFloor: (floorId: string | null) => void;
  selectTable: (tableId: string | null) => void;
  searchTables: (query: TableSearchQuery) => TableRecord[];
  refresh: () => void;
  isRefreshing?: boolean;
  error?: string | null;
}
