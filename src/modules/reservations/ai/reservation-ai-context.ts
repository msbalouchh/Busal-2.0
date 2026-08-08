import { RESERVATION_STATUSES } from "@/modules/reservations/constants/reservation-status";
import {
  buildReservationAiContext,
  buildReservationCatalogSummary,
  estimateWaitTime,
  manageWaitlist,
  optimizeReservationSchedule,
  optimizeSeatingForBranch,
  predictNoShows,
  recommendBestTable,
  recommendStaffAllocation,
  searchReservationsForAi,
  sendReservationReminder,
  suggestPeakCapacity,
} from "@/modules/reservations/services/reservation-ai.service";
import type { ReservationPlatformContext } from "@/modules/reservations/types/reservations";

export {
  buildReservationAiContext,
  buildReservationCatalogSummary,
  estimateWaitTime,
  manageWaitlist,
  optimizeReservationSchedule,
  optimizeSeatingForBranch,
  predictNoShows,
  recommendBestTable,
  recommendStaffAllocation,
  searchReservationsForAi,
  sendReservationReminder,
  suggestPeakCapacity,
};

export function resolveReservationAiContext(
  context: ReservationPlatformContext,
): ReservationPlatformContext {
  return context;
}

export { RESERVATION_STATUSES };
