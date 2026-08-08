import type {
  Prisma,
  Reservation,
  ReservationSource as PrismaReservationSource,
  ReservationStatus as PrismaReservationStatus,
  RestaurantTable,
  Staff,
} from "@prisma/client";

import {
  CONFIRMATION_CHANNELS,
  RESERVATION_SOURCES,
  RESERVATION_STATUSES,
  RESERVATION_TIMELINE_EVENT_TYPES,
  WAITLIST_PRIORITIES,
  type ReservationSource,
  type ReservationStatus,
  type ReservationTimelineEventType,
  type WaitlistPriority,
} from "@/modules/reservations/constants/reservation-status";
import type { ReservationTenantScope } from "@/modules/reservations/lib/reservation-scope";
import type {
  ReservationAiContext,
  ReservationAnalytics,
  ReservationAssignment,
  ReservationCancellation,
  ReservationContact,
  ReservationGuest,
  ReservationNote,
  ReservationRecord,
  ReservationSeating,
  ReservationSourceMeta,
  ReservationTag,
  ReservationTimelineEvent,
  ReservationWaitlist,
} from "@/modules/reservations/types/reservations";

export const RESERVATION_META_DELIMITER = "\n---BUSAL_RESERVATION_META---\n";

export interface StoredReservationMeta {
  archived?: boolean;
  archivedAt?: string;
  domainStatus?: ReservationStatus;
  isVip?: boolean;
  isGroupBooking?: boolean;
  durationMinutes?: number;
  floorId?: string | null;
  tags?: ReservationTag[];
  notes?: ReservationNote[];
  timeline?: ReservationTimelineEvent[];
  waitlist?: ReservationWaitlist | null;
  assignment?: ReservationAssignment | null;
  cancellation?: ReservationCancellation | null;
  mergedReservationIds?: string[];
  internalNotes?: string | null;
}

export type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: {
    createdByStaff: { select: { id: true; firstName: true; lastName: true } };
    restaurantTable: { include: { floor: true } };
    assignedStaff: { select: { id: true; firstName: true; lastName: true } };
  };
}>;

