import "server-only";

import type { Prisma, ReservationStatus } from "@prisma/client";
import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma";
import {
  ACTIVE_RESERVATION_STATUSES,
  RESERVATION_LIST_PAGE_SIZE,
} from "@/modules/reservation-management/constants/routes";
import {
  normalizeGuestName,
  normalizeGuestPhone,
  normalizeReservationDate,
  timesOverlap,
  validateBusinessHoursWindow,
  validatePartySizeForTable,
  validateReservationInput,
  validateReservationStatusTransition,
  validateSchedule,
} from "@/modules/reservation-management/lib/reservation-validation";
import type {
  AssignReservationStaffInput,
  AssignReservationTableInput,
  CalendarReservationEntry,
  ReservationDashboardStats,
  ReservationListQuery,
  ReservationListResult,
  ReservationManagementInput,
  ReservationManagementRecord,
  ReservationSortField,
  TableAvailabilityQuery,
  TableAvailabilitySlot,
} from "@/modules/reservation-management/types/reservation-management-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

type ReservationPayload = Prisma.ReservationGetPayload<{
  include: typeof reservationInclude;
}>;

const reservationInclude = {
  customer: {
    select: { id: true, name: true, phone: true, email: true },
  },
  restaurantTable: {
    select: {
      id: true,
      tableNumber: true,
      tableName: true,
      capacity: true,
      floor: { select: { name: true } },
    },
  },
  assignedStaff: {
    select: { id: true, firstName: true, lastName: true, fullName: true },
  },
} satisfies Prisma.ReservationInclude;

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function assertBranchInBusiness(businessId: string, branchId: string): Promise<void> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, businessId },
    select: { id: true },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }
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

function serializeReservation(reservation: ReservationPayload): ReservationManagementRecord {
  return {
    id: reservation.id,
    businessId: reservation.businessId,
    branchId: reservation.branchId,
    reservationNumber: reservation.reservationNumber,
    guestName: reservation.guestName,
    guestPhone: reservation.guestPhone,
    guestEmail: reservation.guestEmail,
    customerId: reservation.customerId,
    customer: reservation.customer,
    restaurantTableId: reservation.restaurantTableId,
    restaurantTable: reservation.restaurantTable
      ? {
          id: reservation.restaurantTable.id,
          tableNumber: reservation.restaurantTable.tableNumber,
          tableName: reservation.restaurantTable.tableName,
          capacity: reservation.restaurantTable.capacity,
          floorName: reservation.restaurantTable.floor.name,
        }
      : null,
    assignedStaffId: reservation.assignedStaffId,
    assignedStaff: reservation.assignedStaff,
    partySize: reservation.partySize,
    reservationDate: reservation.reservationDate.toISOString().slice(0, 10),
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    status: reservation.status,
    source: reservation.source,
    specialRequests: reservation.specialRequests,
    notes: reservation.notes,
    checkInTime: reservation.checkInTime?.toISOString() ?? null,
    checkOutTime: reservation.checkOutTime?.toISOString() ?? null,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
  };
}

function resolveReservationOrderBy(
  sortBy: ReservationSortField = "reservationDate",
  sortDirection: "asc" | "desc" = "asc",
): Prisma.ReservationOrderByWithRelationInput[] {
  switch (sortBy) {
    case "startTime":
      return [{ startTime: sortDirection }];
    case "guestName":
      return [{ guestName: sortDirection }];
    case "partySize":
      return [{ partySize: sortDirection }];
    case "status":
      return [{ status: sortDirection }, { startTime: "asc" }];
    case "createdAt":
      return [{ createdAt: sortDirection }];
    case "reservationDate":
    default:
      return [{ reservationDate: sortDirection }, { startTime: "asc" }];
  }
}

