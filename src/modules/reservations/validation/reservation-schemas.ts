import { z } from "zod";

import {
  RESERVATION_SOURCES,
  RESERVATION_STATUSES,
  WAITLIST_PRIORITIES,
} from "@/modules/reservations/constants/reservation-status";

const reservationStatusSchema = z.enum([
  RESERVATION_STATUSES.PENDING,
  RESERVATION_STATUSES.CONFIRMED,
  RESERVATION_STATUSES.CHECKED_IN,
  RESERVATION_STATUSES.SEATED,
  RESERVATION_STATUSES.COMPLETED,
  RESERVATION_STATUSES.CANCELLED,
  RESERVATION_STATUSES.NO_SHOW,
  RESERVATION_STATUSES.WAITLISTED,
]);

const reservationSourceSchema = z.enum([
  RESERVATION_SOURCES.WEBSITE,
  RESERVATION_SOURCES.MOBILE_APP,
  RESERVATION_SOURCES.QR,
  RESERVATION_SOURCES.WALK_IN,
  RESERVATION_SOURCES.PHONE,
  RESERVATION_SOURCES.GOOGLE,
  RESERVATION_SOURCES.FACEBOOK,
  RESERVATION_SOURCES.INSTAGRAM,
  RESERVATION_SOURCES.WHATSAPP,
  RESERVATION_SOURCES.STAFF,
]);

const prismaSourceSchema = z.enum([
  "PHONE",
  "WALK_IN",
  "WEBSITE",
  "QR",
  "GOOGLE",
  "FACEBOOK",
  "INSTAGRAM",
  "OTHER",
  "ADMIN",
]);

const prismaStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "SEATED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

const timeSchema = z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/);

export const reservationSearchSchema = z.object({
  query: z.string().optional(),
  status: reservationStatusSchema.optional(),
  source: reservationSourceSchema.optional(),
  date: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  partySizeMin: z.coerce.number().int().positive().optional(),
  isVip: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.enum(["date", "time", "partySize", "status", "createdAt"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  includeArchived: z.coerce.boolean().optional(),
});

export const createReservationSchema = z
  .object({
    branchId: z.string().uuid().optional(),
    partySize: z.number().int().min(1),
    scheduledDate: z.string(),
    startTime: timeSchema,
    endTime: timeSchema.optional(),
    durationMinutes: z.number().int().positive().optional(),
    source: reservationSourceSchema.optional(),
    guestFirstName: z.string().trim().min(1).optional(),
    guestLastName: z.string().trim().optional(),
    guestEmail: z.string().email().optional().or(z.literal("")),
    guestPhone: z.string().trim().optional(),
    customerName: z.string().trim().min(1).optional(),
    customerPhone: z.string().trim().optional(),
    customerEmail: z.string().email().optional().or(z.literal("")),
    specialRequests: z.string().optional(),
    notes: z.string().optional(),
    isVip: z.boolean().optional(),
    tableId: z.string().uuid().optional(),
  })
  .refine((value) => Boolean(value.customerName?.trim() || value.guestFirstName?.trim()), {
    message: "Guest name is required",
    path: ["customerName"],
  });

export const updateReservationSchema = z.object({
  reservationId: z.string().uuid(),
  status: reservationStatusSchema.optional(),
  partySize: z.number().int().min(1).optional(),
  scheduledDate: z.string().optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  specialRequests: z.string().optional(),
  notes: z.string().nullable().optional(),
  tableId: z.string().uuid().nullable().optional(),
  guestFirstName: z.string().trim().min(1).optional(),
  guestLastName: z.string().trim().optional(),
  guestEmail: z.string().email().optional().or(z.literal("")).nullable(),
  guestPhone: z.string().trim().optional(),
  customerName: z.string().trim().min(1).optional(),
  customerPhone: z.string().trim().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")).nullable(),
  source: reservationSourceSchema.optional(),
});

export const cancelReservationSchema = z.object({
  reservationId: z.string().uuid(),
  reason: z.string().trim().min(1),
  cancelledBy: z.string().uuid().optional(),
});

export const assignTableSchema = z.object({
  reservationId: z.string().uuid(),
  tableId: z.string().uuid(),
  floorId: z.string().uuid().optional(),
  assignedBy: z.string().uuid().optional(),
  isAutoSuggested: z.boolean().optional(),
});

export const waitlistEntrySchema = z.object({
  reservationId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  partySize: z.number().int().min(1),
  priority: z.enum([
    WAITLIST_PRIORITIES.STANDARD,
    WAITLIST_PRIORITIES.VIP,
    WAITLIST_PRIORITIES.GROUP,
  ]).optional(),
  quotedWaitMinutes: z.number().int().min(0).optional(),
});

export const bulkUpdateReservationsSchema = z.object({
  reservationIds: z.array(z.string().uuid()).min(1),
  status: reservationStatusSchema.optional(),
  tableId: z.string().uuid().nullable().optional(),
});

export const mergeReservationsSchema = z.object({
  targetReservationId: z.string().uuid(),
  sourceReservationIds: z.array(z.string().uuid()).min(1),
});

export const addReservationNoteSchema = z.object({
  reservationId: z.string().uuid(),
  body: z.string().trim().min(1),
  isInternal: z.boolean().optional(),
});

export const addReservationTagSchema = z.object({
  reservationId: z.string().uuid(),
  label: z.string().trim().min(1).max(60),
});

export const prismaStatusUpdateSchema = z.object({
  reservationId: z.string().uuid(),
  status: prismaStatusSchema,
});

export const clientCreateReservationSchema = z.object({
  customerName: z.string().trim().min(1),
  customerPhone: z.string().trim().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  reservationDate: z.string(),
  startTime: timeSchema,
  endTime: timeSchema,
  partySize: z.number().int().min(1),
  notes: z.string().optional(),
  source: prismaSourceSchema.optional(),
});

export const clientUpdateReservationSchema = clientCreateReservationSchema.partial();

export type AddReservationNoteSchemaInput = z.infer<typeof addReservationNoteSchema>;
export type AddReservationTagSchemaInput = z.infer<typeof addReservationTagSchema>;
export type BulkUpdateReservationsSchemaInput = z.infer<typeof bulkUpdateReservationsSchema>;
export type MergeReservationsSchemaInput = z.infer<typeof mergeReservationsSchema>;
export type ReservationSearchInput = z.infer<typeof reservationSearchSchema>;
export type CreateReservationSchemaInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationSchemaInput = z.infer<typeof updateReservationSchema>;
