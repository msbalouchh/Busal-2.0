import "server-only";

import type { Prisma, ReservationStatus as PrismaReservationStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import {
  RESERVATION_STATUSES,
  RESERVATION_TIMELINE_EVENT_TYPES,
} from "@/modules/reservations/constants/reservation-status";
import {
  appendTimelineEvent,
  composeReservationNotes,
  createTag,
  createWaitlistEntry,
  defaultWaitlistPriority,
  mapDomainSourceToPrisma,
  mapDomainStatusToPrisma,
  mapReservationToClient,
  mapReservationToRecord,
  mapTimelineTypeForStatus,
  normalizeReservationDate,
  resolveGuestName,
  splitReservationNotes,
  type ClientReservationData,
  type ReservationWithRelations,
} from "@/modules/reservations/lib/reservation-mappers";
import type { ReservationTenantScope } from "@/modules/reservations/lib/reservation-scope";
import type {
  AssignTableInput,
  CancelReservationInput,
  CreateReservationInput,
  ReservationRecord,
  ReservationSearchQuery,
  ReservationTimeSlot,
  UpdateReservationInput,
  WaitlistEntryInput,
} from "@/modules/reservations/types/reservations";
import type {
  AddReservationNoteSchemaInput,
  AddReservationTagSchemaInput,
  BulkUpdateReservationsSchemaInput,
  MergeReservationsSchemaInput,
  ReservationSearchInput,
} from "@/modules/reservations/validation/reservation-schemas";

const DEFAULT_PAGE_SIZE = 25;

const reservationInclude = {
  createdByStaff: { select: { id: true, firstName: true, lastName: true } },
  restaurantTable: { include: { floor: true } },
  assignedStaff: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.ReservationInclude;

export interface ReservationSearchResult {
  records: ReservationRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function scopeWhere(scope: ReservationTenantScope): Prisma.ReservationWhereInput {
  return {
    businessId: scope.businessId,
    branchId: scope.branchId,
  };
}

function isArchived(notes: string | null): boolean {
  const { meta } = splitReservationNotes(notes);
  return meta.archived === true;
}

function buildOrderBy(
  sortBy: ReservationSearchInput["sortBy"] = "date",
  sortDirection: "asc" | "desc" = "asc",
): Prisma.ReservationOrderByWithRelationInput[] {
  switch (sortBy) {
    case "time":
      return [{ startTime: sortDirection }, { reservationDate: "asc" }];
    case "partySize":
      return [{ partySize: sortDirection }, { reservationDate: "asc" }];
    case "status":
      return [{ status: sortDirection }, { reservationDate: "asc" }];
    case "createdAt":
      return [{ createdAt: sortDirection }];
    case "date":
    default:
      return [{ reservationDate: sortDirection }, { startTime: "asc" }];
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

function mapSearchStatus(
  status: ReservationSearchQuery["status"],
): PrismaReservationStatus | undefined {
  if (!status) {
    return undefined;
  }
  return mapDomainStatusToPrisma(status);
}

/** Prisma-backed reservation repository with tenant scoping. */
export class ReservationRepository {
  async listReservations(scope: ReservationTenantScope): Promise<ReservationRecord[]> {
    const reservations = await prisma.reservation.findMany({
      where: scopeWhere(scope),
      include: reservationInclude,
      orderBy: [{ reservationDate: "asc" }, { startTime: "asc" }],
    });

    return reservations
      .filter((reservation) => !isArchived(reservation.notes))
      .map((reservation) => mapReservationToRecord(reservation, scope));
  }

  async listClientReservations(scope: ReservationTenantScope): Promise<ClientReservationData[]> {
    const reservations = await prisma.reservation.findMany({
      where: scopeWhere(scope),
      include: reservationInclude,
      orderBy: [{ reservationDate: "asc" }, { startTime: "asc" }],
    });

    return reservations
      .filter((reservation) => !isArchived(reservation.notes))
      .map(mapReservationToClient);
  }

  async findById(
    scope: ReservationTenantScope,
    reservationId: string,
  ): Promise<ReservationRecord | null> {
    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, ...scopeWhere(scope) },
      include: reservationInclude,
    });

    if (!reservation || isArchived(reservation.notes)) {
      return null;
    }

    return mapReservationToRecord(reservation, scope);
  }

  async search(
    scope: ReservationTenantScope,
    query: ReservationSearchQuery = {},
  ): Promise<ReservationSearchResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? query.limit ?? DEFAULT_PAGE_SIZE;
    const prismaStatus = mapSearchStatus(query.status);

    const where: Prisma.ReservationWhereInput = {
      ...scopeWhere(scope),
      ...(prismaStatus ? { status: prismaStatus } : {}),
      ...(query.source ? { source: mapDomainSourceToPrisma(query.source) } : {}),
      ...(query.date ? { reservationDate: normalizeReservationDate(query.date) } : {}),
      ...(query.fromDate || query.toDate
        ? {
            reservationDate: {
              ...(query.fromDate ? { gte: normalizeReservationDate(query.fromDate) } : {}),
              ...(query.toDate ? { lte: normalizeReservationDate(query.toDate) } : {}),
            },
          }
        : {}),
      ...(query.partySizeMin ? { partySize: { gte: query.partySizeMin } } : {}),
      ...(query.query
        ? {
            OR: [
              { guestName: { contains: query.query, mode: "insensitive" } },
              { guestPhone: { contains: query.query, mode: "insensitive" } },
              { guestEmail: { contains: query.query, mode: "insensitive" } },
              { reservationNumber: { contains: query.query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: reservationInclude,
        orderBy: buildOrderBy(query.sortBy, query.sortDirection),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.reservation.count({ where }),
    ]);

    const records = reservations
      .filter((reservation) => query.includeArchived || !isArchived(reservation.notes))
      .filter((reservation) => query.isVip === undefined || splitReservationNotes(reservation.notes).meta.isVip === query.isVip)
      .map((reservation) => mapReservationToRecord(reservation, scope));

    return {
      records,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async create(scope: ReservationTenantScope, input: CreateReservationInput): Promise<ReservationRecord> {
    const guestName = resolveGuestName(input);
    const guestPhone = (input.guestPhone ?? input.customerPhone ?? "").trim();
    const guestEmail = input.guestEmail ?? input.customerEmail;

    if (!guestPhone) {
      throw new Error("Guest phone is required");
    }

    const reservationDate = normalizeReservationDate(input.scheduledDate);
    const endTime =
      input.endTime ??
      (() => {
        const duration = input.durationMinutes ?? 120;
        const startHour = parseInt(input.startTime.split(":")[0] ?? "19", 10);
        return `${String(startHour + Math.floor(duration / 60)).padStart(2, "0")}:00`;
      })();

    const meta = {
      isVip: input.isVip ?? false,
      isGroupBooking: input.partySize >= 8,
      durationMinutes: input.durationMinutes ?? 120,
      timeline: [
        {
          id: `pending-create-${Date.now()}`,
          reservationId: "pending",
          type: RESERVATION_TIMELINE_EVENT_TYPES.CREATED,
          timestamp: new Date().toISOString(),
          actorId: scope.userId,
          payload: {},
        },
      ],
    };

    const reservation = await prisma.reservation.create({
      data: {
        businessId: scope.businessId,
        branchId: input.branchId ?? scope.branchId,
        guestName,
        guestPhone,
        guestEmail: guestEmail?.trim() || null,
        reservationNumber: await generateReservationNumber(),
        reservationDate,
        startTime: input.startTime,
        endTime,
        partySize: input.partySize,
        status: "PENDING",
        source: input.source ? mapDomainSourceToPrisma(input.source) : "PHONE",
        specialRequests: input.specialRequests ?? null,
        notes: composeReservationNotes(input.notes ?? input.specialRequests ?? null, meta),
        restaurantTableId: input.tableId ?? null,
        createdByStaffId: null,
      },
      include: reservationInclude,
    });

    const { guestNotes, meta: storedMeta } = splitReservationNotes(reservation.notes);
    const updatedMeta = appendTimelineEvent(
      { ...storedMeta, timeline: [] },
      {
        reservationId: reservation.id,
        type: RESERVATION_TIMELINE_EVENT_TYPES.CREATED,
        timestamp: reservation.createdAt.toISOString(),
        actorId: scope.userId,
        payload: {},
      },
    );

    const updated = await prisma.reservation.update({
      where: { id: reservation.id },
      data: { notes: composeReservationNotes(guestNotes, updatedMeta) },
      include: reservationInclude,
    });

    return mapReservationToRecord(updated, scope);
  }

  async update(
    scope: ReservationTenantScope,
    input: UpdateReservationInput,
  ): Promise<ReservationRecord | null> {
    const existing = await prisma.reservation.findFirst({
      where: { id: input.reservationId, ...scopeWhere(scope) },
    });

    if (!existing || isArchived(existing.notes)) {
      return null;
    }

    const { guestNotes, meta } = splitReservationNotes(existing.notes);
    let nextMeta = meta;

    if (input.status) {
      nextMeta = appendTimelineEvent(nextMeta, {
        reservationId: input.reservationId,
        type: mapTimelineTypeForStatus(input.status),
        timestamp: new Date().toISOString(),
        actorId: scope.userId,
        payload: { status: input.status },
      });

      if (input.status === RESERVATION_STATUSES.WAITLISTED) {
        nextMeta.domainStatus = RESERVATION_STATUSES.WAITLISTED;
      } else if (input.status === RESERVATION_STATUSES.CHECKED_IN) {
        nextMeta.domainStatus = RESERVATION_STATUSES.CHECKED_IN;
      } else {
        nextMeta.domainStatus = undefined;
      }
    }

    const guestName = input.customerName
      ? input.customerName.trim()
      : input.guestFirstName
        ? resolveGuestName(input)
        : existing.guestName;

    const reservation = await prisma.reservation.update({
      where: { id: input.reservationId },
      data: {
        guestName,
        guestPhone: input.customerPhone ?? input.guestPhone ?? existing.guestPhone,
        guestEmail:
          input.customerEmail !== undefined
            ? input.customerEmail?.trim() || null
            : input.guestEmail !== undefined
              ? input.guestEmail?.trim() || null
              : existing.guestEmail,
        ...(input.partySize !== undefined ? { partySize: input.partySize } : {}),
        ...(input.scheduledDate
          ? { reservationDate: normalizeReservationDate(input.scheduledDate) }
          : {}),
        ...(input.startTime ? { startTime: input.startTime } : {}),
        ...(input.endTime ? { endTime: input.endTime } : {}),
        ...(input.specialRequests !== undefined ? { specialRequests: input.specialRequests } : {}),
        ...(input.source ? { source: mapDomainSourceToPrisma(input.source) } : {}),
        ...(input.status ? { status: mapDomainStatusToPrisma(input.status) } : {}),
        ...(input.tableId !== undefined ? { restaurantTableId: input.tableId } : {}),
        ...(input.status === RESERVATION_STATUSES.CHECKED_IN
          ? { checkInTime: new Date(), status: "CONFIRMED" }
          : {}),
        ...(input.status === RESERVATION_STATUSES.SEATED
          ? { checkInTime: existing.checkInTime ?? new Date(), status: "SEATED" }
          : {}),
        notes: composeReservationNotes(
          input.notes !== undefined ? input.notes : guestNotes,
          nextMeta,
        ),
      },
      include: reservationInclude,
    });

    return mapReservationToRecord(reservation, scope);
  }

  async cancel(
    scope: ReservationTenantScope,
    input: CancelReservationInput,
  ): Promise<ReservationRecord | null> {
    const existing = await prisma.reservation.findFirst({
      where: { id: input.reservationId, ...scopeWhere(scope) },
    });

    if (!existing) {
      return null;
    }

    const { guestNotes, meta } = splitReservationNotes(existing.notes);
    const now = new Date().toISOString();
    const nextMeta = appendTimelineEvent(
      {
        ...meta,
        cancellation: {
          id: `${input.reservationId}-cancel`,
          reservationId: input.reservationId,
          reason: input.reason,
          cancelledBy: input.cancelledBy ?? scope.userId,
          cancelledAt: now,
          refundEligible: true,
        },
      },
      {
        reservationId: input.reservationId,
        type: RESERVATION_TIMELINE_EVENT_TYPES.CANCELLED,
        timestamp: now,
        actorId: input.cancelledBy ?? scope.userId,
        payload: { reason: input.reason },
      },
    );

    const reservation = await prisma.reservation.update({
      where: { id: input.reservationId },
      data: {
        status: "CANCELLED",
        notes: composeReservationNotes(guestNotes, nextMeta),
      },
      include: reservationInclude,
    });

    return mapReservationToRecord(reservation, scope);
  }

  async confirm(scope: ReservationTenantScope, reservationId: string): Promise<ReservationRecord | null> {
    return this.update(scope, {
      reservationId,
      status: RESERVATION_STATUSES.CONFIRMED,
    });
  }

  async checkIn(scope: ReservationTenantScope, reservationId: string): Promise<ReservationRecord | null> {
    return this.update(scope, {
      reservationId,
      status: RESERVATION_STATUSES.CHECKED_IN,
    });
  }

  async markNoShow(scope: ReservationTenantScope, reservationId: string): Promise<ReservationRecord | null> {
    return this.update(scope, {
      reservationId,
      status: RESERVATION_STATUSES.NO_SHOW,
    });
  }

  async assignTable(
    scope: ReservationTenantScope,
    input: AssignTableInput,
  ): Promise<ReservationRecord | null> {
    const table = await prisma.restaurantTable.findFirst({
      where: { id: input.tableId, businessId: scope.businessId, branchId: scope.branchId },
      include: { floor: true },
    });

    if (!table) {
      throw new Error("Table not found");
    }

    const existing = await prisma.reservation.findFirst({
      where: { id: input.reservationId, ...scopeWhere(scope) },
    });

    if (!existing) {
      return null;
    }

    const { guestNotes, meta } = splitReservationNotes(existing.notes);
    const now = new Date().toISOString();
    const nextMeta = appendTimelineEvent(
      {
        ...meta,
        floorId: input.floorId ?? table.floorId,
        assignment: {
          id: `${input.reservationId}-assign-${Date.now()}`,
          reservationId: input.reservationId,
          tableId: input.tableId,
          floorId: input.floorId ?? table.floorId,
          assignedBy: input.assignedBy ?? scope.userId,
          assignedAt: now,
          isAutoSuggested: input.isAutoSuggested ?? false,
        },
        domainStatus: undefined,
      },
      {
        reservationId: input.reservationId,
        type: RESERVATION_TIMELINE_EVENT_TYPES.TABLE_ASSIGNED,
        timestamp: now,
        actorId: input.assignedBy ?? scope.userId,
        payload: { tableId: input.tableId },
      },
    );

    const reservation = await prisma.reservation.update({
      where: { id: input.reservationId },
      data: {
        restaurantTableId: input.tableId,
        status: existing.status === "PENDING" ? "CONFIRMED" : existing.status,
        notes: composeReservationNotes(guestNotes, nextMeta),
      },
      include: reservationInclude,
    });

    return mapReservationToRecord(reservation, scope);
  }

  async addToWaitlist(
    scope: ReservationTenantScope,
    input: WaitlistEntryInput,
  ): Promise<ReservationRecord | null> {
    const waitlistCount = await prisma.reservation.count({
      where: {
        ...scopeWhere(scope),
        status: "PENDING",
        notes: { contains: RESERVATION_STATUSES.WAITLISTED },
      },
    });

    const existing = await prisma.reservation.findFirst({
      where: { id: input.reservationId, ...scopeWhere(scope) },
    });

    if (!existing) {
      return null;
    }

    const { guestNotes, meta } = splitReservationNotes(existing.notes);
    const priority = input.priority ?? defaultWaitlistPriority(meta.isVip ?? false, input.partySize);
    const waitlist = createWaitlistEntry(
      input.reservationId,
      input.branchId ?? scope.branchId,
      input.partySize,
      priority,
      input.quotedWaitMinutes ?? 20,
      waitlistCount + 1,
    );

    const nextMeta = appendTimelineEvent(
      { ...meta, waitlist, domainStatus: RESERVATION_STATUSES.WAITLISTED },
      {
        reservationId: input.reservationId,
        type: RESERVATION_TIMELINE_EVENT_TYPES.WAITLISTED,
        timestamp: new Date().toISOString(),
        actorId: scope.userId,
        payload: { position: waitlist.position },
      },
    );

    const reservation = await prisma.reservation.update({
      where: { id: input.reservationId },
      data: {
        status: "PENDING",
        notes: composeReservationNotes(guestNotes, nextMeta),
      },
      include: reservationInclude,
    });

    return mapReservationToRecord(reservation, scope);
  }

  async listWaitlist(scope: ReservationTenantScope): Promise<ReservationRecord[]> {
    const result = await this.search(scope, {
      status: RESERVATION_STATUSES.WAITLISTED,
      pageSize: 100,
    });
    return result.records;
  }

  async archive(scope: ReservationTenantScope, reservationId: string): Promise<ReservationRecord | null> {
    const existing = await prisma.reservation.findFirst({
      where: { id: reservationId, ...scopeWhere(scope) },
    });

    if (!existing) {
      return null;
    }

    const { guestNotes, meta } = splitReservationNotes(existing.notes);
    const reservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        notes: composeReservationNotes(guestNotes, {
          ...meta,
          archived: true,
          archivedAt: new Date().toISOString(),
        }),
      },
      include: reservationInclude,
    });

    return mapReservationToRecord(reservation, scope);
  }

  async restore(scope: ReservationTenantScope, reservationId: string): Promise<ReservationRecord | null> {
    const existing = await prisma.reservation.findFirst({
      where: { id: reservationId, ...scopeWhere(scope) },
    });

    if (!existing) {
      return null;
    }

    const { guestNotes, meta } = splitReservationNotes(existing.notes);
    const reservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        notes: composeReservationNotes(guestNotes, {
          ...meta,
          archived: false,
          archivedAt: undefined,
        }),
      },
      include: reservationInclude,
    });

    return mapReservationToRecord(reservation, scope);
  }

  async deleteHard(scope: ReservationTenantScope, reservationId: string): Promise<boolean> {
    const result = await prisma.reservation.deleteMany({
      where: { id: reservationId, ...scopeWhere(scope) },
    });
    return result.count > 0;
  }

  async bulkUpdate(
    scope: ReservationTenantScope,
    input: BulkUpdateReservationsSchemaInput,
  ): Promise<number> {
    let updated = 0;

    for (const reservationId of input.reservationIds) {
      const record = await this.update(scope, {
        reservationId,
        status: input.status,
        tableId: input.tableId,
      });
      if (record) {
        updated += 1;
      }
    }

    return updated;
  }

  async mergeReservations(
    scope: ReservationTenantScope,
    input: MergeReservationsSchemaInput,
  ): Promise<ReservationRecord | null> {
    const target = await this.findById(scope, input.targetReservationId);
    if (!target) {
      return null;
    }

    const existing = await prisma.reservation.findFirst({
      where: { id: input.targetReservationId, ...scopeWhere(scope) },
    });

    if (!existing) {
      return null;
    }

    const { guestNotes, meta } = splitReservationNotes(existing.notes);
    const mergedReservationIds = [
      ...(meta.mergedReservationIds ?? []),
      ...input.sourceReservationIds,
    ];

    for (const sourceId of input.sourceReservationIds) {
      await this.cancel(scope, {
        reservationId: sourceId,
        reason: `Merged into ${target.reservation.confirmationCode}`,
        cancelledBy: scope.userId,
      });
    }

    const reservation = await prisma.reservation.update({
      where: { id: input.targetReservationId },
      data: {
        notes: composeReservationNotes(guestNotes, {
          ...meta,
          mergedReservationIds,
          isGroupBooking: true,
        }),
        partySize: target.reservation.partySize,
      },
      include: reservationInclude,
    });

    return mapReservationToRecord(reservation, scope);
  }

  async addNote(
    scope: ReservationTenantScope,
    input: AddReservationNoteSchemaInput,
  ): Promise<ReservationRecord | null> {
    const existing = await prisma.reservation.findFirst({
      where: { id: input.reservationId, ...scopeWhere(scope) },
    });

    if (!existing) {
      return null;
    }

    const { guestNotes, meta } = splitReservationNotes(existing.notes);
    const note = {
      id: `${input.reservationId}-note-${Date.now()}`,
      reservationId: input.reservationId,
      authorId: scope.userId,
      body: input.body,
      isInternal: input.isInternal ?? true,
      createdAt: new Date().toISOString(),
    };

    const nextMeta = appendTimelineEvent(
      { ...meta, notes: [...(meta.notes ?? []), note] },
      {
        reservationId: input.reservationId,
        type: RESERVATION_TIMELINE_EVENT_TYPES.NOTE_ADDED,
        timestamp: note.createdAt,
        actorId: scope.userId,
        payload: { noteId: note.id },
      },
    );

    const reservation = await prisma.reservation.update({
      where: { id: input.reservationId },
      data: { notes: composeReservationNotes(guestNotes, nextMeta) },
      include: reservationInclude,
    });

    return mapReservationToRecord(reservation, scope);
  }

  async addTag(
    scope: ReservationTenantScope,
    input: AddReservationTagSchemaInput,
  ): Promise<ReservationRecord | null> {
    const existing = await prisma.reservation.findFirst({
      where: { id: input.reservationId, ...scopeWhere(scope) },
    });

    if (!existing) {
      return null;
    }

    const { guestNotes, meta } = splitReservationNotes(existing.notes);
    const tag = createTag(input.reservationId, input.label);
    const reservation = await prisma.reservation.update({
      where: { id: input.reservationId },
      data: {
        notes: composeReservationNotes(guestNotes, {
          ...meta,
          tags: [...(meta.tags ?? []), tag],
        }),
      },
      include: reservationInclude,
    });

    return mapReservationToRecord(reservation, scope);
  }

  async listTimeSlots(scope: ReservationTenantScope, date: string): Promise<ReservationTimeSlot[]> {
    const reservations = await prisma.reservation.findMany({
      where: {
        ...scopeWhere(scope),
        reservationDate: normalizeReservationDate(date),
        status: { in: ["PENDING", "CONFIRMED", "SEATED"] },
      },
      select: { startTime: true, endTime: true, partySize: true },
    });

    const slots: ReservationTimeSlot[] = [];
    for (let hour = 11; hour <= 22; hour += 1) {
      const startTime = `${String(hour).padStart(2, "0")}:00`;
      const endTime = `${String(hour + 1).padStart(2, "0")}:00`;
      const bookedCovers = reservations
        .filter((reservation) => reservation.startTime === startTime)
        .reduce((sum, reservation) => sum + reservation.partySize, 0);

      slots.push({
        id: `${scope.branchId}-${date}-${startTime}`,
        branchId: scope.branchId,
        date,
        startTime,
        endTime,
        maxCovers: 80,
        bookedCovers,
        isBlocked: false,
      });
    }

    return slots;
  }
}

export const reservationRepository = new ReservationRepository();
