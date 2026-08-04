import type {
  ConfirmationChannel,
  ReservationSource,
  ReservationStatus,
  ReservationTimelineEventType,
  WaitlistPriority,
} from "@/modules/reservations/constants/reservation-status";

/** Core reservation record scoped to branch. */
export interface Reservation {
  id: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  confirmationCode: string;
  status: ReservationStatus;
  source: ReservationSource;
  partySize: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isVip: boolean;
  isGroupBooking: boolean;
  isRecurring: boolean;
  recurringSeriesId: string | null;
  specialRequests: string | null;
  internalNotes: string | null;
  tableId: string | null;
  floorId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Guest profile linked to a reservation. */
export interface ReservationGuest {
  id: string;
  reservationId: string;
  customerId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  dietaryPreferences: string[];
  seatingPreferences: string[];
  visitCount: number;
  loyaltyTier: string | null;
}

/** Contact details for confirmations and reminders. */
export interface ReservationContact {
  reservationId: string;
  email: string | null;
  phone: string | null;
  preferredChannel: ConfirmationChannel;
  locale: string;
}

/** Chronological reservation activity. */
export interface ReservationTimelineEvent {
  id: string;
  reservationId: string;
  type: ReservationTimelineEventType;
  timestamp: string;
  actorId: string | null;
  payload: Record<string, unknown>;
}

/** Staff or system note on a reservation. */
export interface ReservationNote {
  id: string;
  reservationId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

/** Tag label for segmentation and filtering. */
export interface ReservationTag {
  id: string;
  reservationId: string;
  label: string;
  slug: string;
}

/** Waitlist queue entry when no table is immediately available. */
export interface ReservationWaitlist {
  id: string;
  reservationId: string;
  branchId: string;
  partySize: number;
  priority: WaitlistPriority;
  quotedWaitMinutes: number;
  position: number;
  joinedAt: string;
  notifiedAt: string | null;
}

/** Seating preferences and assignment metadata. */
export interface ReservationSeating {
  reservationId: string;
  preferredZoneId: string | null;
  preferredTableId: string | null;
  assignedTableId: string | null;
  assignedAt: string | null;
  seatedAt: string | null;
  autoSuggestEnabled: boolean;
}

/** Table assignment operation record. */
export interface ReservationAssignment {
  id: string;
  reservationId: string;
  tableId: string;
  floorId: string;
  assignedBy: string;
  assignedAt: string;
  isAutoSuggested: boolean;
}

/** Confirmation delivery record. */
export interface ReservationConfirmation {
  id: string;
  reservationId: string;
  channel: ConfirmationChannel;
  sentAt: string;
  status: "pending" | "sent" | "delivered" | "failed";
  recipient: string;
}

/** Scheduled or sent reminder. */
export interface ReservationReminder {
  id: string;
  reservationId: string;
  channel: ConfirmationChannel;
  scheduledAt: string;
  sentAt: string | null;
  status: "scheduled" | "sent" | "cancelled" | "failed";
}

/** Cancellation audit record. */
export interface ReservationCancellation {
  id: string;
  reservationId: string;
  reason: string;
  cancelledBy: string;
  cancelledAt: string;
  refundEligible: boolean;
}

/** Source attribution metadata. */
export interface ReservationSourceMeta {
  reservationId: string;
  source: ReservationSource;
  campaignId: string | null;
  referrerUrl: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

/** Operational analytics for a reservation. */
export interface ReservationAnalytics {
  reservationId: string;
  noShowProbability: number;
  leadTimeHours: number;
  tableTurnoverMinutes: number | null;
  revenueEstimatePence: number;
  lifetimeGuestValuePence: number;
}

/** AI-enriched context for recommendations. */
export interface ReservationAiContext {
  reservationId: string;
  summary: string;
  insights: string[];
  recommendedActions: string[];
  suggestedTableIds: string[];
  noShowRiskScore: number;
  lastGeneratedAt: string;
}

/** Time slot capacity window for a branch. */
export interface ReservationTimeSlot {
  id: string;
  branchId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCovers: number;
  bookedCovers: number;
  isBlocked: boolean;
}

/** Full reservation aggregate — single source of truth. */
export interface ReservationRecord {
  reservation: Reservation;
  guest: ReservationGuest;
  contact: ReservationContact;
  seating: ReservationSeating;
  tags: ReservationTag[];
  notes: ReservationNote[];
  timeline: ReservationTimelineEvent[];
  waitlist: ReservationWaitlist | null;
  assignment: ReservationAssignment | null;
  confirmation: ReservationConfirmation | null;
  reminders: ReservationReminder[];
  cancellation: ReservationCancellation | null;
  sourceMeta: ReservationSourceMeta;
  analytics: ReservationAnalytics;
  aiContext: ReservationAiContext;
}

export interface ReservationSearchQuery {
  query?: string;
  tenantId?: string;
  businessId?: string;
  branchId?: string;
  status?: ReservationStatus;
  source?: ReservationSource;
  date?: string;
  fromDate?: string;
  toDate?: string;
  partySizeMin?: number;
  isVip?: boolean;
  limit?: number;
}

export interface CreateReservationInput {
  branchId: string;
  partySize: number;
  scheduledDate: string;
  startTime: string;
  durationMinutes?: number;
  source?: ReservationSource;
  guestFirstName: string;
  guestLastName: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;
  isVip?: boolean;
  tableId?: string;
}

export interface UpdateReservationInput {
  reservationId: string;
  status?: ReservationStatus;
  partySize?: number;
  scheduledDate?: string;
  startTime?: string;
  specialRequests?: string;
  tableId?: string | null;
}

export interface CancelReservationInput {
  reservationId: string;
  reason: string;
  cancelledBy?: string;
}

export interface AssignTableInput {
  reservationId: string;
  tableId: string;
  floorId: string;
  assignedBy?: string;
  isAutoSuggested?: boolean;
}

export interface WaitlistEntryInput {
  reservationId: string;
  branchId: string;
  partySize: number;
  priority?: WaitlistPriority;
  quotedWaitMinutes?: number;
}

export interface ReservationPlatformContext {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
}

export interface ReservationContextValue {
  context: ReservationPlatformContext;
  reservations: ReservationRecord[];
  selectedReservation: ReservationRecord | null;
  timeSlots: ReservationTimeSlot[];
  selectReservation: (reservationId: string | null) => void;
  searchReservations: (query: ReservationSearchQuery) => ReservationRecord[];
  refresh: () => void;
}
