import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import {
  PLATFORM_MODULES,
  PLATFORM_TOOL_PERMISSIONS,
} from "@/modules/ai-tools/constants/platform-tools";
import { registerPlatformTool } from "@/modules/ai-tools/registry/platform-tool-registry";
import type { RegisteredPlatformTool } from "@/modules/ai-tools/types/platform-tool";
import {
  optimizeSeatingLayout,
  predictWaitTime,
  recommendTableForParty,
} from "@/modules/table-management/ai/table-ai-context";
import { MOCK_FLOOR_RECORD } from "@/modules/table-management/constants/mock-data";
import { TABLE_AI_TOOL_IDS } from "@/modules/table-management/constants/table-status";
import { tableManagementService } from "@/modules/table-management/services/table-management.service";
import type { TableStatus } from "@/modules/table-management/constants/table-status";

function defineTableTool(
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
      category: "Table Management",
      tags: ["tables", "seating", "floor-plan"],
      readOnly: false,
      confirmationRequired: false,
      dryRunSupported: true,
      riskLevel: "low",
      ...partial.metadata,
    },
    handler,
  };
}

const TABLE_AGENT_SLUGS = [
  BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
  BUILTIN_AGENT_SLUGS.OPERATIONS,
  BUILTIN_AGENT_SLUGS.ANALYTICS,
];

