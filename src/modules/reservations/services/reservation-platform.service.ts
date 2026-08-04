import { RESERVATION_STATUSES } from "@/modules/reservations/constants/reservation-status";
import { DEFAULT_RESERVATION_SCOPE } from "@/modules/reservations/constants/mock-data";
import { reservationRepository } from "@/modules/reservations/repository/reservation-repository";
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

export interface ReservationPlatformInput {
  tenantId?: string;
  workspaceId?: string;
  businessId?: string;
  branchId?: string;
  userId?: string;
}

export function buildReservationPlatformContext(
  input: ReservationPlatformInput = {},
): ReservationPlatformContext {
  return {
    tenantId: input.tenantId ?? DEFAULT_RESERVATION_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_RESERVATION_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_RESERVATION_SCOPE.businessId,
    branchId: input.branchId ?? DEFAULT_RESERVATION_SCOPE.branchId,
    userId: input.userId ?? DEFAULT_RESERVATION_SCOPE.userId,
  };
}

export function buildReservationPlatformSnapshot(
  input: ReservationPlatformInput = {},
): ReservationPlatformSnapshot {
  const context = buildReservationPlatformContext(input);
  const reservations = reservationRepository
    .listReservations()
    .filter(
      (record) =>
        record.reservation.tenantId === context.tenantId &&
        record.reservation.businessId === context.businessId,
    );

  const countByStatus = (status: string) =>
    reservations.filter((record) => record.reservation.status === status).length;

  const today = "2026-02-15";
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

export function getDefaultReservationSnapshot(): ReservationPlatformSnapshot {
  return buildReservationPlatformSnapshot();
}

export function getUpcomingReservations(limit = 5): ReservationRecord[] {
  return reservationRepository.search({ status: RESERVATION_STATUSES.CONFIRMED }).slice(0, limit);
}
