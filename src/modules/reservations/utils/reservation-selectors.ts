import {
  RESERVATION_STATUSES,
  type ReservationSource,
  type ReservationStatus,
} from "@/modules/reservations/constants/reservation-status";
import type { ReservationRecord } from "@/modules/reservations/types/reservations";

export function getReservationSummary(record: ReservationRecord): string {
  const { reservation, guest } = record;
  return `${guest.firstName} ${guest.lastName} · ${reservation.confirmationCode} · party of ${reservation.partySize} · ${reservation.status}`;
}

export function isActiveReservation(record: ReservationRecord): boolean {
  const active: ReservationStatus[] = [
    RESERVATION_STATUSES.PENDING,
    RESERVATION_STATUSES.CONFIRMED,
    RESERVATION_STATUSES.CHECKED_IN,
    RESERVATION_STATUSES.SEATED,
    RESERVATION_STATUSES.WAITLISTED,
  ];
  return active.includes(record.reservation.status);
}

export function isCancelledOrNoShow(record: ReservationRecord): boolean {
  return (
    record.reservation.status === RESERVATION_STATUSES.CANCELLED ||
    record.reservation.status === RESERVATION_STATUSES.NO_SHOW
  );
}

export function sortByScheduledTime(records: ReservationRecord[]): ReservationRecord[] {
  return [...records].sort((a, b) => {
    const dateCompare = a.reservation.scheduledDate.localeCompare(b.reservation.scheduledDate);
    if (dateCompare !== 0) return dateCompare;
    return a.reservation.startTime.localeCompare(b.reservation.startTime);
  });
}

export function countByStatus(records: ReservationRecord[]): Record<ReservationStatus, number> {
  const counts = Object.fromEntries(
    Object.values(RESERVATION_STATUSES).map((status) => [status, 0]),
  ) as Record<ReservationStatus, number>;

  for (const record of records) {
    const status = record.reservation.status;
    counts[status] = (counts[status] ?? 0) + 1;
  }

  return counts;
}

export function countBySource(records: ReservationRecord[]): Record<ReservationSource, number> {
  const counts = {} as Record<ReservationSource, number>;

  for (const record of records) {
    const source = record.reservation.source;
    counts[source] = (counts[source] ?? 0) + 1;
  }

  return counts;
}

export function filterByDate(records: ReservationRecord[], date: string): ReservationRecord[] {
  return records.filter((record) => record.reservation.scheduledDate === date);
}

export function getTotalCovers(records: ReservationRecord[]): number {
  return records.reduce((sum, record) => sum + record.reservation.partySize, 0);
}

export function hasTableAssigned(record: ReservationRecord): boolean {
  return Boolean(record.reservation.tableId ?? record.seating.assignedTableId);
}
