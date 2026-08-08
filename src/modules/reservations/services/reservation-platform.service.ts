import "server-only";

import { RESERVATION_STATUSES } from "@/modules/reservations/constants/reservation-status";
import { reservationRepository } from "@/modules/reservations/repository/reservation-repository";
import { buildReservationScopeFromInput } from "@/modules/reservations/lib/reservation-scope";
import type {
  ReservationPlatformContext,
  ReservationRecord,
} from "@/modules/reservations/types/reservations";

export interface ReservationPlatformSnapshot {
  context: ReservationPlatformContext;
  reservations: ReservationRecord[];
  reservationCount: number;
  pendingCount: number;
  confirmedCount: number;
  seatedCount: number;
  waitlistedCount: number;
  cancelledCount: number;
  noShowCount: number;
  vipCount: number;
  avgNoShowRisk: number;
  todayCovers: number;
}

export async function buildReservationPlatformSnapshot(
  context: ReservationPlatformContext,
): Promise<ReservationPlatformSnapshot> {
  const scope = buildReservationScopeFromInput(context);
  const reservations = await reservationRepository.listReservations(scope);

  const countByStatus = (status: string) =>
    reservations.filter((record) => record.reservation.status === status).length;

  const today = new Date().toISOString().slice(0, 10);
  const todayReservations = reservations.filter((r) => r.reservation.scheduledDate === today);
  const todayCovers = todayReservations.reduce((sum, r) => sum + r.reservation.partySize, 0);
  const riskSum = reservations.reduce((sum, r) => sum + r.analytics.noShowProbability, 0);

  return {
    context,
    reservations,
    reservationCount: reservations.length,
    pendingCount: countByStatus(RESERVATION_STATUSES.PENDING),
    confirmedCount: countByStatus(RESERVATION_STATUSES.CONFIRMED),
    seatedCount: countByStatus(RESERVATION_STATUSES.SEATED),
    waitlistedCount: countByStatus(RESERVATION_STATUSES.WAITLISTED),
    cancelledCount: countByStatus(RESERVATION_STATUSES.CANCELLED),
    noShowCount: countByStatus(RESERVATION_STATUSES.NO_SHOW),
    vipCount: reservations.filter((r) => r.reservation.isVip).length,
    avgNoShowRisk: reservations.length > 0 ? riskSum / reservations.length : 0,
    todayCovers,
  };
}

export async function getUpcomingReservations(
  context: ReservationPlatformContext,
  limit = 5,
): Promise<ReservationRecord[]> {
  const result = await reservationRepository.search(buildReservationScopeFromInput(context), {
    status: RESERVATION_STATUSES.CONFIRMED,
    pageSize: limit,
  });
  return result.records;
}
