import "server-only";

import { prisma } from "@/lib/prisma";
import { reservationService } from "@/modules/reservations/services/reservation.service";
import {
  buildReservationScopeFromInput,
  toReservationPlatformContext,
} from "@/modules/reservations/lib/reservation-scope";
import { RESERVATION_SOURCES, RESERVATION_STATUSES } from "@/modules/reservations/constants/reservation-status";
import { findAvailableSlots } from "@/modules/reservations/utils/reservation-capacity-utils";
import { getReservationSummary } from "@/modules/reservations/utils/reservation-selectors";
import {
  AI_BUSINESS_TOOL_IDS,
  CUSTOMER_AI_TOOL_IDS,
} from "@/modules/customer-ai/constants/customer-ai.constants";
import type { AiBusinessToolDefinition } from "@/modules/customer-ai/tools/tool-types";

async function resolveReservationContext(businessId: string, branchId?: string | null, userId?: string) {
  const resolvedBranchId =
    branchId ??
    (
      await prisma.branch.findFirst({
        where: { businessId, isMain: true, isActive: true },
        select: { id: true },
      })
    )?.id;

  if (!resolvedBranchId) throw new Error("No branch available for reservations.");

  return toReservationPlatformContext(
    buildReservationScopeFromInput({
      businessId,
      branchId: resolvedBranchId,
      userId: userId ?? "system",
    }),
  );
}

function formatReservation(record: Awaited<ReturnType<typeof reservationService.getById>>) {
  if (!record) return null;
  return {
    reservationId: record.reservation.id,
    confirmationCode: record.reservation.confirmationCode,
    status: record.reservation.status,
    partySize: record.reservation.partySize,
    scheduledDate: record.reservation.scheduledDate,
    startTime: record.reservation.startTime,
    guestName: `${record.guest.firstName} ${record.guest.lastName}`.trim(),
    summary: getReservationSummary(record),
  };
}