export interface ClientReservationData {
  id: string;
  businessId: string;
  branchId: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  reservationNumber: string;
  reservationDate: Date;
  startTime: string;
  endTime: string;
  partySize: number;
  status: PrismaReservationStatus;
  notes: string | null;
  source: PrismaReservationSource;
  createdByStaffId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdByStaff: { id: string; firstName: string; lastName: string } | null;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function splitReservationNotes(raw: string | null): {
  guestNotes: string | null;
  meta: StoredReservationMeta;
} {
  if (!raw) {
    return { guestNotes: null, meta: {} };
  }

  const delimiterIndex = raw.indexOf(RESERVATION_META_DELIMITER);
  if (delimiterIndex === -1) {
    return { guestNotes: raw, meta: {} };
  }

  const guestNotes = raw.slice(0, delimiterIndex).trim() || null;
  const metaRaw = raw.slice(delimiterIndex + RESERVATION_META_DELIMITER.length).trim();

  try {
    const parsed = JSON.parse(metaRaw) as StoredReservationMeta;
    return { guestNotes, meta: parsed };
  } catch {
    return { guestNotes: raw, meta: {} };
  }
}

export function composeReservationNotes(
  guestNotes: string | null,
  meta: StoredReservationMeta,
): string | null {
  const hasMeta =
    meta.archived ||
    meta.domainStatus ||
    meta.isVip ||
    meta.isGroupBooking ||
    (meta.tags?.length ?? 0) > 0 ||
    (meta.notes?.length ?? 0) > 0 ||
    (meta.timeline?.length ?? 0) > 0 ||
    meta.waitlist ||
    meta.assignment ||
    meta.cancellation ||
    (meta.mergedReservationIds?.length ?? 0) > 0 ||
    meta.internalNotes;

  if (!guestNotes && !hasMeta) {
    return null;
  }

  if (!hasMeta) {
    return guestNotes;
  }

  const prefix = guestNotes ?? "";
  return `${prefix}${RESERVATION_META_DELIMITER}${JSON.stringify(meta)}`;
}

export function mapPrismaSourceToDomain(source: PrismaReservationSource): ReservationSource {
  switch (source) {
    case "WEBSITE":
      return RESERVATION_SOURCES.WEBSITE;
    case "WALK_IN":
      return RESERVATION_SOURCES.WALK_IN;
    case "QR":
      return RESERVATION_SOURCES.QR;
    case "GOOGLE":
      return RESERVATION_SOURCES.GOOGLE;
    case "FACEBOOK":
      return RESERVATION_SOURCES.FACEBOOK;
    case "INSTAGRAM":
      return RESERVATION_SOURCES.INSTAGRAM;
    case "ADMIN":
      return RESERVATION_SOURCES.STAFF;
    case "OTHER":
      return RESERVATION_SOURCES.WHATSAPP;
    case "PHONE":
    default:
      return RESERVATION_SOURCES.PHONE;
  }
}

export function mapDomainSourceToPrisma(source: ReservationSource): PrismaReservationSource {
  switch (source) {
    case RESERVATION_SOURCES.WEBSITE:
      return "WEBSITE";
    case RESERVATION_SOURCES.WALK_IN:
      return "WALK_IN";
    case RESERVATION_SOURCES.QR:
      return "QR";
    case RESERVATION_SOURCES.GOOGLE:
      return "GOOGLE";
    case RESERVATION_SOURCES.FACEBOOK:
      return "FACEBOOK";
    case RESERVATION_SOURCES.INSTAGRAM:
      return "INSTAGRAM";
    case RESERVATION_SOURCES.STAFF:
    case RESERVATION_SOURCES.MOBILE_APP:
      return "ADMIN";
    case RESERVATION_SOURCES.WHATSAPP:
      return "OTHER";
    case RESERVATION_SOURCES.PHONE:
    default:
      return "PHONE";
  }
}

export function mapPrismaStatusToDomain(
  status: PrismaReservationStatus,
  meta: StoredReservationMeta,
  checkInTime: Date | null,
): ReservationStatus {
  if (meta.domainStatus) {
    return meta.domainStatus;
  }

  if (checkInTime && status === "CONFIRMED") {
    return RESERVATION_STATUSES.CHECKED_IN;
  }

  switch (status) {
    case "PENDING":
      return RESERVATION_STATUSES.PENDING;
    case "CONFIRMED":
      return RESERVATION_STATUSES.CONFIRMED;
    case "SEATED":
      return RESERVATION_STATUSES.SEATED;
    case "COMPLETED":
      return RESERVATION_STATUSES.COMPLETED;
    case "CANCELLED":
      return RESERVATION_STATUSES.CANCELLED;
    case "NO_SHOW":
      return RESERVATION_STATUSES.NO_SHOW;
    default:
      return RESERVATION_STATUSES.PENDING;
  }
}

export function mapDomainStatusToPrisma(status: ReservationStatus): PrismaReservationStatus {
  switch (status) {
    case RESERVATION_STATUSES.CONFIRMED:
    case RESERVATION_STATUSES.CHECKED_IN:
      return "CONFIRMED";
    case RESERVATION_STATUSES.SEATED:
      return "SEATED";
    case RESERVATION_STATUSES.COMPLETED:
      return "COMPLETED";
    case RESERVATION_STATUSES.CANCELLED:
      return "CANCELLED";
    case RESERVATION_STATUSES.NO_SHOW:
      return "NO_SHOW";
    case RESERVATION_STATUSES.WAITLISTED:
    case RESERVATION_STATUSES.PENDING:
    default:
      return "PENDING";
  }
}

function parseGuestName(guestName: string): { firstName: string; lastName: string } {
  const parts = guestName.trim().split(/\s+/);
  const firstName = parts[0] ?? "Guest";
  const lastName = parts.slice(1).join(" ") || "Guest";
  return { firstName, lastName };
}

function computeDurationMinutes(startTime: string, endTime: string): number {
  const [startHour = 0, startMinute = 0] = startTime.split(":").map(Number);
  const [endHour = 0, endMinute = 0] = endTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  return Math.max(60, end - start);
}

function buildDefaultTimeline(
  reservation: Reservation,
  meta: StoredReservationMeta,
  actorId: string | null,
): ReservationTimelineEvent[] {
  if (meta.timeline?.length) {
    return meta.timeline;
  }

  return [
    {
      id: `${reservation.id}-created`,
      reservationId: reservation.id,
      type: RESERVATION_TIMELINE_EVENT_TYPES.CREATED,
      timestamp: reservation.createdAt.toISOString(),
      actorId,
      payload: {},
    },
  ];
}

function buildAnalytics(
  reservation: Reservation,
  meta: StoredReservationMeta,
): ReservationAnalytics {
  const leadTimeHours = Math.max(
    1,
    Math.round(
      (reservation.reservationDate.getTime() - reservation.createdAt.getTime()) / (1000 * 60 * 60),
    ),
  );
  const noShowProbability = meta.isVip ? 0.08 : reservation.status === "CONFIRMED" ? 0.18 : 0.12;

  return {
    reservationId: reservation.id,
    noShowProbability,
    leadTimeHours,
    tableTurnoverMinutes: computeDurationMinutes(reservation.startTime, reservation.endTime),
    revenueEstimatePence: reservation.partySize * 2800,
    lifetimeGuestValuePence: meta.isVip ? 120000 : 0,
  };
}

function buildAiContext(
  reservation: Reservation,
  meta: StoredReservationMeta,
  analytics: ReservationAnalytics,
  tableIds: string[],
): ReservationAiContext {
  const { firstName, lastName } = parseGuestName(reservation.guestName);

  return {
    reservationId: reservation.id,
    summary: `${firstName} ${lastName} · party of ${reservation.partySize}`,
    insights: [
      meta.isVip ? "VIP guest" : "Standard guest",
      `Lead time ${analytics.leadTimeHours}h`,
    ],
    recommendedActions: tableIds.length > 0 ? ["Assign suggested table"] : ["Hold table assignment"],
    suggestedTableIds: tableIds,
    noShowRiskScore: analytics.noShowProbability,
    lastGeneratedAt: new Date().toISOString(),
  };
}

function resolveTableId(reservation: ReservationWithRelations): string | null {
  return reservation.restaurantTableId ?? reservation.legacyTableId ?? null;
}

function resolveFloorId(
  reservation: ReservationWithRelations,
  meta: StoredReservationMeta,
): string | null {
  if (meta.floorId) {
    return meta.floorId;
  }

  return reservation.restaurantTable?.floorId ?? null;
}

export function mapReservationToRecord(
  reservation: ReservationWithRelations,
  scope: ReservationTenantScope,
): ReservationRecord {
  const { guestNotes, meta } = splitReservationNotes(reservation.notes);
  const domainStatus = mapPrismaStatusToDomain(
    reservation.status,
    meta,
    reservation.checkInTime,
  );
  const tableId = resolveTableId(reservation);
  const floorId = resolveFloorId(reservation, meta);
  const { firstName, lastName } = parseGuestName(reservation.guestName);
  const timeline = buildDefaultTimeline(reservation, meta, reservation.createdByStaffId);
  const analytics = buildAnalytics(reservation, meta);
  const tableIds = tableId ? [tableId] : [];

  const seating: ReservationSeating = {
    reservationId: reservation.id,
    preferredZoneId: null,
    preferredTableId: null,
    assignedTableId: tableId,
    assignedAt: meta.assignment?.assignedAt ?? (tableId ? reservation.updatedAt.toISOString() : null),
    seatedAt: reservation.status === "SEATED" ? reservation.checkInTime?.toISOString() ?? null : null,
    autoSuggestEnabled: true,
  };

  return {
    reservation: {
      id: reservation.id,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      businessId: reservation.businessId,
      branchId: reservation.branchId,
      confirmationCode: reservation.reservationNumber,
      status: domainStatus,
      source: mapPrismaSourceToDomain(reservation.source),
      partySize: reservation.partySize,
      scheduledDate: reservation.reservationDate.toISOString().slice(0, 10),
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      durationMinutes:
        meta.durationMinutes ?? computeDurationMinutes(reservation.startTime, reservation.endTime),
      isVip: meta.isVip ?? false,
      isGroupBooking: meta.isGroupBooking ?? reservation.partySize >= 8,
      isRecurring: false,
      recurringSeriesId: null,
      specialRequests: reservation.specialRequests,
      internalNotes: meta.internalNotes ?? null,
      tableId,
      floorId,
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
    },
    guest: {
      id: `${reservation.id}-guest`,
      reservationId: reservation.id,
      customerId: reservation.customerId,
      firstName,
      lastName,
      email: reservation.guestEmail,
      phone: reservation.guestPhone,
      isPrimary: true,
      dietaryPreferences: [],
      seatingPreferences: meta.isVip ? ["window", "quiet"] : [],
      visitCount: meta.isVip ? 8 : 1,
      loyaltyTier: meta.isVip ? "gold" : null,
    },
    contact: {
      reservationId: reservation.id,
      email: reservation.guestEmail,
      phone: reservation.guestPhone,
      preferredChannel: CONFIRMATION_CHANNELS.EMAIL,
      locale: "en-GB",
    },
    seating,
    tags: meta.tags ?? [],
    notes: meta.notes ?? [],
    timeline,
    waitlist: meta.waitlist ?? null,
    assignment: meta.assignment ?? null,
    confirmation: null,
    reminders: [],
    cancellation: meta.cancellation ?? null,
    sourceMeta: {
      reservationId: reservation.id,
      source: mapPrismaSourceToDomain(reservation.source),
      campaignId: null,
      referrerUrl: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
    },
    analytics,
    aiContext: buildAiContext(reservation, meta, analytics, tableIds),
  };
}

export function mapReservationToClient(
  reservation: ReservationWithRelations,
): ClientReservationData {
  const { guestNotes } = splitReservationNotes(reservation.notes);

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
    notes: guestNotes,
    source: reservation.source,
    createdByStaffId: reservation.createdByStaffId,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
    createdByStaff: reservation.createdByStaff,
  };
}

