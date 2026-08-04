import { RESERVATION_STATUSES } from "@/modules/reservations/constants/reservation-status";
import { reservationService } from "@/modules/reservations/services/reservation.service";
import {
  buildReservationPlatformSnapshot,
  getUpcomingReservations,
} from "@/modules/reservations/services/reservation-platform.service";
import { getReservationSummary } from "@/modules/reservations/utils/reservation-selectors";
import type {
  ReservationAiContext,
  ReservationRecord,
} from "@/modules/reservations/types/reservations";

export function buildReservationAiContext(reservationId: string): ReservationAiContext | null {
  const record = reservationService.getById(reservationId);

  if (!record) {
    return null;
  }

  return {
    ...record.aiContext,
    summary: getReservationSummary(record),
    insights: [
      ...record.aiContext.insights,
      `No-show risk: ${(record.analytics.noShowProbability * 100).toFixed(0)}%`,
      `Source: ${record.reservation.source}`,
    ],
    lastGeneratedAt: new Date().toISOString(),
  };
}

export function recommendBestTable(reservationId: string): Record<string, unknown> | null {
  const record = reservationService.getById(reservationId);

  if (!record) {
    return null;
  }

  const { partySize, isVip } = record.reservation;
  const suggestions = record.aiContext.suggestedTableIds;

  return {
    reservationId,
    partySize,
    recommendations: suggestions.map((tableId) => ({
      tableId,
      rationale: isVip ? "VIP table match for premium guest" : `Fits party of ${partySize}`,
    })),
    autoSuggestEnabled: record.seating.autoSuggestEnabled,
  };
}

export function predictNoShows(limit = 5): Record<string, unknown> {
  const records = reservationService
    .search({ status: RESERVATION_STATUSES.CONFIRMED })
    .sort((a, b) => b.analytics.noShowProbability - a.analytics.noShowProbability)
    .slice(0, limit);

  return {
    count: records.length,
    reservations: records.map((record) => ({
      reservationId: record.reservation.id,
      confirmationCode: record.reservation.confirmationCode,
      guestName: `${record.guest.firstName} ${record.guest.lastName}`,
      noShowProbability: record.analytics.noShowProbability,
      scheduledDate: record.reservation.scheduledDate,
      startTime: record.reservation.startTime,
    })),
  };
}

export function optimizeSeatingForBranch(): Record<string, unknown> {
  const snapshot = buildReservationPlatformSnapshot();
  const upcoming = getUpcomingReservations(10);
  const unassigned = upcoming.filter((r) => !r.reservation.tableId);

  return {
    branchId: snapshot.context.branchId,
    totalReservations: snapshot.reservationCount,
    unassignedCount: unassigned.length,
    suggestions: [
      "Assign tables 30 minutes before service for confirmed parties",
      "Prioritize VIP arrivals in first seating window",
      "Hold two flexible tables for walk-in overflow",
    ],
    unassignedReservations: unassigned.map((r) => ({
      reservationId: r.reservation.id,
      partySize: r.reservation.partySize,
      startTime: r.reservation.startTime,
    })),
  };
}

export function manageWaitlist(branchId?: string): Record<string, unknown> {
  const waitlist = reservationService.listWaitlist(branchId);

  return {
    branchId: branchId ?? "all",
    count: waitlist.length,
    entries: waitlist.map((record) => ({
      reservationId: record.reservation.id,
      guestName: `${record.guest.firstName} ${record.guest.lastName}`,
      partySize: record.reservation.partySize,
      position: record.waitlist?.position ?? 0,
      quotedWaitMinutes: record.waitlist?.quotedWaitMinutes ?? 0,
      priority: record.waitlist?.priority ?? "standard",
    })),
  };
}

export function sendReservationReminder(reservationId: string): Record<string, unknown> | null {
  const record = reservationService.getById(reservationId);

  if (!record) {
    return null;
  }

  const channel = record.contact.preferredChannel;
  const recipient = record.contact.email ?? record.contact.phone ?? "";

  return {
    reservationId,
    confirmationCode: record.reservation.confirmationCode,
    channel,
    recipient,
    status: "sent",
    scheduledAt: new Date().toISOString(),
    message: `Reminder: your reservation ${record.reservation.confirmationCode} is on ${record.reservation.scheduledDate} at ${record.reservation.startTime}`,
  };
}

export function searchReservationsForAi(query: string, limit = 10): ReservationRecord[] {
  return reservationService.search({ query, limit });
}

export function buildReservationCatalogSummary(): Record<string, unknown> {
  const snapshot = buildReservationPlatformSnapshot();

  return {
    reservationCount: snapshot.reservationCount,
    todayCovers: snapshot.todayCovers,
    pendingCount: snapshot.pendingCount,
    confirmedCount: snapshot.confirmedCount,
    waitlistedCount: snapshot.waitlistedCount,
    avgNoShowRisk: snapshot.avgNoShowRisk,
  };
}
