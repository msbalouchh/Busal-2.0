import "server-only";

import type { ReservationSource, ReservationStatus } from "@prisma/client";
import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import type { BusinessProfileData } from "@/types/business-profile";

const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;

export interface ReservationData {
  id: string;
  businessId: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  /** @deprecated Use guestName */
  customerName: string;
  /** @deprecated Use guestPhone */
  customerPhone: string;
  /** @deprecated Use guestEmail */
  customerEmail: string | null;
  reservationNumber: string;
  reservationDate: Date;
  startTime: string;
  endTime: string;
  partySize: number;
  status: ReservationStatus;
  notes: string | null;
  source: ReservationSource;
  createdByStaffId: string | null;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
  createdByStaff: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface CreateReservationInput {
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  /** @deprecated Use guestName */
  customerName?: string;
  /** @deprecated Use guestPhone */
  customerPhone?: string;
  /** @deprecated Use guestEmail */
  customerEmail?: string;
  reservationDate: Date | string;
  startTime: string;
  endTime: string;
  partySize: number;
  notes?: string;
  source?: ReservationSource;
  createdByStaffId?: string | null;
  branchId?: string;
}

export interface UpdateReservationInput {
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string | null;
  /** @deprecated Use guestName */
  customerName?: string;
  /** @deprecated Use guestPhone */
  customerPhone?: string;
  /** @deprecated Use guestEmail */
  customerEmail?: string | null;
  reservationDate?: Date | string;
  startTime?: string;
  endTime?: string;
  partySize?: number;
  notes?: string | null;
  source?: ReservationSource;
  createdByStaffId?: string | null;
}

export interface ListReservationsFilters {
  date?: Date | string;
  status?: ReservationStatus;
  source?: ReservationSource;
  branchId?: string | null;
}

const reservationInclude = {
  createdByStaff: {
    select: { id: true, firstName: true, lastName: true },
  },
} as const;

async function getOwnedBusiness(ownerId: string): Promise<BusinessProfileData & { id: string }> {
  return getOrCreateBusinessForOwner(ownerId);
}

function parseTimeToMinutes(time: string): number {
  const parts = time.split(":").map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  return hours * 60 + minutes;
}

function normalizeDate(value: Date | string): Date {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid reservation date");
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function validateTimeValue(time: string, label: string): void {
  if (!TIME_PATTERN.test(time.trim())) {
    throw new Error(`Invalid ${label}`);
  }
}

function validateSchedule(
  reservationDate: Date | string,
  startTime: string,
  endTime: string,
): { reservationDate: Date; startTime: string; endTime: string } {
  const normalizedDate = normalizeDate(reservationDate);
  const normalizedStart = startTime.trim();
  const normalizedEnd = endTime.trim();

  validateTimeValue(normalizedStart, "start time");
  validateTimeValue(normalizedEnd, "end time");

  if (parseTimeToMinutes(normalizedEnd) <= parseTimeToMinutes(normalizedStart)) {
    throw new Error("End time must be after start time");
  }

  return {
    reservationDate: normalizedDate,
    startTime: normalizedStart,
    endTime: normalizedEnd,
  };
}

async function generateReservationNumber(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const suffix = randomBytes(3).toString("hex").toUpperCase();
    const reservationNumber = `RSV-${datePart}-${suffix}`;

    const existing = await prisma.reservation.findUnique({
      where: { reservationNumber },
      select: { id: true },
    });

    if (!existing) {
      return reservationNumber;
    }
  }

  throw new Error("Unable to generate reservation number");
}

async function assertStaffBelongsToBusiness(
  businessId: string,
  staffId: string | null | undefined,
): Promise<void> {
  if (!staffId) {
    return;
  }

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, businessId },
  });

  if (!staff) {
    throw new Error("Staff member not found");
  }
}

async function resolveBranchId(
  businessId: string,
  branchId: string | null | undefined,
): Promise<string> {
  if (branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, businessId },
      select: { id: true },
    });

    if (!branch) {
      throw new Error("Branch not found");
    }

    return branch.id;
  }

  const branch = await prisma.branch.findFirst({
    where: { businessId },
    orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  if (!branch) {
    throw new Error("Branch is required");
  }

  return branch.id;
}

function mapReservation(reservation: {
  id: string;
  businessId: string;
  branchId: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  reservationNumber: string;
  reservationDate: Date;
  startTime: string;
  endTime: string;
  partySize: number;
  status: ReservationStatus;
  notes: string | null;
  source: ReservationSource;
  createdByStaffId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdByStaff: { id: string; firstName: string; lastName: string } | null;
}): ReservationData {
  return {
    id: reservation.id,
    businessId: reservation.businessId,
    branchId: reservation.branchId,
    guestName: reservation.guestName,
    guestPhone: reservation.guestPhone,
    guestEmail: reservation.guestEmail,
    customerName: reservation.guestName,
    customerPhone: reservation.guestPhone,
    customerEmail: reservation.guestEmail,
    reservationNumber: reservation.reservationNumber,
    reservationDate: reservation.reservationDate,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    partySize: reservation.partySize,
    status: reservation.status,
    notes: reservation.notes,
    source: reservation.source,
    createdByStaffId: reservation.createdByStaffId,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
    createdByStaff: reservation.createdByStaff,
  };
}

async function getReservationForBusiness(
  businessId: string,
  reservationId: string,
): Promise<ReservationData> {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, businessId },
    include: reservationInclude,
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  return mapReservation(reservation);
}

