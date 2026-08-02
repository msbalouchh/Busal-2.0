import type { ReservationStatus } from "@prisma/client";

import type { ReservationManagementInput } from "@/modules/reservation-management/types/reservation-management-types";

const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;
const PHONE_PATTERN = /^[\d+\-().\s]{6,24}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseTimeToMinutes(time: string): number {
  const parts = time.trim().split(":").map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  return hours * 60 + minutes;
}

export function normalizeGuestName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeGuestPhone(phone: string): string {
  return phone.trim();
}

export function normalizeReservationDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid reservation date");
  }

  return date;
}

export function validateTimeValue(time: string, label: string): string {
  const normalized = time.trim();

  if (!TIME_PATTERN.test(normalized)) {
    throw new Error(`Invalid ${label}`);
  }

  return normalized;
}

export function validateSchedule(
  reservationDate: string,
  startTime: string,
  endTime: string,
): { reservationDate: Date; startTime: string; endTime: string } {
  const normalizedDate = normalizeReservationDate(reservationDate);
  const normalizedStart = validateTimeValue(startTime, "start time");
  const normalizedEnd = validateTimeValue(endTime, "end time");

  if (parseTimeToMinutes(normalizedEnd) <= parseTimeToMinutes(normalizedStart)) {
    throw new Error("End time must be after start time");
  }

  return {
    reservationDate: normalizedDate,
    startTime: normalizedStart,
    endTime: normalizedEnd,
  };
}

export function validateReservationInput(input: ReservationManagementInput): void {
  const guestName = normalizeGuestName(input.guestName);

  if (!guestName) {
    throw new Error("Guest name is required");
  }

  if (guestName.length < 2 || guestName.length > 120) {
    throw new Error("Guest name must be 2-120 characters");
  }

  const guestPhone = normalizeGuestPhone(input.guestPhone);

  if (!guestPhone) {
    throw new Error("Guest phone is required");
  }

  if (!PHONE_PATTERN.test(guestPhone)) {
    throw new Error("Enter a valid phone number");
  }

  if (input.guestEmail?.trim() && !EMAIL_PATTERN.test(input.guestEmail.trim())) {
    throw new Error("Enter a valid email address");
  }

  if (!input.branchId?.trim()) {
    throw new Error("Branch is required");
  }

  if (!Number.isInteger(input.partySize) || input.partySize < 1) {
    throw new Error("Party size must be at least 1");
  }

  if (input.partySize > 100) {
    throw new Error("Party size cannot exceed 100");
  }

  validateSchedule(input.reservationDate, input.startTime, input.endTime);
}

export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
  bufferMinutes = 0,
): boolean {
  const startMinutesA = parseTimeToMinutes(startA);
  const endMinutesA = parseTimeToMinutes(endA) + bufferMinutes;
  const startMinutesB = parseTimeToMinutes(startB);
  const endMinutesB = parseTimeToMinutes(endB) + bufferMinutes;

  return startMinutesA < endMinutesB && endMinutesA > startMinutesB;
}

export function validateReservationStatusTransition(
  currentStatus: ReservationStatus,
  nextStatus: ReservationStatus,
): void {
  if (currentStatus === nextStatus) {
    return;
  }

  const terminal: ReservationStatus[] = ["COMPLETED", "CANCELLED", "NO_SHOW"];

  if (terminal.includes(currentStatus)) {
    throw new Error(`Cannot change status from ${currentStatus}`);
  }

  if (currentStatus === "PENDING" && !["CONFIRMED", "CANCELLED", "SEATED"].includes(nextStatus)) {
    throw new Error("Pending reservations can only be confirmed, seated, or cancelled");
  }

  if (currentStatus === "CONFIRMED" && !["SEATED", "CANCELLED", "NO_SHOW"].includes(nextStatus)) {
    throw new Error("Confirmed reservations can only be seated, cancelled, or marked no-show");
  }

  if (currentStatus === "SEATED" && !["COMPLETED", "CANCELLED"].includes(nextStatus)) {
    throw new Error("Seated reservations can only be completed or cancelled");
  }
}

export function validateBusinessHoursWindow(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  hours: {
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }[],
): void {
  const dayHours = hours.find((entry) => entry.dayOfWeek === dayOfWeek);

  if (!dayHours || dayHours.isClosed || !dayHours.openTime || !dayHours.closeTime) {
    throw new Error("Reservations are not available on this day");
  }

  const openMinutes = parseTimeToMinutes(dayHours.openTime);
  const closeMinutes = parseTimeToMinutes(dayHours.closeTime);
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    throw new Error("Reservation must be within business hours");
  }
}

export function validatePartySizeForTable(
  partySize: number,
  capacity: number,
  minimumCapacity: number,
): void {
  if (partySize > capacity) {
    throw new Error(`Party size cannot exceed table capacity (${capacity})`);
  }

  if (partySize < minimumCapacity) {
    throw new Error(`Party size must be at least ${minimumCapacity} for this table`);
  }
}

export function getWeekDateRange(referenceDate: string): { dateFrom: string; dateTo: string } {
  const date = normalizeReservationDate(referenceDate);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const dateFrom = new Date(date);
  dateFrom.setUTCDate(dateFrom.getUTCDate() + mondayOffset);

  const dateTo = new Date(dateFrom);
  dateTo.setUTCDate(dateTo.getUTCDate() + 6);

  return {
    dateFrom: dateFrom.toISOString().slice(0, 10),
    dateTo: dateTo.toISOString().slice(0, 10),
  };
}

export function buildTimelineHours(startHour = 8, endHour = 23): string[] {
  const hours: string[] = [];

  for (let hour = startHour; hour <= endHour; hour += 1) {
    hours.push(`${String(hour).padStart(2, "0")}:00`);
  }

  return hours;
}

export function reservationTimelineOffset(startTime: string, baseHour = 8): number {
  return Math.max(0, parseTimeToMinutes(startTime) - baseHour * 60);
}