export const reservationTools: AiBusinessToolDefinition[] = [
  {
    toolId: CUSTOMER_AI_TOOL_IDS.CHECK_AVAILABILITY,
    name: "Check Availability",
    description: "Check available reservation time slots for a date and party size.",
    inputSchema: {
      type: "object",
      properties: {
        scheduledDate: { type: "string" },
        partySize: { type: "number" },
      },
      required: ["scheduledDate", "partySize"],
    },
    permission: "ai.reservations.read",
    riskLevel: "READ",
    audience: "CUSTOMER",
    handler: async (input, context) => {
      const reservationContext = await resolveReservationContext(context.businessId, context.branchId);
      const date = String(input.scheduledDate);
      const partySize = typeof input.partySize === "number" ? input.partySize : 2;
      const slots = await reservationService.listTimeSlots(reservationContext, date);
      const available = findAvailableSlots(slots, date, partySize);
      return {
        date,
        partySize,
        availableSlots: available.map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          remainingCovers: slot.maxCovers - slot.bookedCovers,
        })),
        totalAvailable: available.length,
      };
    },
  },
  {
    toolId: CUSTOMER_AI_TOOL_IDS.CREATE_RESERVATION,
    name: "Create Reservation",
    description: "Create a table reservation. Requires guest details and confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        partySize: { type: "number" },
        scheduledDate: { type: "string" },
        startTime: { type: "string" },
        guestFirstName: { type: "string" },
        guestLastName: { type: "string" },
        guestEmail: { type: "string" },
        guestPhone: { type: "string" },
      },
      required: ["partySize", "scheduledDate", "startTime", "guestFirstName", "guestPhone"],
    },
    permission: "ai.reservations.create",
    riskLevel: "WRITE",
    audience: "CUSTOMER",
    buildConfirmationActionId: (input) =>
      `reservation:${String(input.scheduledDate)}:${String(input.startTime)}`,
    buildConfirmationMessage: (input) =>
      `Confirm booking for ${input.partySize} guests on ${input.scheduledDate} at ${input.startTime}?`,
    handler: async (input, context) => {
      const reservationContext = await resolveReservationContext(context.businessId, context.branchId);
      const branchId = reservationContext.branchId;
      const record = await reservationService.create(reservationContext, {
        branchId,
        partySize: typeof input.partySize === "number" ? input.partySize : 2,
        scheduledDate: String(input.scheduledDate),
        startTime: String(input.startTime),
        guestFirstName: String(input.guestFirstName),
        guestLastName: typeof input.guestLastName === "string" ? input.guestLastName : "",
        guestEmail: typeof input.guestEmail === "string" ? input.guestEmail : undefined,
        guestPhone: String(input.guestPhone),
        isVip: false,
        source: RESERVATION_SOURCES.WEBSITE,
      });
      return formatReservation(record);
    },
  },
  {
    toolId: CUSTOMER_AI_TOOL_IDS.VIEW_RESERVATION,
    name: "View Reservation",
    description: "Look up a reservation for a verified customer.",
    inputSchema: { type: "object", properties: { confirmationCode: { type: "string" } } },
    permission: "ai.reservations.read",
    riskLevel: "READ",
    audience: "CUSTOMER",
    handler: async (input, context) => {
      const reservationContext = await resolveReservationContext(context.businessId, context.branchId);
      const code = typeof input.confirmationCode === "string" ? input.confirmationCode.trim() : undefined;
      const result = await reservationService.search(
        { query: code, pageSize: 1 },
        reservationContext,
      );
      let record = result.records[0] ?? null;
      if (!record && context.customerId) {
        const prismaResult = await prisma.reservation.findFirst({
          where: { businessId: context.businessId, customerId: context.customerId },
          orderBy: { reservationDate: "desc" },
        });
        if (prismaResult) {
          record = await reservationService.getById(reservationContext, prismaResult.id);
        }
      }
      if (!record) return { error: "No reservation found." };
      if (context.customerId && record.guest.customerId && record.guest.customerId !== context.customerId) {
        return { error: "Reservation not found for your account." };
      }
      return formatReservation(record);
    },
  },
  {
    toolId: CUSTOMER_AI_TOOL_IDS.RESERVATION_HISTORY,
    name: "Reservation History",
    description: "Retrieve reservation history for verified customer.",
    inputSchema: { type: "object", properties: { limit: { type: "number" } } },
    permission: "ai.reservations.read",
    riskLevel: "READ",
    audience: "CUSTOMER",
    requiresCustomerVerification: true,
    handler: async (input, context) => {
      if (!context.customerId) {
        return { error: "Customer verification required.", requiresVerification: true };
      }
      const reservations = await prisma.reservation.findMany({
        where: { businessId: context.businessId, customerId: context.customerId },
        orderBy: { reservationDate: "desc" },
        take: typeof input.limit === "number" ? input.limit : 10,
        select: {
          id: true,
          reservationNumber: true,
          status: true,
          partySize: true,
          reservationDate: true,
          startTime: true,
          guestName: true,
        },
      });
      return { reservations };
    },
  },
  {
    toolId: CUSTOMER_AI_TOOL_IDS.CANCEL_RESERVATION,
    name: "Cancel Reservation",
    description: "Cancel a reservation when eligible.",
    inputSchema: {
      type: "object",
      properties: { reservationId: { type: "string" }, reason: { type: "string" } },
      required: ["reservationId"],
    },
    permission: "ai.reservations.cancel",
    riskLevel: "DESTRUCTIVE",
    audience: "CUSTOMER",
    requiresCustomerVerification: true,
    buildConfirmationActionId: (input) => `cancel-reservation:${String(input.reservationId)}`,
    buildConfirmationMessage: (_input, preview) =>
      `Cancel reservation ${String(preview?.confirmationCode ?? preview?.reservationId ?? "")}?`,
    handler: async (input, context) => {
      const reservationContext = await resolveReservationContext(context.businessId, context.branchId);
      const reservationId = String(input.reservationId);
      const existing = await reservationService.getById(reservationContext, reservationId);
      if (!existing) return { error: "Reservation not found." };
      if (
        context.customerId &&
        existing.guest.customerId &&
        existing.guest.customerId !== context.customerId
      ) {
        return { error: "Reservation not found for your account." };
      }
      if (existing.reservation.status === RESERVATION_STATUSES.CANCELLED) {
        return { error: "Reservation is already cancelled.", confirmationCode: existing.reservation.confirmationCode };
      }
      const cancelled = await reservationService.cancel(reservationContext, {
        reservationId,
        reason: typeof input.reason === "string" ? input.reason : "Customer requested cancellation",
      });
      if (!cancelled) return { error: "Unable to cancel reservation." };
      return { success: true, ...formatReservation(cancelled) };
    },
  },
  {
    toolId: AI_BUSINESS_TOOL_IDS.SEARCH_RESERVATIONS,
    name: "Search Reservations",
    description: "Search business reservations by date or status.",
    inputSchema: {
      type: "object",
      properties: { date: { type: "string" }, status: { type: "string" }, limit: { type: "number" } },
    },
    permission: "ai.reservations.read",
    riskLevel: "READ",
    audience: "OWNER",
    handler: async (input, context) => {
      const reservationContext = await resolveReservationContext(
        context.businessId,
        context.branchId,
        context.ownerId ?? undefined,
      );
      const result = await reservationService.search(
        {
          date: typeof input.date === "string" ? input.date : undefined,
          status: typeof input.status === "string" ? (input.status as never) : undefined,
          pageSize: typeof input.limit === "number" ? input.limit : 20,
        },
        reservationContext,
      );
      return {
        reservations: result.records.map((record) => formatReservation(record)),
        total: result.total,
      };
    },
  },
  {
    toolId: AI_BUSINESS_TOOL_IDS.RESERVATIONS_TOMORROW,
    name: "Tomorrow's Reservations",
    description: "List reservations scheduled for tomorrow.",
    inputSchema: { type: "object", properties: {} },
    permission: "ai.analytics.read",
    riskLevel: "READ",
    audience: "OWNER",
    handler: async (_input, context) => {
      const reservationContext = await resolveReservationContext(
        context.businessId,
        context.branchId,
        context.ownerId ?? undefined,
      );
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const date = tomorrow.toISOString().slice(0, 10);
      const result = await reservationService.search({ date, pageSize: 100 }, reservationContext);
      return {
        date,
        count: result.total,
        reservations: result.records.map((record) => formatReservation(record)),
      };
    },
  },
  {
    toolId: AI_BUSINESS_TOOL_IDS.CANCEL_RESERVATION,
    name: "Cancel Reservation (Owner)",
    description: "Cancel a reservation on behalf of the business.",
    inputSchema: {
      type: "object",
      properties: { reservationId: { type: "string" }, reason: { type: "string" } },
      required: ["reservationId"],
    },
    permission: "ai.reservations.cancel",
    riskLevel: "DESTRUCTIVE",
    audience: "OWNER",
    buildConfirmationActionId: (input) => `owner-cancel-reservation:${String(input.reservationId)}`,
    handler: async (input, context) => {
      const reservationContext = await resolveReservationContext(
        context.businessId,
        context.branchId,
        context.ownerId ?? undefined,
      );
      const cancelled = await reservationService.cancel(reservationContext, {
        reservationId: String(input.reservationId),
        reason: typeof input.reason === "string" ? input.reason : "Owner requested cancellation",
      });
      if (!cancelled) return { error: "Unable to cancel reservation." };
      return { success: true, ...formatReservation(cancelled) };
    },
  },
];
