import {
  CONFIRMATION_CHANNELS,
  RESERVATION_SOURCES,
  RESERVATION_STATUSES,
  RESERVATION_TIMELINE_EVENT_TYPES,
  WAITLIST_PRIORITIES,
} from "@/modules/reservations/constants/reservation-status";
import type { ReservationRecord } from "@/modules/reservations/types/reservations";

export const DEFAULT_RESERVATION_SCOPE = {
  tenantId: "tenant-harbour",
  workspaceId: "ws-harbour-kitchen",
  businessId: "biz-harbour-kitchen",
  branchId: "branch-harbour-main",
  userId: "user-harbour-owner",
} as const;

function buildReservation(partial: {
  id: string;
  confirmationCode: string;
  status: (typeof RESERVATION_STATUSES)[keyof typeof RESERVATION_STATUSES];
  source: (typeof RESERVATION_SOURCES)[keyof typeof RESERVATION_SOURCES];
  partySize: number;
  scheduledDate: string;
  startTime: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail?: string;
  guestPhone?: string;
  isVip?: boolean;
  isGroupBooking?: boolean;
  specialRequests?: string;
  tableId?: string | null;
  noShowRisk?: number;
  waitlisted?: boolean;
}): ReservationRecord {
  const now = "2026-02-15T18:00:00.000Z";
  const endHour = parseInt(partial.startTime.split(":")[0] ?? "19", 10) + 2;

  return {
    reservation: {
      id: partial.id,
      tenantId: DEFAULT_RESERVATION_SCOPE.tenantId,
      workspaceId: DEFAULT_RESERVATION_SCOPE.workspaceId,
      businessId: DEFAULT_RESERVATION_SCOPE.businessId,
      branchId: DEFAULT_RESERVATION_SCOPE.branchId,
      confirmationCode: partial.confirmationCode,
      status: partial.status,
      source: partial.source,
      partySize: partial.partySize,
      scheduledDate: partial.scheduledDate,
      startTime: partial.startTime,
      endTime: `${String(endHour).padStart(2, "0")}:00`,
      durationMinutes: 120,
      isVip: partial.isVip ?? false,
      isGroupBooking: partial.isGroupBooking ?? false,
      isRecurring: false,
      recurringSeriesId: null,
      specialRequests: partial.specialRequests ?? null,
      internalNotes: null,
      tableId: partial.tableId ?? null,
      floorId: partial.tableId ? "floor-main" : null,
      createdAt: now,
      updatedAt: now,
    },
    guest: {
      id: `${partial.id}-guest`,
      reservationId: partial.id,
      customerId: null,
      firstName: partial.guestFirstName,
      lastName: partial.guestLastName,
      email: partial.guestEmail ?? null,
      phone: partial.guestPhone ?? null,
      isPrimary: true,
      dietaryPreferences: partial.specialRequests ? ["vegetarian"] : [],
      seatingPreferences: partial.isVip ? ["window", "quiet"] : [],
      visitCount: partial.isVip ? 12 : 2,
      loyaltyTier: partial.isVip ? "gold" : null,
    },
    contact: {
      reservationId: partial.id,
      email: partial.guestEmail ?? null,
      phone: partial.guestPhone ?? null,
      preferredChannel: CONFIRMATION_CHANNELS.EMAIL,
      locale: "en-GB",
    },
    seating: {
      reservationId: partial.id,
      preferredZoneId: partial.isVip ? "zone-vip" : null,
      preferredTableId: null,
      assignedTableId: partial.tableId ?? null,
      assignedAt: partial.tableId ? now : null,
      seatedAt: partial.status === RESERVATION_STATUSES.SEATED ? now : null,
      autoSuggestEnabled: true,
    },
    tags: partial.isVip
      ? [{ id: `${partial.id}-tag-vip`, reservationId: partial.id, label: "VIP", slug: "vip" }]
      : [],
    notes: [],
    timeline: [
      {
        id: `${partial.id}-tl-1`,
        reservationId: partial.id,
        type: RESERVATION_TIMELINE_EVENT_TYPES.CREATED,
        timestamp: now,
        actorId: DEFAULT_RESERVATION_SCOPE.userId,
        payload: { source: partial.source },
      },
    ],
    waitlist: partial.waitlisted
      ? {
          id: `${partial.id}-waitlist`,
          reservationId: partial.id,
          branchId: DEFAULT_RESERVATION_SCOPE.branchId,
          partySize: partial.partySize,
          priority: partial.isVip ? WAITLIST_PRIORITIES.VIP : WAITLIST_PRIORITIES.STANDARD,
          quotedWaitMinutes: 25,
          position: 2,
          joinedAt: now,
          notifiedAt: null,
        }
      : null,
    assignment: partial.tableId
      ? {
          id: `${partial.id}-assign`,
          reservationId: partial.id,
          tableId: partial.tableId,
          floorId: "floor-main",
          assignedBy: DEFAULT_RESERVATION_SCOPE.userId,
          assignedAt: now,
          isAutoSuggested: true,
        }
      : null,
    confirmation: {
      id: `${partial.id}-confirm`,
      reservationId: partial.id,
      channel: CONFIRMATION_CHANNELS.EMAIL,
      sentAt: now,
      status: "delivered",
      recipient: partial.guestEmail ?? partial.guestPhone ?? "",
    },
    reminders: [
      {
        id: `${partial.id}-reminder`,
        reservationId: partial.id,
        channel: CONFIRMATION_CHANNELS.SMS,
        scheduledAt: "2026-02-15T17:00:00.000Z",
        sentAt: null,
        status: "scheduled",
      },
    ],
    cancellation: null,
    sourceMeta: {
      reservationId: partial.id,
      source: partial.source,
      campaignId: null,
      referrerUrl: null,
      utmSource: partial.source,
      utmMedium: null,
      utmCampaign: null,
    },
    analytics: {
      reservationId: partial.id,
      noShowProbability: partial.noShowRisk ?? 0.12,
      leadTimeHours: 48,
      tableTurnoverMinutes: partial.status === RESERVATION_STATUSES.SEATED ? 95 : null,
      revenueEstimatePence: partial.partySize * 3200,
      lifetimeGuestValuePence: partial.isVip ? 125000 : 18000,
    },
    aiContext: {
      reservationId: partial.id,
      summary: `${partial.guestFirstName} ${partial.guestLastName} · party of ${partial.partySize} · ${partial.status}`,
      insights: [
        `Source: ${partial.source}`,
        partial.isVip ? "VIP guest — prioritize seating" : "Standard guest profile",
      ],
      recommendedActions:
        partial.status === RESERVATION_STATUSES.PENDING
          ? ["Send confirmation", "Assign table before service"]
          : ["Monitor arrival window"],
      suggestedTableIds: partial.tableId ? [partial.tableId] : ["tbl-101", "tbl-103"],
      noShowRiskScore: partial.noShowRisk ?? 0.12,
      lastGeneratedAt: now,
    },
  };
}

