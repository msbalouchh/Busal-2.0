import {
  RESERVATION_STATUSES,
  RESERVATION_TIMELINE_EVENT_TYPES,
  WAITLIST_PRIORITIES,
} from "@/modules/reservations/constants/reservation-status";
import {
  DEFAULT_RESERVATION_SCOPE,
  MOCK_RESERVATION_RECORDS,
  MOCK_TIME_SLOTS,
} from "@/modules/reservations/constants/mock-data";
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

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateConfirmationCode(): string {
  return `HK-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** In-memory reservation repository (mock only, no backend). */
export class ReservationRepository {
  private records: ReservationRecord[] = structuredClone(MOCK_RESERVATION_RECORDS);
  private timeSlots: ReservationTimeSlot[] = structuredClone(MOCK_TIME_SLOTS);

  listReservations(): ReservationRecord[] {
    return structuredClone(this.records);
  }

  listTimeSlots(): ReservationTimeSlot[] {
    return structuredClone(this.timeSlots);
  }

  findById(reservationId: string): ReservationRecord | undefined {
    return this.records.find((record) => record.reservation.id === reservationId);
  }

  search(query: ReservationSearchQuery = {}): ReservationRecord[] {
    let results = this.listReservations();

    if (query.tenantId) {
      results = results.filter((r) => r.reservation.tenantId === query.tenantId);
    }

    if (query.businessId) {
      results = results.filter((r) => r.reservation.businessId === query.businessId);
    }

    if (query.branchId) {
      results = results.filter((r) => r.reservation.branchId === query.branchId);
    }

    if (query.status) {
      results = results.filter((r) => r.reservation.status === query.status);
    }

    if (query.source) {
      results = results.filter((r) => r.reservation.source === query.source);
    }

    if (query.date) {
      results = results.filter((r) => r.reservation.scheduledDate === query.date);
    }

    if (query.fromDate) {
      results = results.filter((r) => r.reservation.scheduledDate >= query.fromDate!);
    }

    if (query.toDate) {
      results = results.filter((r) => r.reservation.scheduledDate <= query.toDate!);
    }

    if (query.partySizeMin) {
      results = results.filter((r) => r.reservation.partySize >= query.partySizeMin!);
    }

    if (query.isVip !== undefined) {
      results = results.filter((r) => r.reservation.isVip === query.isVip);
    }

    if (query.query) {
      const normalized = query.query.toLowerCase();
      results = results.filter((r) => {
        const haystack = [
          r.reservation.confirmationCode,
          r.guest.firstName,
          r.guest.lastName,
          r.guest.email ?? "",
          r.guest.phone ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalized);
      });
    }

    const limit = query.limit ?? results.length;
    return structuredClone(results.slice(0, limit));
  }

  create(input: CreateReservationInput): ReservationRecord {
    const id = createId("res");
    const now = new Date().toISOString();
    const duration = input.durationMinutes ?? 120;
    const startHour = parseInt(input.startTime.split(":")[0] ?? "19", 10);
    const endTime = `${String(startHour + Math.floor(duration / 60)).padStart(2, "0")}:00`;

    const record: ReservationRecord = {
      reservation: {
        id,
        tenantId: DEFAULT_RESERVATION_SCOPE.tenantId,
        workspaceId: DEFAULT_RESERVATION_SCOPE.workspaceId,
        businessId: DEFAULT_RESERVATION_SCOPE.businessId,
        branchId: input.branchId,
        confirmationCode: generateConfirmationCode(),
        status: RESERVATION_STATUSES.PENDING,
        source: input.source ?? "website",
        partySize: input.partySize,
        scheduledDate: input.scheduledDate,
        startTime: input.startTime,
        endTime,
        durationMinutes: duration,
        isVip: input.isVip ?? false,
        isGroupBooking: input.partySize >= 8,
        isRecurring: false,
        recurringSeriesId: null,
        specialRequests: input.specialRequests ?? null,
        internalNotes: null,
        tableId: input.tableId ?? null,
        floorId: input.tableId ? "floor-main" : null,
        createdAt: now,
        updatedAt: now,
      },
      guest: {
        id: `${id}-guest`,
        reservationId: id,
        customerId: null,
        firstName: input.guestFirstName,
        lastName: input.guestLastName,
        email: input.guestEmail ?? null,
        phone: input.guestPhone ?? null,
        isPrimary: true,
        dietaryPreferences: [],
        seatingPreferences: [],
        visitCount: 0,
        loyaltyTier: null,
      },
      contact: {
        reservationId: id,
        email: input.guestEmail ?? null,
        phone: input.guestPhone ?? null,
        preferredChannel: "email",
        locale: "en-GB",
      },
      seating: {
        reservationId: id,
        preferredZoneId: null,
        preferredTableId: null,
        assignedTableId: input.tableId ?? null,
        assignedAt: input.tableId ? now : null,
        seatedAt: null,
        autoSuggestEnabled: true,
      },
      tags: [],
      notes: [],
      timeline: [
        {
          id: `${id}-tl-create`,
          reservationId: id,
          type: RESERVATION_TIMELINE_EVENT_TYPES.CREATED,
          timestamp: now,
          actorId: DEFAULT_RESERVATION_SCOPE.userId,
          payload: {},
        },
      ],
      waitlist: null,
      assignment: null,
      confirmation: null,
      reminders: [],
      cancellation: null,
      sourceMeta: {
        reservationId: id,
        source: input.source ?? "website",
        campaignId: null,
        referrerUrl: null,
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
      },
      analytics: {
        reservationId: id,
        noShowProbability: 0.15,
        leadTimeHours: 24,
        tableTurnoverMinutes: null,
        revenueEstimatePence: input.partySize * 2800,
        lifetimeGuestValuePence: 0,
      },
      aiContext: {
        reservationId: id,
        summary: `${input.guestFirstName} ${input.guestLastName} · party of ${input.partySize}`,
        insights: ["New reservation — no historical data"],
        recommendedActions: ["Send confirmation", "Assign table"],
        suggestedTableIds: [],
        noShowRiskScore: 0.15,
        lastGeneratedAt: now,
      },
    };

    this.records.push(record);
    return structuredClone(record);
  }

  update(input: UpdateReservationInput): ReservationRecord | undefined {
    const record = this.findById(input.reservationId);
    if (!record) return undefined;

    const now = new Date().toISOString();
    if (input.status !== undefined) record.reservation.status = input.status;
    if (input.partySize !== undefined) record.reservation.partySize = input.partySize;
    if (input.scheduledDate !== undefined) record.reservation.scheduledDate = input.scheduledDate;
    if (input.startTime !== undefined) record.reservation.startTime = input.startTime;
    if (input.specialRequests !== undefined) {
      record.reservation.specialRequests = input.specialRequests;
    }
    if (input.tableId !== undefined) {
      record.reservation.tableId = input.tableId;
      record.seating.assignedTableId = input.tableId;
      record.seating.assignedAt = input.tableId ? now : null;
    }
    record.reservation.updatedAt = now;
    record.timeline.push({
      id: `${input.reservationId}-tl-update-${now}`,
      reservationId: input.reservationId,
      type: RESERVATION_TIMELINE_EVENT_TYPES.UPDATED,
      timestamp: now,
      actorId: DEFAULT_RESERVATION_SCOPE.userId,
      payload: { fields: Object.keys(input).filter((k) => k !== "reservationId") },
    });

    return structuredClone(record);
  }

  cancel(input: CancelReservationInput): ReservationRecord | undefined {
    const record = this.findById(input.reservationId);
    if (!record) return undefined;

    const now = new Date().toISOString();
    record.reservation.status = RESERVATION_STATUSES.CANCELLED;
    record.reservation.updatedAt = now;
    record.cancellation = {
      id: `${input.reservationId}-cancel`,
      reservationId: input.reservationId,
      reason: input.reason,
      cancelledBy: input.cancelledBy ?? DEFAULT_RESERVATION_SCOPE.userId,
      cancelledAt: now,
      refundEligible: true,
    };
    record.timeline.push({
      id: `${input.reservationId}-tl-cancel`,
      reservationId: input.reservationId,
      type: RESERVATION_TIMELINE_EVENT_TYPES.CANCELLED,
      timestamp: now,
      actorId: input.cancelledBy ?? DEFAULT_RESERVATION_SCOPE.userId,
      payload: { reason: input.reason },
    });

    return structuredClone(record);
  }

  assignTable(input: AssignTableInput): ReservationRecord | undefined {
    const record = this.findById(input.reservationId);
    if (!record) return undefined;

    const now = new Date().toISOString();
    record.reservation.tableId = input.tableId;
    record.reservation.floorId = input.floorId;
    record.reservation.status = RESERVATION_STATUSES.CONFIRMED;
    record.seating.assignedTableId = input.tableId;
    record.seating.assignedAt = now;
    record.assignment = {
      id: `${input.reservationId}-assign-${now}`,
      reservationId: input.reservationId,
      tableId: input.tableId,
      floorId: input.floorId,
      assignedBy: input.assignedBy ?? DEFAULT_RESERVATION_SCOPE.userId,
      assignedAt: now,
      isAutoSuggested: input.isAutoSuggested ?? false,
    };
    record.timeline.push({
      id: `${input.reservationId}-tl-assign`,
      reservationId: input.reservationId,
      type: RESERVATION_TIMELINE_EVENT_TYPES.TABLE_ASSIGNED,
      timestamp: now,
      actorId: input.assignedBy ?? DEFAULT_RESERVATION_SCOPE.userId,
      payload: { tableId: input.tableId },
    });

    return structuredClone(record);
  }

  addToWaitlist(input: WaitlistEntryInput): ReservationRecord | undefined {
    const record = this.findById(input.reservationId);
    if (!record) return undefined;

    const now = new Date().toISOString();
    const waitlistCount = this.records.filter((r) => r.waitlist !== null).length;

    record.reservation.status = RESERVATION_STATUSES.WAITLISTED;
    record.waitlist = {
      id: `${input.reservationId}-waitlist`,
      reservationId: input.reservationId,
      branchId: input.branchId,
      partySize: input.partySize,
      priority: input.priority ?? WAITLIST_PRIORITIES.STANDARD,
      quotedWaitMinutes: input.quotedWaitMinutes ?? 20,
      position: waitlistCount + 1,
      joinedAt: now,
      notifiedAt: null,
    };
    record.timeline.push({
      id: `${input.reservationId}-tl-waitlist`,
      reservationId: input.reservationId,
      type: RESERVATION_TIMELINE_EVENT_TYPES.WAITLISTED,
      timestamp: now,
      actorId: DEFAULT_RESERVATION_SCOPE.userId,
      payload: { position: record.waitlist.position },
    });

    return structuredClone(record);
  }

  listWaitlist(branchId?: string): ReservationRecord[] {
    return this.search({
      branchId,
      status: RESERVATION_STATUSES.WAITLISTED,
    });
  }
}

export const reservationRepository = new ReservationRepository();