export function appendTimelineEvent(
  meta: StoredReservationMeta,
  event: Omit<ReservationTimelineEvent, "id"> & { id?: string },
): StoredReservationMeta {
  const timeline = meta.timeline ?? [];
  return {
    ...meta,
    timeline: [
      ...timeline,
      {
        id: event.id ?? `${event.reservationId}-${event.type}-${Date.now()}`,
        reservationId: event.reservationId,
        type: event.type,
        timestamp: event.timestamp,
        actorId: event.actorId,
        payload: event.payload,
      },
    ],
  };
}

export function mapTimelineTypeForStatus(status: ReservationStatus): ReservationTimelineEventType {
  switch (status) {
    case RESERVATION_STATUSES.CONFIRMED:
      return RESERVATION_TIMELINE_EVENT_TYPES.CONFIRMED;
    case RESERVATION_STATUSES.CHECKED_IN:
      return RESERVATION_TIMELINE_EVENT_TYPES.CHECKED_IN;
    case RESERVATION_STATUSES.SEATED:
      return RESERVATION_TIMELINE_EVENT_TYPES.SEATED;
    case RESERVATION_STATUSES.COMPLETED:
      return RESERVATION_TIMELINE_EVENT_TYPES.COMPLETED;
    case RESERVATION_STATUSES.CANCELLED:
      return RESERVATION_TIMELINE_EVENT_TYPES.CANCELLED;
    case RESERVATION_STATUSES.NO_SHOW:
      return RESERVATION_TIMELINE_EVENT_TYPES.NO_SHOW;
    case RESERVATION_STATUSES.WAITLISTED:
      return RESERVATION_TIMELINE_EVENT_TYPES.WAITLISTED;
    default:
      return RESERVATION_TIMELINE_EVENT_TYPES.UPDATED;
  }
}

