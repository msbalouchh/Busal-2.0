import type { ReservationSourceValue } from "@/modules/reservations/constants/routes";
import type { ClientReservation } from "@/modules/reservations/lib/reservation-utils";
import { toDateInputValue } from "@/modules/reservations/lib/reservation-utils";

export interface ReservationFormState {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  partySize: string;
  notes: string;
  source: ReservationSourceValue;
}

export interface ReservationFormErrors {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  reservationDate?: string;
  startTime?: string;
  endTime?: string;
  partySize?: string;
}

const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;

export function createEmptyReservationForm(): ReservationFormState {
  return {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    reservationDate: new Date().toISOString().slice(0, 10),
    startTime: "18:00",
    endTime: "20:00",
    partySize: "2",
    notes: "",
    source: "ADMIN",
  };
}

function parseTimeToMinutes(time: string): number {
  const parts = time.split(":").map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  return hours * 60 + minutes;
}

export function validateReservationForm(form: ReservationFormState): ReservationFormErrors {
  const errors: ReservationFormErrors = {};

  if (!form.customerName.trim()) {
    errors.customerName = "Customer name is required";
  }

  if (!form.customerPhone.trim()) {
    errors.customerPhone = "Phone is required";
  }

  if (form.customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())) {
    errors.customerEmail = "Enter a valid email address";
  }

  if (!form.reservationDate) {
    errors.reservationDate = "Date is required";
  } else if (Number.isNaN(new Date(form.reservationDate).getTime())) {
    errors.reservationDate = "Enter a valid date";
  }

  if (!form.startTime.trim() || !TIME_PATTERN.test(form.startTime.trim())) {
    errors.startTime = "Enter a valid start time";
  }

  if (!form.endTime.trim() || !TIME_PATTERN.test(form.endTime.trim())) {
    errors.endTime = "Enter a valid end time";
  }

  if (
    !errors.startTime &&
    !errors.endTime &&
    parseTimeToMinutes(form.endTime) <= parseTimeToMinutes(form.startTime)
  ) {
    errors.endTime = "End time must be after start time";
  }

  const partySize = Number.parseInt(form.partySize, 10);
  if (!Number.isInteger(partySize) || partySize < 1) {
    errors.partySize = "Party size must be at least 1";
  }

  return errors;
}

export function buildReservationPayload(form: ReservationFormState) {
  return {
    customerName: form.customerName.trim(),
    customerPhone: form.customerPhone.trim(),
    customerEmail: form.customerEmail.trim() || undefined,
    reservationDate: form.reservationDate,
    startTime: form.startTime.trim(),
    endTime: form.endTime.trim(),
    partySize: Number.parseInt(form.partySize, 10),
    notes: form.notes.trim() || undefined,
    source: form.source,
  };
}

export const RESERVATION_SELECT_CLASSNAME =
  "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export function reservationToFormState(reservation: ClientReservation): ReservationFormState {
  return {
    customerName: reservation.customerName,
    customerPhone: reservation.customerPhone,
    customerEmail: reservation.customerEmail ?? "",
    reservationDate: toDateInputValue(reservation.reservationDate),
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    partySize: String(reservation.partySize),
    notes: reservation.notes ?? "",
    source: reservation.source,
  };
}
