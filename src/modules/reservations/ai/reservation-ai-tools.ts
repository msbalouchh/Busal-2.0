import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import {
  PLATFORM_MODULES,
  PLATFORM_TOOL_PERMISSIONS,
} from "@/modules/ai-tools/constants/platform-tools";
import { registerPlatformTool } from "@/modules/ai-tools/registry/platform-tool-registry";
import type { RegisteredPlatformTool } from "@/modules/ai-tools/types/platform-tool";
import {
  manageWaitlist,
  optimizeSeatingForBranch,
  predictNoShows,
  recommendBestTable,
  sendReservationReminder,
} from "@/modules/reservations/ai/reservation-ai-context";
import { DEFAULT_RESERVATION_SCOPE } from "@/modules/reservations/constants/mock-data";
import { RESERVATION_AI_TOOL_IDS } from "@/modules/reservations/constants/reservation-status";
import { reservationService } from "@/modules/reservations/services/reservation.service";
import type { ReservationStatus } from "@/modules/reservations/constants/reservation-status";

function defineReservationTool(
  partial: Omit<RegisteredPlatformTool, "handler" | "version" | "isEnabled" | "metadata"> & {
    metadata?: Partial<RegisteredPlatformTool["metadata"]>;
  },
  handler: RegisteredPlatformTool["handler"],
): RegisteredPlatformTool {
  return {
    ...partial,
    version: "1.0.0",
    isEnabled: true,
    metadata: {
      category: "Reservations",
      tags: ["reservations", "seating", "waitlist"],
      readOnly: false,
      confirmationRequired: false,
      dryRunSupported: true,
      riskLevel: "low",
      ...partial.metadata,
    },
    handler,
  };
}

const RESERVATION_AGENT_SLUGS = [
  BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
  BUILTIN_AGENT_SLUGS.OPERATIONS,
  BUILTIN_AGENT_SLUGS.ANALYTICS,
  BUILTIN_AGENT_SLUGS.MARKETING,
];

