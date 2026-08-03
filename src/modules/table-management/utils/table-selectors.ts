import {
  TABLE_STATUSES,
  type TableStatus,
} from "@/modules/table-management/constants/table-status";
import type { DiningTable, TableRecord } from "@/modules/table-management/types/table-management";

export function getTableSummary(record: TableRecord): string {
  const { table } = record;
  return `${table.label} · ${table.seatCapacity} seats · ${table.status}`;
}

export function isAvailableTable(record: TableRecord): boolean {
  return (
    record.table.status === TABLE_STATUSES.AVAILABLE &&
    record.availability.isAvailable &&
    !record.availability.blockedReason
  );
}

export function isOccupiedTable(record: TableRecord): boolean {
  return record.table.status === TABLE_STATUSES.OCCUPIED;
}

export function canMergeTables(records: TableRecord[]): boolean {
  if (records.length < 2) return false;
  return records.every(
    (record) =>
      record.table.kind !== "merged" &&
      (record.table.status === TABLE_STATUSES.AVAILABLE ||
        record.table.status === TABLE_STATUSES.RESERVED),
  );
}

export function canSplitTable(record: TableRecord): boolean {
  return (
    record.table.seatCapacity >= 4 &&
    (record.table.kind === "single" || record.table.kind === "merged") &&
    record.table.status !== TABLE_STATUSES.OCCUPIED
  );
}

export function sortByUtilization(records: TableRecord[]): TableRecord[] {
  return [...records].sort((a, b) => b.analytics.utilizationScore - a.analytics.utilizationScore);
}

export function countByStatus(records: TableRecord[]): Record<TableStatus, number> {
  const counts = Object.fromEntries(
    Object.values(TABLE_STATUSES).map((status) => [status, 0]),
  ) as Record<TableStatus, number>;

  for (const record of records) {
    const status = record.table.status;
    counts[status] = (counts[status] ?? 0) + 1;
  }

  return counts;
}

export function filterByMinCapacity(records: TableRecord[], partySize: number): TableRecord[] {
  return records.filter((record) => record.table.seatCapacity >= partySize);
}

export function getOccupiedSeatCount(record: TableRecord): number {
  return record.seats.filter((seat) => seat.isOccupied).length;
}

export function isDragDropReady(table: DiningTable): boolean {
  return table.dragDropReady && table.status !== TABLE_STATUSES.OUT_OF_SERVICE;
}