function buildReservationWhere(
  businessId: string,
  query: ReservationListQuery,
): Prisma.ReservationWhereInput {
  const where: Prisma.ReservationWhereInput = {
    businessId,
    branchId: query.branchId,
  };

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  }

  if (query.source && query.source !== "ALL") {
    where.source = query.source;
  }

  if (query.date) {
    where.reservationDate = normalizeReservationDate(query.date);
  } else if (query.dateFrom || query.dateTo) {
    where.reservationDate = {
      ...(query.dateFrom ? { gte: normalizeReservationDate(query.dateFrom) } : {}),
      ...(query.dateTo ? { lte: normalizeReservationDate(query.dateTo) } : {}),
    };
  }

  if (query.search?.trim()) {
    const search = query.search.trim();
    where.OR = [
      { guestName: { contains: search, mode: "insensitive" } },
      { guestPhone: { contains: search, mode: "insensitive" } },
      { guestEmail: { contains: search, mode: "insensitive" } },
      { reservationNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

async function getReservationSettings(businessId: string) {
  const settings = await prisma.restaurantSettings.findUnique({
    where: { businessId },
    select: { reservationBufferMinutes: true },
  });

  return {
    bufferMinutes: settings?.reservationBufferMinutes ?? 15,
  };
}

async function getBranchBusinessHours(businessId: string, branchId: string) {
  const branchHours = await prisma.businessHours.findMany({
    where: { businessId, branchId },
    orderBy: { dayOfWeek: "asc" },
  });

  if (branchHours.length > 0) {
    return branchHours;
  }

  return prisma.businessHours.findMany({
    where: { businessId, branchId: null },
    orderBy: { dayOfWeek: "asc" },
  });
}

async function assertWithinBusinessHours(
  businessId: string,
  branchId: string,
  reservationDate: Date,
  startTime: string,
  endTime: string,
): Promise<void> {
  const hours = await getBranchBusinessHours(businessId, branchId);

  if (hours.length === 0) {
    return;
  }

  validateBusinessHoursWindow(
    reservationDate.getUTCDay(),
    startTime,
    endTime,
    hours.map((entry) => ({
      dayOfWeek: entry.dayOfWeek,
      openTime: entry.openTime,
      closeTime: entry.closeTime,
      isClosed: entry.isClosed,
    })),
  );
}

async function assertNoDoubleBooking(
  businessId: string,
  branchId: string,
  reservationDate: Date,
  startTime: string,
  endTime: string,
  restaurantTableId: string,
  excludeReservationId?: string,
): Promise<void> {
  const { bufferMinutes } = await getReservationSettings(businessId);

  const conflicts = await prisma.reservation.findMany({
    where: {
      businessId,
      branchId,
      restaurantTableId,
      reservationDate,
      status: { in: [...ACTIVE_RESERVATION_STATUSES] },
      ...(excludeReservationId ? { NOT: { id: excludeReservationId } } : {}),
    },
    select: { id: true, startTime: true, endTime: true, reservationNumber: true },
  });

  for (const conflict of conflicts) {
    if (timesOverlap(startTime, endTime, conflict.startTime, conflict.endTime, bufferMinutes)) {
      throw new Error(
        `Table is already reserved (${conflict.reservationNumber}) for the selected time`,
      );
    }
  }
}

async function assertCustomerInBusiness(
  businessId: string,
  customerId: string | null | undefined,
): Promise<void> {
  if (!customerId) {
    return;
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId, deletedAt: null },
    select: { id: true },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }
}

async function assertStaffInBusiness(
  businessId: string,
  staffId: string | null | undefined,
): Promise<void> {
  if (!staffId) {
    return;
  }

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, businessId, employmentStatus: "ACTIVE" },
    select: { id: true },
  });

  if (!staff) {
    throw new Error("Staff member not found");
  }
}

async function assertRestaurantTable(
  businessId: string,
  branchId: string,
  restaurantTableId: string | null | undefined,
  partySize: number,
): Promise<void> {
  if (!restaurantTableId) {
    return;
  }

  const table = await prisma.restaurantTable.findFirst({
    where: {
      id: restaurantTableId,
      businessId,
      branchId,
      status: { not: "ARCHIVED" },
      isReservable: true,
    },
    select: { id: true, capacity: true, minimumCapacity: true },
  });

  if (!table) {
    throw new Error("Table not found or not reservable");
  }

  validatePartySizeForTable(partySize, table.capacity, table.minimumCapacity);
}

async function getOwnedReservation(
  businessId: string,
  branchId: string,
  reservationId: string,
): Promise<ReservationPayload> {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, businessId, branchId },
    include: reservationInclude,
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  return reservation;
}

