export {
  RESERVATION_STATUSES,
  RESERVATION_SOURCES,
  RESERVATION_TIMELINE_EVENT_TYPES,
  WAITLIST_PRIORITIES,
  CONFIRMATION_CHANNELS,
  RESERVATION_AI_TOOL_IDS,
  RESERVATION_PERMISSIONS,
  type ReservationStatus,
  type ReservationSource,
  type ReservationTimelineEventType,
  type WaitlistPriority,
  type ConfirmationChannel,
  type ReservationAiToolId,
  type ReservationPermission,
} from "@/modules/reservations/constants/reservation-status";

export {
  RESERVATION_INTEGRATION_POINTS,
  type ReservationIntegrationPoint,
} from "@/modules/reservations/constants/integration-points";

export {
  RESERVATION_PLATFORM_ROUTES,
  RESERVATION_PLATFORM_NAV_ITEMS,
} from "@/modules/reservations/constants/platform-routes";

export {
  DEFAULT_RESERVATION_SCOPE,
  MOCK_RESERVATION_RECORD,
  MOCK_RESERVATION_RECORDS,
  MOCK_TIME_SLOTS,
} from "@/modules/reservations/constants/mock-data";

export type * from "@/modules/reservations/types/reservations";
export * from "@/modules/reservations/utils/reservation-selectors";
export * from "@/modules/reservations/utils/reservation-capacity-utils";

export {
  ReservationRepository,
  reservationRepository,
} from "@/modules/reservations/repository/reservation-repository";

export {
  ReservationService,
  reservationService,
} from "@/modules/reservations/services/reservation.service";

export {
  buildReservationPlatformContext,
  buildReservationPlatformSnapshot,
  getDefaultReservationSnapshot,
  getUpcomingReservations,
  type ReservationPlatformSnapshot,
  type ReservationPlatformInput,
} from "@/modules/reservations/services/reservation-platform.service";

export { ReservationProvider } from "@/modules/reservations/providers/reservation-provider";
export { ReservationContext } from "@/modules/reservations/contexts/reservation-context";

export {
  useReservations,
  useReservationContext,
} from "@/modules/reservations/hooks/use-reservations";
export { useReservation } from "@/modules/reservations/hooks/use-reservation";
export { useReservationCalendar } from "@/modules/reservations/hooks/use-reservation-calendar";

export { ReservationStatusBadge } from "@/modules/reservations/components/reservation-status-badge";
export { ReservationSourceBadge } from "@/modules/reservations/components/reservation-source-badge";

export {
  registerReservationAiTools,
  RESERVATION_AI_TOOLS,
  buildReservationAiContext,
  recommendBestTable,
  predictNoShows,
  optimizeSeatingForBranch,
  manageWaitlist,
  sendReservationReminder,
  searchReservationsForAi,
  buildReservationCatalogSummary,
} from "@/modules/reservations/ai";