export const MOCK_RESERVATION_RECORDS: ReservationRecord[] = [
  buildReservation({
    id: "res-001",
    confirmationCode: "HK-8F2A",
    status: RESERVATION_STATUSES.CONFIRMED,
    source: RESERVATION_SOURCES.WEBSITE,
    partySize: 4,
    scheduledDate: "2026-02-15",
    startTime: "19:00",
    guestFirstName: "Sarah",
    guestLastName: "Chen",
    guestEmail: "sarah.chen@example.com",
    guestPhone: "+447700900123",
    tableId: "tbl-103",
  }),
  buildReservation({
    id: "res-002",
    confirmationCode: "HK-3B91",
    status: RESERVATION_STATUSES.SEATED,
    source: RESERVATION_SOURCES.PHONE,
    partySize: 2,
    scheduledDate: "2026-02-15",
    startTime: "18:30",
    guestFirstName: "James",
    guestLastName: "Okonkwo",
    guestEmail: "j.okonkwo@example.com",
    tableId: "tbl-102",
  }),
  buildReservation({
    id: "res-003",
    confirmationCode: "HK-VIP1",
    status: RESERVATION_STATUSES.CONFIRMED,
    source: RESERVATION_SOURCES.STAFF,
    partySize: 6,
    scheduledDate: "2026-02-15",
    startTime: "20:00",
    guestFirstName: "Elena",
    guestLastName: "Vasquez",
    guestEmail: "elena.v@example.com",
    isVip: true,
    specialRequests: "Anniversary — window table, champagne on arrival",
    tableId: "tbl-vip-1",
  }),
  buildReservation({
    id: "res-004",
    confirmationCode: "HK-WL02",
    status: RESERVATION_STATUSES.WAITLISTED,
    source: RESERVATION_SOURCES.WALK_IN,
    partySize: 3,
    scheduledDate: "2026-02-15",
    startTime: "19:30",
    guestFirstName: "Tom",
    guestLastName: "Brennan",
    guestPhone: "+447700900456",
    waitlisted: true,
  }),
  buildReservation({
    id: "res-005",
    confirmationCode: "HK-NS01",
    status: RESERVATION_STATUSES.NO_SHOW,
    source: RESERVATION_SOURCES.GOOGLE,
    partySize: 2,
    scheduledDate: "2026-02-14",
    startTime: "20:00",
    guestFirstName: "Alex",
    guestLastName: "Murray",
    guestEmail: "alex.m@example.com",
    noShowRisk: 0.78,
  }),
  buildReservation({
    id: "res-006",
    confirmationCode: "HK-IG22",
    status: RESERVATION_STATUSES.PENDING,
    source: RESERVATION_SOURCES.INSTAGRAM,
    partySize: 8,
    scheduledDate: "2026-02-16",
    startTime: "19:00",
    guestFirstName: "Group",
    guestLastName: "Booking",
    guestEmail: "events@example.com",
    isGroupBooking: true,
    specialRequests: "Shared starters, separate bills",
  }),
];

export const MOCK_RESERVATION_RECORD = MOCK_RESERVATION_RECORDS[0]!;

export const MOCK_TIME_SLOTS = [
  {
    id: "slot-1830",
    branchId: DEFAULT_RESERVATION_SCOPE.branchId,
    date: "2026-02-15",
    startTime: "18:30",
    endTime: "20:30",
    maxCovers: 48,
    bookedCovers: 32,
    isBlocked: false,
  },
  {
    id: "slot-1900",
    branchId: DEFAULT_RESERVATION_SCOPE.branchId,
    date: "2026-02-15",
    startTime: "19:00",
    endTime: "21:00",
    maxCovers: 48,
    bookedCovers: 44,
    isBlocked: false,
  },
  {
    id: "slot-2000",
    branchId: DEFAULT_RESERVATION_SCOPE.branchId,
    date: "2026-02-15",
    startTime: "20:00",
    endTime: "22:00",
    maxCovers: 48,
    bookedCovers: 48,
    isBlocked: true,
  },
];