async function syncTableStatusForReservation(
  restaurantTableId: string | null,
  status: ReservationStatus,
): Promise<void> {
  if (!restaurantTableId) {
    return;
  }

  if (status === "SEATED") {
    await prisma.restaurantTable.update({
      where: { id: restaurantTableId },
      data: { status: "OCCUPIED" },
    });
    return;
  }

  if (["CONFIRMED", "PENDING"].includes(status)) {
    await prisma.restaurantTable.update({
      where: { id: restaurantTableId },
      data: { status: "RESERVED" },
    });
    return;
  }

  if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(status)) {
    const activeCount = await prisma.reservation.count({
      where: {
        restaurantTableId,
        status: { in: [...ACTIVE_RESERVATION_STATUSES] },
      },
    });

    if (activeCount === 0) {
      await prisma.restaurantTable.update({
        where: { id: restaurantTableId },
        data: { status: "AVAILABLE" },
      });
    }
  }
}

export async function getReservationDashboardStats(
  businessId: string,
  branchId: string,
): Promise<ReservationDashboardStats> {
  const today = normalizeReservationDate(new Date().toISOString().slice(0, 10));
  const weekEnd = new Date(today);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const baseWhere = { businessId, branchId, reservationDate: today };

  const [
    totalToday,
    pendingToday,
    confirmedToday,
    seatedToday,
    completedToday,
    cancelledToday,
    noShowToday,
    upcomingWeek,
  ] = await Promise.all([
    prisma.reservation.count({ where: baseWhere }),
    prisma.reservation.count({ where: { ...baseWhere, status: "PENDING" } }),
    prisma.reservation.count({ where: { ...baseWhere, status: "CONFIRMED" } }),
    prisma.reservation.count({ where: { ...baseWhere, status: "SEATED" } }),
    prisma.reservation.count({ where: { ...baseWhere, status: "COMPLETED" } }),
    prisma.reservation.count({ where: { ...baseWhere, status: "CANCELLED" } }),
    prisma.reservation.count({ where: { ...baseWhere, status: "NO_SHOW" } }),
    prisma.reservation.count({
      where: {
        businessId,
        branchId,
        reservationDate: { gt: today, lte: weekEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
  ]);

  return {
    totalToday,
    pendingToday,
    confirmedToday,
    seatedToday,
    completedToday,
    cancelledToday,
    noShowToday,
    upcomingWeek,
  };
}

export async function listManagedReservations(
  ownerId: string,
  query: ReservationListQuery,
): Promise<ReservationListResult> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, query.branchId);

  const pageSize = query.pageSize ?? RESERVATION_LIST_PAGE_SIZE;
  const page = Math.max(1, query.page ?? 1);
  const where = buildReservationWhere(businessId, query);

  const [total, items] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      include: reservationInclude,
      orderBy: resolveReservationOrderBy(query.sortBy, query.sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: items.map(serializeReservation),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listCalendarReservations(
  ownerId: string,
  branchId: string,
  dateFrom: string,
  dateTo: string,
): Promise<CalendarReservationEntry[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, branchId);

  const reservations = await prisma.reservation.findMany({
    where: {
      businessId,
      branchId,
      reservationDate: {
        gte: normalizeReservationDate(dateFrom),
        lte: normalizeReservationDate(dateTo),
      },
    },
    include: {
      restaurantTable: { select: { tableNumber: true, tableName: true } },
    },
    orderBy: [{ reservationDate: "asc" }, { startTime: "asc" }],
  });

  return reservations.map((reservation) => ({
    id: reservation.id,
    reservationNumber: reservation.reservationNumber,
    guestName: reservation.guestName,
    partySize: reservation.partySize,
    reservationDate: reservation.reservationDate.toISOString().slice(0, 10),
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    status: reservation.status,
    restaurantTableId: reservation.restaurantTableId,
    tableLabel: reservation.restaurantTable
      ? (reservation.restaurantTable.tableName ?? reservation.restaurantTable.tableNumber)
      : null,
  }));
}

export async function getManagedReservation(
  ownerId: string,
  branchId: string,
  reservationId: string,
): Promise<ReservationManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const reservation = await getOwnedReservation(businessId, branchId, reservationId);
  return serializeReservation(reservation);
}

export async function createManagedReservation(
  ownerId: string,
  input: ReservationManagementInput,
): Promise<ReservationManagementRecord> {
  validateReservationInput(input);

  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, input.branchId);
  await assertCustomerInBusiness(businessId, input.customerId);
  await assertStaffInBusiness(businessId, input.assignedStaffId);

  const schedule = validateSchedule(input.reservationDate, input.startTime, input.endTime);

  await assertWithinBusinessHours(
    businessId,
    input.branchId,
    schedule.reservationDate,
    schedule.startTime,
    schedule.endTime,
  );

  await assertRestaurantTable(businessId, input.branchId, input.restaurantTableId, input.partySize);

  if (input.restaurantTableId) {
    await assertNoDoubleBooking(
      businessId,
      input.branchId,
      schedule.reservationDate,
      schedule.startTime,
      schedule.endTime,
      input.restaurantTableId,
    );
  }

  const reservationNumber = await generateReservationNumber();

  const reservation = await prisma.reservation.create({
    data: {
      businessId,
      branchId: input.branchId,
      customerId: input.customerId ?? null,
      restaurantTableId: input.restaurantTableId ?? null,
      assignedStaffId: input.assignedStaffId ?? null,
      reservationNumber,
      guestName: normalizeGuestName(input.guestName),
      guestPhone: normalizeGuestPhone(input.guestPhone),
      guestEmail: input.guestEmail?.trim() || null,
      partySize: input.partySize,
      reservationDate: schedule.reservationDate,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      status: "PENDING",
      source: input.source ?? "PHONE",
      specialRequests: input.specialRequests?.trim() || null,
      notes: input.notes?.trim() || null,
    },
    include: reservationInclude,
  });

  if (reservation.restaurantTableId) {
    await syncTableStatusForReservation(reservation.restaurantTableId, reservation.status);
  }

  return serializeReservation(reservation);
}

export async function updateManagedReservation(
  ownerId: string,
  reservationId: string,
  input: ReservationManagementInput,
): Promise<ReservationManagementRecord> {
  validateReservationInput(input);

  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedReservation(businessId, input.branchId, reservationId);

  if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(existing.status)) {
    throw new Error("Cannot edit a completed, cancelled, or no-show reservation");
  }

  await assertCustomerInBusiness(businessId, input.customerId);
  await assertStaffInBusiness(businessId, input.assignedStaffId);

  const schedule = validateSchedule(input.reservationDate, input.startTime, input.endTime);

  await assertWithinBusinessHours(
    businessId,
    input.branchId,
    schedule.reservationDate,
    schedule.startTime,
    schedule.endTime,
  );

  const nextTableId = input.restaurantTableId ?? null;
  await assertRestaurantTable(businessId, input.branchId, nextTableId, input.partySize);

  if (nextTableId) {
    await assertNoDoubleBooking(
      businessId,
      input.branchId,
      schedule.reservationDate,
      schedule.startTime,
      schedule.endTime,
      nextTableId,
      reservationId,
    );
  }

  const previousTableId = existing.restaurantTableId;

  const reservation = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      customerId: input.customerId ?? null,
      restaurantTableId: nextTableId,
      assignedStaffId: input.assignedStaffId ?? null,
      guestName: normalizeGuestName(input.guestName),
      guestPhone: normalizeGuestPhone(input.guestPhone),
      guestEmail: input.guestEmail?.trim() || null,
      partySize: input.partySize,
      reservationDate: schedule.reservationDate,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      source: input.source ?? existing.source,
      specialRequests: input.specialRequests?.trim() || null,
      notes: input.notes?.trim() || null,
    },
    include: reservationInclude,
  });

  if (previousTableId && previousTableId !== reservation.restaurantTableId) {
    await syncTableStatusForReservation(previousTableId, "CANCELLED");
  }

  if (reservation.restaurantTableId) {
    await syncTableStatusForReservation(reservation.restaurantTableId, reservation.status);
  }

  return serializeReservation(reservation);
}