export const RESERVATION_AI_TOOLS: RegisteredPlatformTool[] = [
  defineReservationTool(
    {
      id: RESERVATION_AI_TOOL_IDS.CREATE,
      name: "Create Reservation",
      description: "Create a new reservation for a guest.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_MANAGE],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["partySize", "scheduledDate", "startTime", "guestFirstName", "guestLastName"],
        properties: {
          partySize: { type: "number" },
          scheduledDate: { type: "string" },
          startTime: { type: "string" },
          guestFirstName: { type: "string" },
          guestLastName: { type: "string" },
          guestEmail: { type: "string" },
          guestPhone: { type: "string" },
          isVip: { type: "boolean" },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          reservationId: { type: "string" },
          confirmationCode: { type: "string" },
        },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.OPERATIONS, BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT],
      capabilityId: "capability.reservations",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const record = reservationService.create({
        branchId: DEFAULT_RESERVATION_SCOPE.branchId,
        partySize: typeof input.partySize === "number" ? input.partySize : 2,
        scheduledDate: typeof input.scheduledDate === "string" ? input.scheduledDate : "2026-02-16",
        startTime: typeof input.startTime === "string" ? input.startTime : "19:00",
        guestFirstName: typeof input.guestFirstName === "string" ? input.guestFirstName : "Guest",
        guestLastName: typeof input.guestLastName === "string" ? input.guestLastName : "Name",
        guestEmail: typeof input.guestEmail === "string" ? input.guestEmail : undefined,
        guestPhone: typeof input.guestPhone === "string" ? input.guestPhone : undefined,
        isVip: input.isVip === true,
      });

      return {
        reservationId: record.reservation.id,
        confirmationCode: record.reservation.confirmationCode,
      };
    },
  ),
  defineReservationTool(
    {
      id: RESERVATION_AI_TOOL_IDS.UPDATE,
      name: "Update Reservation",
      description: "Update reservation status, party size, or schedule.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_MANAGE],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["reservationId"],
        properties: {
          reservationId: { type: "string" },
          status: { type: "string" },
          partySize: { type: "number" },
          startTime: { type: "string" },
        },
      },
      outputSchema: {
        type: "object",
        properties: { updated: { type: "boolean" }, reservationId: { type: "string" } },
      },
      supportedAgents: RESERVATION_AGENT_SLUGS,
      capabilityId: "capability.reservations",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const reservationId = typeof input.reservationId === "string" ? input.reservationId : "";
      const updated = reservationService.update({
        reservationId,
        status: typeof input.status === "string" ? (input.status as ReservationStatus) : undefined,
        partySize: typeof input.partySize === "number" ? input.partySize : undefined,
        startTime: typeof input.startTime === "string" ? input.startTime : undefined,
      });

      return { updated: Boolean(updated), reservationId };
    },
  ),
  defineReservationTool(
    {
      id: RESERVATION_AI_TOOL_IDS.CANCEL,
      name: "Cancel Reservation",
      description: "Cancel a reservation with reason.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_MANAGE],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["reservationId", "reason"],
        properties: {
          reservationId: { type: "string" },
          reason: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: RESERVATION_AGENT_SLUGS,
      capabilityId: "capability.reservations",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const cancelled = reservationService.cancel({
        reservationId: typeof input.reservationId === "string" ? input.reservationId : "",
        reason: typeof input.reason === "string" ? input.reason : "Guest request",
      });

      return cancelled
        ? { reservationId: cancelled.reservation.id, status: cancelled.reservation.status }
        : { error: "Reservation not found." };
    },
  ),
  defineReservationTool(
    {
      id: RESERVATION_AI_TOOL_IDS.RECOMMEND_TABLE,
      name: "Recommend Best Table",
      description: "Recommend optimal table for a reservation.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_READ],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["reservationId"],
        properties: { reservationId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.OPERATIONS, BUILTIN_AGENT_SLUGS.ANALYTICS],
      capabilityId: "capability.reservations",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const reservationId = typeof input.reservationId === "string" ? input.reservationId : "";
      return recommendBestTable(reservationId) ?? { error: "Reservation not found." };
    },
  ),
  defineReservationTool(
    {
      id: RESERVATION_AI_TOOL_IDS.PREDICT_NO_SHOW,
      name: "Predict No Shows",
      description: "Predict reservations at risk of no-show.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_READ],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: { limit: { type: "number" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.reservations",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const limit = typeof input.limit === "number" ? input.limit : 5;
      return predictNoShows(limit);
    },
  ),
  defineReservationTool(
    {
      id: RESERVATION_AI_TOOL_IDS.OPTIMIZE_SEATING,
      name: "Optimize Seating",
      description: "Recommend seating optimizations for upcoming reservations.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_READ],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.OPERATIONS, BUILTIN_AGENT_SLUGS.ANALYTICS],
      capabilityId: "capability.reservations",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => optimizeSeatingForBranch(),
  ),
  defineReservationTool(
    {
      id: RESERVATION_AI_TOOL_IDS.MANAGE_WAITLIST,
      name: "Manage Waitlist",
      description: "List and manage waitlist entries for a branch.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_MANAGE],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        properties: { branchId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.OPERATIONS, BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT],
      capabilityId: "capability.reservations",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const branchId =
        typeof input.branchId === "string" ? input.branchId : DEFAULT_RESERVATION_SCOPE.branchId;
      return manageWaitlist(branchId);
    },
  ),
  defineReservationTool(
    {
      id: RESERVATION_AI_TOOL_IDS.SEND_REMINDER,
      name: "Send Reservation Reminder",
      description: "Send a reminder for an upcoming reservation.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_MANAGE],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS, PLATFORM_MODULES.NOTIFICATIONS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["reservationId"],
        properties: { reservationId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.MARKETING, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.reservations",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "low" },
    },
    async (input) => {
      const reservationId = typeof input.reservationId === "string" ? input.reservationId : "";
      return sendReservationReminder(reservationId) ?? { error: "Reservation not found." };
    },
  ),
];

let registered = false;

/** Registers Reservation platform tools with the AI Tool Platform (mock, idempotent). */
export function registerReservationAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of RESERVATION_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}

registerReservationAiTools();
