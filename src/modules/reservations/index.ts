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
  RESERVATION_MODULE_PERMISSIONS,
  type ReservationModulePermissionCode,
} from "@/modules/reservations/constants/permissions";

export type * from "@/modules/reservations/types/reservations";
export * from "@/modules/reservations/utils/reservation-selectors";
export * from "@/modules/reservations/utils/reservation-capacity-utils";

export {
  ReservationRepository,
  reservationRepository,
  type ReservationSearchResult,
} from "@/modules/reservations/repository/reservation-repository";

export {
  ReservationService,
  reservationService,
} from "@/modules/reservations/services/reservation.service";

export {
  buildReservationPlatformSnapshot,
  getUpcomingReservations,
  type ReservationPlatformSnapshot,
} from "@/modules/reservations/services/reservation-platform.service";

export {
  buildReservationPlatformContext,
  type ReservationPlatformInput,
} from "@/modules/reservations/lib/reservation-platform-context";

export {
  getReservationModuleContext,
  getReservationSnapshot,
  type ReservationModulePageContext,
} from "@/modules/reservations/lib/get-reservation-context";

export * from "@/modules/reservations/lib/reservation-scope";
export {
  serializeReservation,
  computeReservationStats,
  type ClientReservation,
  type ReservationStats,
} from "@/modules/reservations/lib/reservation-utils";

export {
  createReservationAction,
  updateReservationAction,
  cancelReservationAction,
  updateReservationStatusAction,
  confirmReservationAction,
  checkInReservationAction,
  assignTableAction,
  addToWaitlistAction,
  archiveReservationAction,
  restoreReservationAction,
} from "@/modules/reservations/actions/reservation-actions";

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
export { ReservationsOverview } from "@/modules/reservations/components/reservations-overview";
export { ReservationManagementLoading } from "@/modules/reservations/components/reservation-management-loading";
export { ReservationManagementEmpty } from "@/modules/reservations/components/reservation-management-empty";
export { ReservationManagementError } from "@/modules/reservations/components/reservation-management-error";

export {
  registerReservationAiTools,
  RESERVATION_AI_TOOLS,
  buildReservationAiContext,
  recommendBestTable,
  predictNoShows,
  optimizeReservationSchedule,
  optimizeSeatingForBranch,
  manageWaitlist,
  sendReservationReminder,
  searchReservationsForAi,
  buildReservationCatalogSummary,
  suggestPeakCapacity,
  estimateWaitTime,
  recommendStaffAllocation,
} from "@/modules/reservations/ai";