async function transitionReservationStatus(
  ownerId: string,
  branchId: string,
  reservationId: string,
  nextStatus: ReservationStatus,
  extra?: { checkInTime?: Date; checkOutTime?: Date },
): Promise<ReservationManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedReservation(businessId, branchId, reservationId);

  validateReservationStatusTransition(existing.status, nextStatus);

  const reservation = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: nextStatus,
      ...(extra?.checkInTime ? { checkInTime: extra.checkInTime } : {}),
      ...(extra?.checkOutTime ? { checkOutTime: extra.checkOutTime } : {}),
    },
    include: reservationInclude,
  });

  if (reservation.restaurantTableId) {
    await syncTableStatusForReservation(reservation.restaurantTableId, nextStatus);
  }

  return serializeReservation(reservation);
}

export async function confirmManagedReservation(
  ownerId: string,
  branchId: string,
  reservationId: string,
): Promise<ReservationManagementRecord> {
  return transitionReservationStatus(ownerId, branchId, reservationId, "CONFIRMED");
}

export async function seatManagedReservation(
  ownerId: string,
  branchId: string,
  reservationId: string,
): Promise<ReservationManagementRecord> {
  return transitionReservationStatus(ownerId, branchId, reservationId, "SEATED", {
    checkInTime: new Date(),
  });
}

