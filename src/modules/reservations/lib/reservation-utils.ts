import type { ReservationSource, ReservationStatus } from "@prisma/client";

import type { ClientReservationData } from "@/modules/reservations/lib/reservation-mappers";

export type ClientReservation = Omit<
  ClientReservationData,
  "reservationDate" | "createdAt" | "updatedAt"
> & {
  reservationDate: string;
  createdAt: string;
  updatedAt: string;
};

export function serializeReservation(reservation: ClientReservationData): ClientReservation {
  return {
    ...reservation,
    reservationDate: reservation.reservationDate.toISOString(),
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
  };
}

export function getReservationDateKey(value: string): string {
  return value.slice(0, 10);
}

export function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatReservationDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatStatusLabel(status: ReservationStatus): string {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatSourceLabel(source: ReservationSource): string {
  return source
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function toDateInputValue(value: string): string {
  return getReservationDateKey(value);
}

export interface ReservationStats {
  total: number;
  today: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export function computeReservationStats(reservations: ClientReservation[]): ReservationStats {
  const today = getTodayDateKey();

  return {
    total: reservations.length,
    today: reservations.filter((item) => getReservationDateKey(item.reservationDate) === today)
      .length,
    pending: reservations.filter((item) => item.status === "PENDING").length,
    confirmed: reservations.filter((item) => item.status === "CONFIRMED").length,
    completed: reservations.filter((item) => item.status === "COMPLETED").length,
    cancelled: reservations.filter((item) => item.status === "CANCELLED").length,
    noShow: reservations.filter((item) => item.status === "NO_SHOW").length,
  };
}

export function mapPrismaSourceToForm(source: ReservationSource): ReservationSource {
  return source;
}
