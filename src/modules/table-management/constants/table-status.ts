/** Dining table lifecycle statuses. */
export const TABLE_STATUSES = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  OCCUPIED: "occupied",
  CLEANING: "cleaning",
  OUT_OF_SERVICE: "out_of_service",
  BLOCKED: "blocked",
} as const;

export type TableStatus = (typeof TABLE_STATUSES)[keyof typeof TABLE_STATUSES];

/** Floor zone classifications. */
export const ZONE_TYPES = {
  MAIN_DINING: "main_dining",
  OUTDOOR: "outdoor",
  VIP: "vip",
  PRIVATE_ROOM: "private_room",
  WAITING_AREA: "waiting_area",
  BAR: "bar",
} as const;

export type ZoneType = (typeof ZONE_TYPES)[keyof typeof ZONE_TYPES];

/** Table configuration kinds. */
export const TABLE_KINDS = {
  SINGLE: "single",
  MERGED: "merged",
  SPLIT: "split",
} as const;

export type TableKind = (typeof TABLE_KINDS)[keyof typeof TABLE_KINDS];

/** Reservation linkage states for a table. */
export const TABLE_RESERVATION_STATES = {
  NONE: "none",
  UPCOMING: "upcoming",
  SEATED: "seated",
  OVERDUE: "overdue",
  NO_SHOW: "no_show",
} as const;

export type TableReservationStateKind =
  (typeof TABLE_RESERVATION_STATES)[keyof typeof TABLE_RESERVATION_STATES];

/** Timeline event types for table activity. */
export const TABLE_TIMELINE_EVENT_TYPES = {
  STATUS_CHANGED: "status_changed",
  MERGED: "merged",
  SPLIT: "split",
  TRANSFERRED: "transferred",
  ASSIGNED: "assigned",
  QR_SCANNED: "qr_scanned",
  RESERVATION_LINKED: "reservation_linked",
  CLEANING_STARTED: "cleaning_started",
  CLEANING_COMPLETED: "cleaning_completed",
} as const;

export type TableTimelineEventType =
  (typeof TABLE_TIMELINE_EVENT_TYPES)[keyof typeof TABLE_TIMELINE_EVENT_TYPES];

export const TABLE_AI_TOOL_IDS = {
  CREATE_TABLE: "table.create-table",
  UPDATE_TABLE: "table.update-table",
  MERGE_TABLES: "table.merge-tables",
  SPLIT_TABLES: "table.split-tables",
  ASSIGN_TABLE: "table.assign-table",
  RECOMMEND_TABLE: "table.recommend-table",
  PREDICT_WAIT_TIME: "table.predict-wait-time",
  OPTIMIZE_SEATING: "table.optimize-seating",
} as const;

export type TableAiToolId = (typeof TABLE_AI_TOOL_IDS)[keyof typeof TABLE_AI_TOOL_IDS];

/** Module-local permission markers (future RBAC wiring). */
export const TABLE_MANAGEMENT_PERMISSIONS = {
  READ: "tables.read",
  MANAGE: "tables.manage",
  MERGE: "tables.merge",
  ASSIGN: "tables.assign",
  ANALYTICS_READ: "tables.analytics.read",
} as const;

export type TableManagementPermission =
  (typeof TABLE_MANAGEMENT_PERMISSIONS)[keyof typeof TABLE_MANAGEMENT_PERMISSIONS];