export async function completeManagedReservation(
  ownerId: string,
  branchId: string,
  reservationId: string,
): Promise<ReservationManagementRecord> {
  return transitionReservationStatus(ownerId, branchId, reservationId, "COMPLETED", {
    checkOutTime: new Date(),
  });
}

export async function cancelManagedReservation(
  ownerId: string,
  branchId: string,
  reservationId: string,
): Promise<ReservationManagementRecord> {
  return transitionReservationStatus(ownerId, branchId, reservationId, "CANCELLED");
}

export async function markNoShowManagedReservation(
  ownerId: string,
  branchId: string,
  reservationId: string,
): Promise<ReservationManagementRecord> {
  return transitionReservationStatus(ownerId, branchId, reservationId, "NO_SHOW");
}

export async function deleteManagedReservation(
  ownerId: string,
  branchId: string,
  reservationId: string,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedReservation(businessId, branchId, reservationId);

  if (existing.restaurantTableId) {
    await syncTableStatusForReservation(existing.restaurantTableId, "CANCELLED");
  }

  await prisma.reservation.delete({ where: { id: reservationId } });
}

export async function assignTableToReservation(
  ownerId: string,
  input: AssignReservationTableInput,
): Promise<ReservationManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await getOwnedReservation(businessId, input.branchId, input.reservationId);

  if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(existing.status)) {
    throw new Error("Cannot assign a table to this reservation");
  }

  await assertRestaurantTable(
    businessId,
    input.branchId,
    input.restaurantTableId,
    existing.partySize,
  );

  await assertNoDoubleBooking(
    businessId,
    input.branchId,
    existing.reservationDate,
    existing.startTime,
    existing.endTime,
    input.restaurantTableId,
    input.reservationId,
  );

  const previousTableId = existing.restaurantTableId;

  const reservation = await prisma.reservation.update({
    where: { id: input.reservationId },
    data: { restaurantTableId: input.restaurantTableId },
    include: reservationInclude,
  });

  if (previousTableId && previousTableId !== reservation.restaurantTableId) {
    await syncTableStatusForReservation(previousTableId, "CANCELLED");
  }

  await syncTableStatusForReservation(reservation.restaurantTableId, reservation.status);

  return serializeReservation(reservation);
}

export async function assignStaffToReservation(
  ownerId: string,
  input: AssignReservationStaffInput,
): Promise<ReservationManagementRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  await getOwnedReservation(businessId, input.branchId, input.reservationId);
  await assertStaffInBusiness(businessId, input.assignedStaffId);

  const reservation = await prisma.reservation.update({
    where: { id: input.reservationId },
    data: { assignedStaffId: input.assignedStaffId },
    include: reservationInclude,
  });

  return serializeReservation(reservation);
}