export const TABLE_MANAGEMENT_AI_TOOLS: RegisteredPlatformTool[] = [
  defineTableTool(
    {
      id: TABLE_AI_TOOL_IDS.CREATE_TABLE,
      name: "Create Table",
      description: "Create a new dining table on a floor plan.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_MANAGE],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS, PLATFORM_MODULES.ORDERS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["label", "seatCapacity"],
        properties: {
          label: { type: "string" },
          seatCapacity: { type: "number" },
          zoneId: { type: "string" },
          isVip: { type: "boolean" },
        },
      },
      outputSchema: {
        type: "object",
        properties: { tableId: { type: "string" }, label: { type: "string" } },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.OPERATIONS, BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT],
      capabilityId: "capability.tables",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const floor = MOCK_FLOOR_RECORD;
      const zoneId =
        typeof input.zoneId === "string" ? input.zoneId : (floor.zones[0]?.id ?? "zone-default");

      const record = tableManagementService.createTable({
        floorId: floor.floor.id,
        zoneId,
        label: typeof input.label === "string" ? input.label : "New Table",
        seatCapacity: typeof input.seatCapacity === "number" ? input.seatCapacity : 4,
        isVip: input.isVip === true,
      });

      return { tableId: record.table.id, label: record.table.label };
    },
  ),
  defineTableTool(
    {
      id: TABLE_AI_TOOL_IDS.UPDATE_TABLE,
      name: "Update Table",
      description: "Update table status, label, or capacity.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_MANAGE],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["tableId"],
        properties: {
          tableId: { type: "string" },
          label: { type: "string" },
          status: { type: "string" },
          seatCapacity: { type: "number" },
        },
      },
      outputSchema: {
        type: "object",
        properties: { updated: { type: "boolean" }, tableId: { type: "string" } },
      },
      supportedAgents: TABLE_AGENT_SLUGS,
      capabilityId: "capability.tables",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const tableId = typeof input.tableId === "string" ? input.tableId : "";
      const updated = tableManagementService.updateTable({
        tableId,
        label: typeof input.label === "string" ? input.label : undefined,
        status: typeof input.status === "string" ? (input.status as TableStatus) : undefined,
        seatCapacity: typeof input.seatCapacity === "number" ? input.seatCapacity : undefined,
      });

      return { updated: Boolean(updated), tableId };
    },
  ),
  defineTableTool(
    {
      id: TABLE_AI_TOOL_IDS.MERGE_TABLES,
      name: "Merge Tables",
      description: "Merge adjacent tables into a single seating unit.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_MANAGE],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["sourceTableIds", "mergedLabel"],
        properties: {
          sourceTableIds: { type: "array", items: { type: "string" } },
          mergedLabel: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: TABLE_AGENT_SLUGS,
      capabilityId: "capability.tables",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const sourceTableIds = Array.isArray(input.sourceTableIds)
        ? input.sourceTableIds.filter((id): id is string => typeof id === "string")
        : [];

      const merged = tableManagementService.mergeTables({
        floorId: MOCK_FLOOR_RECORD.floor.id,
        sourceTableIds,
        mergedLabel: typeof input.mergedLabel === "string" ? input.mergedLabel : "Merged Table",
      });

      return merged
        ? {
            tableId: merged.table.id,
            label: merged.table.label,
            seatCapacity: merged.table.seatCapacity,
          }
        : { error: "Unable to merge tables." };
    },
  ),
  defineTableTool(
    {
      id: TABLE_AI_TOOL_IDS.SPLIT_TABLES,
      name: "Split Tables",
      description: "Split a merged or large table into smaller units.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_MANAGE],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["sourceTableId", "newLabels"],
        properties: {
          sourceTableId: { type: "string" },
          newLabels: { type: "array", items: { type: "string" } },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: TABLE_AGENT_SLUGS,
      capabilityId: "capability.tables",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const newLabels = Array.isArray(input.newLabels)
        ? input.newLabels.filter((label): label is string => typeof label === "string")
        : ["Split A", "Split B"];

      const split = tableManagementService.splitTable({
        floorId: MOCK_FLOOR_RECORD.floor.id,
        sourceTableId: typeof input.sourceTableId === "string" ? input.sourceTableId : "",
        newLabels,
      });

      return {
        created:
          split?.map((record) => ({
            tableId: record.table.id,
            label: record.table.label,
          })) ?? [],
      };
    },
  ),
  defineTableTool(
    {
      id: TABLE_AI_TOOL_IDS.ASSIGN_TABLE,
      name: "Assign Table",
      description: "Assign a party to a table.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_MANAGE],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS, PLATFORM_MODULES.ORDERS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["tableId", "partySize"],
        properties: {
          tableId: { type: "string" },
          partySize: { type: "number" },
          guestName: { type: "string" },
          reservationId: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: TABLE_AGENT_SLUGS,
      capabilityId: "capability.tables",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "low" },
    },
    async (input) => {
      const assigned = tableManagementService.assignTable({
        tableId: typeof input.tableId === "string" ? input.tableId : "",
        partySize: typeof input.partySize === "number" ? input.partySize : 2,
        guestName: typeof input.guestName === "string" ? input.guestName : undefined,
        reservationId: typeof input.reservationId === "string" ? input.reservationId : undefined,
      });

      return assigned
        ? { tableId: assigned.table.id, status: assigned.table.status }
        : { error: "Table not found." };
    },
  ),
  defineTableTool(
    {
      id: TABLE_AI_TOOL_IDS.RECOMMEND_TABLE,
      name: "Recommend Table",
      description: "Recommend the best available table for a party size.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_READ],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["partySize"],
        properties: {
          partySize: { type: "number" },
          floorId: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.OPERATIONS, BUILTIN_AGENT_SLUGS.ANALYTICS],
      capabilityId: "capability.tables",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const partySize = typeof input.partySize === "number" ? input.partySize : 2;
      const floorId = typeof input.floorId === "string" ? input.floorId : undefined;
      return recommendTableForParty(partySize, floorId);
    },
  ),
  defineTableTool(
    {
      id: TABLE_AI_TOOL_IDS.PREDICT_WAIT_TIME,
      name: "Predict Wait Time",
      description: "Predict guest wait time based on floor occupancy.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_READ],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["partySize"],
        properties: {
          partySize: { type: "number" },
          floorId: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.tables",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const partySize = typeof input.partySize === "number" ? input.partySize : 2;
      const floorId = typeof input.floorId === "string" ? input.floorId : undefined;
      return predictWaitTime(partySize, floorId);
    },
  ),
  defineTableTool(
    {
      id: TABLE_AI_TOOL_IDS.OPTIMIZE_SEATING,
      name: "Optimize Seating",
      description: "Recommend seating layout optimizations for peak service.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_READ],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: { floorId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.tables",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const floorId = typeof input.floorId === "string" ? input.floorId : undefined;
      return optimizeSeatingLayout(floorId);
    },
  ),
];

let registered = false;

/** Registers Table Management platform tools with the AI Tool Platform (mock, idempotent). */
export function registerTableManagementAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of TABLE_MANAGEMENT_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}