export function resolveGuestName(input: {
  guestFirstName?: string;
  guestLastName?: string;
  customerName?: string;
}): string {
  if (input.customerName?.trim()) {
    return input.customerName.trim();
  }

  const first = input.guestFirstName?.trim() ?? "Guest";
  const last = input.guestLastName?.trim();
  return last ? `${first} ${last}` : first;
}

export function normalizeReservationDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid reservation date");
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function createTag(reservationId: string, label: string): ReservationTag {
  return {
    id: `${reservationId}-tag-${slugify(label)}`,
    reservationId,
    label,
    slug: slugify(label),
  };
}

export function createWaitlistEntry(
  reservationId: string,
  branchId: string,
  partySize: number,
  priority: WaitlistPriority,
  quotedWaitMinutes: number,
  position: number,
): ReservationWaitlist {
  return {
    id: `${reservationId}-waitlist`,
    reservationId,
    branchId,
    partySize,
    priority,
    quotedWaitMinutes,
    position,
    joinedAt: new Date().toISOString(),
    notifiedAt: null,
  };
}

export function defaultWaitlistPriority(isVip: boolean, partySize: number): WaitlistPriority {
  if (isVip) {
    return WAITLIST_PRIORITIES.VIP;
  }
  if (partySize >= 8) {
    return WAITLIST_PRIORITIES.GROUP;
  }
  return WAITLIST_PRIORITIES.STANDARD;
}

export type { RestaurantTable, Staff };
