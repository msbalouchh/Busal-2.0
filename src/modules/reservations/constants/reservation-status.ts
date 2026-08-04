/** Reservation lifecycle statuses. */
export const RESERVATION_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked_in",
  SEATED: "seated",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
  WAITLISTED: "waitlisted",
} as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[keyof typeof RESERVATION_STATUSES];

/** Booking channel / acquisition source. */
export const RESERVATION_SOURCES = {
  WEBSITE: "website",
  MOBILE_APP: "mobile_app",
  QR: "qr",
  WALK_IN: "walk_in",
  PHONE: "phone",
  GOOGLE: "google",
  FACEBOOK: "facebook",
  INSTAGRAM: "instagram",
  WHATSAPP: "whatsapp",
  STAFF: "staff",
} as const;

export type ReservationSource = (typeof RESERVATION_SOURCES)[keyof typeof RESERVATION_SOURCES];

/** Timeline event types for reservation activity. */
export const RESERVATION_TIMELINE_EVENT_TYPES = {
  CREATED: "created",
  CONFIRMED: "confirmed",
  REMINDER_SENT: "reminder_sent",
  CHECKED_IN: "checked_in",
  SEATED: "seated",
  TABLE_ASSIGNED: "table_assigned",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
  WAITLISTED: "waitlisted",
  NOTE_ADDED: "note_added",
  UPDATED: "updated",
} as const;

export type ReservationTimelineEventType =
  (typeof RESERVATION_TIMELINE_EVENT_TYPES)[keyof typeof RESERVATION_TIMELINE_EVENT_TYPES];

/** Waitlist queue priority tiers. */
export const WAITLIST_PRIORITIES = {
  STANDARD: "standard",
  VIP: "vip",
  GROUP: "group",
} as const;

export type WaitlistPriority = (typeof WAITLIST_PRIORITIES)[keyof typeof WAITLIST_PRIORITIES];

/** Confirmation delivery channels. */
export const CONFIRMATION_CHANNELS = {
  EMAIL: "email",
  SMS: "sms",
  WHATSAPP: "whatsapp",
  PUSH: "push",
} as const;

export type ConfirmationChannel =
  (typeof CONFIRMATION_CHANNELS)[keyof typeof CONFIRMATION_CHANNELS];

export const RESERVATION_AI_TOOL_IDS = {
  CREATE: "reservation.create",
  UPDATE: "reservation.update",
  CANCEL: "reservation.cancel",
  RECOMMEND_TABLE: "reservation.recommend-table",
  PREDICT_NO_SHOW: "reservation.predict-no-show",
  OPTIMIZE_SEATING: "reservation.optimize-seating",
  MANAGE_WAITLIST: "reservation.manage-waitlist",
  SEND_REMINDER: "reservation.send-reminder",
} as const;

export type ReservationAiToolId =
  (typeof RESERVATION_AI_TOOL_IDS)[keyof typeof RESERVATION_AI_TOOL_IDS];

/** Module-local permission markers (future RBAC wiring). */
export const RESERVATION_PERMISSIONS = {
  READ: "reservations.read",
  MANAGE: "reservations.manage",
  CANCEL: "reservations.cancel",
  WAITLIST_MANAGE: "reservations.waitlist.manage",
  ANALYTICS_READ: "reservations.analytics.read",
} as const;

export type ReservationPermission =
  (typeof RESERVATION_PERMISSIONS)[keyof typeof RESERVATION_PERMISSIONS];
