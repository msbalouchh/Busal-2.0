import "server-only";

import { RESERVATION_STATUSES } from "@/modules/reservations/constants/reservation-status";
import { reservationService } from "@/modules/reservations/services/reservation.service";
import { buildReservationPlatformSnapshot } from "@/modules/reservations/services/reservation-platform.service";
import { getReservationSummary } from "@/modules/reservations/utils/reservation-selectors";
import type {
  ReservationAiContext,
  ReservationPlatformContext,
  ReservationRecord,
} from "@/modules/reservations/types/reservations";
import {
  resolveBusinessContextFromModule,
  runModuleAiJsonTask,
  type ModulePlatformContext,
} from "@/services/ai-engine-bridge.service";

const MODULE_NAME = "reservations";

function toModulePlatform(context: ReservationPlatformContext): ModulePlatformContext {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
  };
}

async function runReservationAiInference<T extends Record<string, unknown>>(
  context: ReservationPlatformContext,
  task: string,
  data: Record<string, unknown>,
  instructions?: string,
): Promise<T | null> {
  const platform = await resolveBusinessContextFromModule(toModulePlatform(context));
  return runModuleAiJsonTask<T>(platform, {
    module: MODULE_NAME,
    task,
    context: data,
    instructions,
  });
}

export async function buildReservationAiContext(
  context: ReservationPlatformContext,
  reservationId: string,
): Promise<ReservationAiContext | null> {
  const record = await reservationService.getById(context, reservationId);

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

export async function recommendBestTable(
  context: ReservationPlatformContext,
  reservationId: string,
): Promise<Record<string, unknown> | null> {
  const record = await reservationService.getById(context, reservationId);

  if (!record) {
    return null;
  }

  const { partySize, isVip } = record.reservation;
  const dataContext = {
    reservationId,
    partySize,
    isVip,
    suggestedTableIds: record.aiContext.suggestedTableIds,
    autoSuggestEnabled: record.seating.autoSuggestEnabled,
  };

  const aiResult = await runReservationAiInference<Record<string, unknown>>(
    context,
    "recommendBestTable",
    dataContext,
    "Recommend best table. Return JSON with reservationId, partySize, recommendations array (tableId, rationale), and autoSuggestEnabled.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    reservationId,
    partySize,
    suggestedTableIds: record.aiContext.suggestedTableIds,
    autoSuggestEnabled: record.seating.autoSuggestEnabled,
  };
}

export async function predictNoShows(
  context: ReservationPlatformContext,
  limit = 5,
): Promise<Record<string, unknown>> {
  const result = await reservationService.search(
    { status: RESERVATION_STATUSES.CONFIRMED, pageSize: 100 },
    context,
  );

  const records = [...result.records]
    .sort((a, b) => b.analytics.noShowProbability - a.analytics.noShowProbability)
    .slice(0, limit);

  const dataContext = {
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

  const aiResult = await runReservationAiInference<Record<string, unknown>>(
    context,
    "predictNoShows",
    dataContext,
    "Predict no-shows. Return JSON with count, reservations, and recommendedActions.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function optimizeReservationSchedule(
  context: ReservationPlatformContext,
): Promise<Record<string, unknown>> {
  const snapshot = await buildReservationPlatformSnapshot(context);
  const upcoming = await reservationService.search(
    { status: RESERVATION_STATUSES.CONFIRMED, pageSize: 20 },
    context,
  );
  const unassigned = upcoming.records.filter((r) => !r.reservation.tableId);

  return {
    branchId: context.branchId,
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

export async function suggestPeakCapacity(
  context: ReservationPlatformContext,
): Promise<Record<string, unknown>> {
  const today = new Date().toISOString().slice(0, 10);
  const slots = await reservationService.listTimeSlots(context, today);
  const peak = [...slots].sort((a, b) => b.bookedCovers - a.bookedCovers)[0];
  const dataContext = {
    date: today,
    peakSlot: peak ?? null,
    slots: slots.map((slot) => ({
      startTime: slot.startTime,
      bookedCovers: slot.bookedCovers,
      maxCovers: slot.maxCovers,
    })),
  };

  const aiResult = await runReservationAiInference<Record<string, unknown>>(
    context,
    "suggestPeakCapacity",
    dataContext,
    "Suggest peak capacity. Return JSON with date, peakSlot, recommendedMaxCovers, utilizationPercent, and recommendations.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    date: today,
    peakSlot: peak ?? null,
    utilizationPercent: peak ? Math.round((peak.bookedCovers / peak.maxCovers) * 100) : 0,
  };
}

export async function estimateWaitTime(
  context: ReservationPlatformContext,
  partySize: number,
): Promise<Record<string, unknown>> {
  const waitlist = await reservationService.listWaitlist(context);
  const availableTables = await reservationService.search(
    { status: RESERVATION_STATUSES.CONFIRMED, pageSize: 50 },
    context,
  );

  const seatedSoon = availableTables.records.filter((r) => r.reservation.tableId).length;
  const dataContext = {
    partySize,
    waitlistCount: waitlist.length,
    seatedSoonCount: seatedSoon,
    waitlist: waitlist.slice(0, 10).map((record) => ({
      partySize: record.reservation.partySize,
      position: record.waitlist?.position,
    })),
  };

  const aiResult = await runReservationAiInference<Record<string, unknown>>(
    context,
    "estimateWaitTime",
    dataContext,
    "Estimate wait time. Return JSON with partySize, estimatedWaitMinutes, waitlistCount, and confidence.",
  );

  if (aiResult) {
    return aiResult;
  }

  return {
    partySize,
    waitlistCount: waitlist.length,
    seatedSoonCount: seatedSoon,
  };
}

export async function recommendStaffAllocation(
  context: ReservationPlatformContext,
): Promise<Record<string, unknown>> {
  const snapshot = await buildReservationPlatformSnapshot(context);
  const dataContext = {
    branchId: context.branchId,
    todayCovers: snapshot.todayCovers,
    waitlistedCount: snapshot.waitlistedCount,
    confirmedCount: snapshot.confirmedCount,
  };

  const aiResult = await runReservationAiInference<Record<string, unknown>>(
    context,
    "recommendStaffAllocation",
    dataContext,
    "Recommend staff allocation for reservations. Return JSON with branchId, todayCovers, and recommendations array.",
  );

  if (aiResult) {
    return aiResult;
  }

  return dataContext;
}

export async function manageWaitlist(
  context: ReservationPlatformContext,
): Promise<Record<string, unknown>> {
  const waitlist = await reservationService.listWaitlist(context);

  return {
    branchId: context.branchId,
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

export async function sendReservationReminder(
  context: ReservationPlatformContext,
  reservationId: string,
): Promise<Record<string, unknown> | null> {
  const record = await reservationService.getById(context, reservationId);

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

export async function searchReservationsForAi(
  context: ReservationPlatformContext,
  query: string,
  limit = 10,
): Promise<ReservationRecord[]> {
  const result = await reservationService.search({ query, pageSize: limit }, context);
  return result.records;
}

export async function buildReservationCatalogSummary(
  context: ReservationPlatformContext,
): Promise<Record<string, unknown>> {
  const snapshot = await buildReservationPlatformSnapshot(context);

  return {
    reservationCount: snapshot.reservationCount,
    todayCovers: snapshot.todayCovers,
    pendingCount: snapshot.pendingCount,
    confirmedCount: snapshot.confirmedCount,
    waitlistedCount: snapshot.waitlistedCount,
    avgNoShowRisk: snapshot.avgNoShowRisk,
  };
}

/** @deprecated Use optimizeReservationSchedule */
export async function optimizeSeatingForBranch(
  context: ReservationPlatformContext,
): Promise<Record<string, unknown>> {
  return optimizeReservationSchedule(context);
}