export async function checkTableAvailability(
  ownerId: string,
  query: TableAvailabilityQuery,
): Promise<TableAvailabilitySlot[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, query.branchId);

  const schedule = validateSchedule(query.reservationDate, query.startTime, query.endTime);

  const { bufferMinutes } = await getReservationSettings(businessId);

  const tables = await prisma.restaurantTable.findMany({
    where: {
      businessId,
      branchId: query.branchId,
      status: { notIn: ["ARCHIVED", "OUT_OF_SERVICE"] },
      isReservable: true,
      capacity: { gte: query.partySize },
      minimumCapacity: { lte: query.partySize },
    },
    include: { floor: { select: { name: true } } },
    orderBy: [{ capacity: "asc" }, { tableNumber: "asc" }],
  });

  const conflicts = await prisma.reservation.findMany({
    where: {
      businessId,
      branchId: query.branchId,
      reservationDate: schedule.reservationDate,
      status: { in: [...ACTIVE_RESERVATION_STATUSES] },
      restaurantTableId: { in: tables.map((table) => table.id) },
      ...(query.excludeReservationId ? { NOT: { id: query.excludeReservationId } } : {}),
    },
    select: {
      restaurantTableId: true,
      startTime: true,
      endTime: true,
      reservationNumber: true,
    },
  });

  return tables.map((table) => {
    const tableConflicts = conflicts.filter((conflict) => conflict.restaurantTableId === table.id);

    for (const conflict of tableConflicts) {
      if (
        timesOverlap(
          schedule.startTime,
          schedule.endTime,
          conflict.startTime,
          conflict.endTime,
          bufferMinutes,
        )
      ) {
        return {
          restaurantTableId: table.id,
          tableNumber: table.tableNumber,
          tableName: table.tableName,
          floorName: table.floor.name,
          capacity: table.capacity,
          minimumCapacity: table.minimumCapacity,
          isAvailable: false,
          conflictReason: `Reserved (${conflict.reservationNumber})`,
        };
      }
    }

    return {
      restaurantTableId: table.id,
      tableNumber: table.tableNumber,
      tableName: table.tableName,
      floorName: table.floor.name,
      capacity: table.capacity,
      minimumCapacity: table.minimumCapacity,
      isAvailable: true,
    };
  });
}

export async function listBranchReservableTablesForSelect(
  ownerId: string,
  branchId: string,
): Promise<{ id: string; label: string; capacity: number }[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, branchId);

  const tables = await prisma.restaurantTable.findMany({
    where: {
      businessId,
      branchId,
      status: { notIn: ["ARCHIVED", "OUT_OF_SERVICE"] },
      isReservable: true,
    },
    include: { floor: { select: { name: true } } },
    orderBy: [{ floor: { displayOrder: "asc" } }, { tableNumber: "asc" }],
  });

  return tables.map((table) => ({
    id: table.id,
    label: `${table.floor.name} · ${table.tableName ?? table.tableNumber} (${table.capacity})`,
    capacity: table.capacity,
  }));
}

export async function listBranchStaffForSelect(
  ownerId: string,
  branchId: string,
): Promise<{ id: string; label: string }[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  await assertBranchInBusiness(businessId, branchId);

  const staff = await prisma.staff.findMany({
    where: {
      businessId,
      employmentStatus: "ACTIVE",
      OR: [{ branchId }, { branchAssignments: { some: { branchId } } }],
    },
    select: { id: true, firstName: true, lastName: true, fullName: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  return staff.map((member) => ({
    id: member.id,
    label: member.fullName || `${member.firstName} ${member.lastName}`.trim(),
  }));
}

export async function listBranchCustomersForSelect(
  ownerId: string,
  search?: string,
): Promise<{ id: string; label: string; phone: string | null }[]> {
  const businessId = await getOwnedBusinessId(ownerId);

  const customers = await prisma.customer.findMany({
    where: {
      businessId,
      deletedAt: null,
      ...(search?.trim()
        ? {
            OR: [
              { name: { contains: search.trim(), mode: "insensitive" } },
              { phone: { contains: search.trim(), mode: "insensitive" } },
              { email: { contains: search.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
    take: 50,
  });

  return customers.map((customer) => ({
    id: customer.id,
    label: customer.name,
    phone: customer.phone,
  }));
}