export async function createReservation(
  ownerId: string,
  input: CreateReservationInput,
): Promise<ReservationData> {
  const business = await getOwnedBusiness(ownerId);
  const guestName = (input.guestName ?? input.customerName ?? "").trim();
  const guestPhone = (input.guestPhone ?? input.customerPhone ?? "").trim();
  const guestEmail = input.guestEmail ?? input.customerEmail;

  if (!guestName) {
    throw new Error("Guest name is required");
  }

  if (!guestPhone) {
    throw new Error("Guest phone is required");
  }

  if (!Number.isInteger(input.partySize) || input.partySize < 1) {
    throw new Error("Party size must be at least 1");
  }

  await assertStaffBelongsToBusiness(business.id, input.createdByStaffId);
  const branchId = await resolveBranchId(business.id, input.branchId);

  const schedule = validateSchedule(input.reservationDate, input.startTime, input.endTime);
  const reservationNumber = await generateReservationNumber();

  const reservation = await prisma.reservation.create({
    data: {
      businessId: business.id,
      branchId,
      guestName,
      guestPhone,
      guestEmail: guestEmail?.trim() || null,
      reservationNumber,
      reservationDate: schedule.reservationDate,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      partySize: input.partySize,
      status: "PENDING",
      notes: input.notes?.trim() || null,
      source: input.source ?? "PHONE",
      createdByStaffId: input.createdByStaffId ?? null,
    },
    include: reservationInclude,
  });

  return mapReservation(reservation);
}

export async function getReservationById(
  ownerId: string,
  reservationId: string,
): Promise<ReservationData> {
  const business = await getOwnedBusiness(ownerId);
  return getReservationForBusiness(business.id, reservationId);
}

export async function listReservations(
  ownerId: string,
  filters: ListReservationsFilters = {},
): Promise<ReservationData[]> {
  const business = await getOwnedBusiness(ownerId);

  const reservations = await prisma.reservation.findMany({
    where: {
      businessId: business.id,
      ...branchFilter(filters.branchId ?? null),
      ...(filters.date ? { reservationDate: normalizeDate(filters.date) } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.source ? { source: filters.source } : {}),
    },
    include: reservationInclude,
    orderBy: [{ reservationDate: "asc" }, { startTime: "asc" }],
  });

  return reservations.map(mapReservation);
}

export async function updateReservation(
  ownerId: string,
  reservationId: string,
  input: UpdateReservationInput,
): Promise<ReservationData> {
  const business = await getOwnedBusiness(ownerId);

  const existing = await prisma.reservation.findFirst({
    where: { id: reservationId, businessId: business.id },
  });

  if (!existing) {
    throw new Error("Reservation not found");
  }

  if (
    input.partySize !== undefined &&
    (!Number.isInteger(input.partySize) || input.partySize < 1)
  ) {
    throw new Error("Party size must be at least 1");
  }

  await assertStaffBelongsToBusiness(business.id, input.createdByStaffId);

  const reservationDate = input.reservationDate ?? existing.reservationDate;
  const startTime = input.startTime ?? existing.startTime;
  const endTime = input.endTime ?? existing.endTime;
  const schedule = validateSchedule(reservationDate, startTime, endTime);

  const guestName = input.guestName ?? input.customerName ?? existing.guestName;
  const guestPhone = input.guestPhone ?? input.customerPhone ?? existing.guestPhone;
  const guestEmail =
    input.guestEmail !== undefined
      ? input.guestEmail
      : input.customerEmail !== undefined
        ? input.customerEmail
        : existing.guestEmail;

  const reservation = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      guestEmail: guestEmail?.trim() || null,
      reservationDate: schedule.reservationDate,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      ...(input.partySize !== undefined ? { partySize: input.partySize } : {}),
      ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.createdByStaffId !== undefined ? { createdByStaffId: input.createdByStaffId } : {}),
    },
    include: reservationInclude,
  });

  return mapReservation(reservation);
}

export async function cancelReservation(
  ownerId: string,
  reservationId: string,
): Promise<ReservationData> {
  return updateReservationStatus(ownerId, reservationId, "CANCELLED");
}

export async function updateReservationStatus(
  ownerId: string,
  reservationId: string,
  status: ReservationStatus,
): Promise<ReservationData> {
  const business = await getOwnedBusiness(ownerId);

  const existing = await prisma.reservation.findFirst({
    where: { id: reservationId, businessId: business.id },
  });

  if (!existing) {
    throw new Error("Reservation not found");
  }

  const reservation = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status },
    include: reservationInclude,
  });

  return mapReservation(reservation);
}
