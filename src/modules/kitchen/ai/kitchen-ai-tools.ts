import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import {
  PLATFORM_MODULES,
  PLATFORM_TOOL_PERMISSIONS,
} from "@/modules/ai-tools/constants/platform-tools";
import { registerPlatformTool } from "@/modules/ai-tools/registry/platform-tool-registry";
import type { RegisteredPlatformTool } from "@/modules/ai-tools/types/platform-tool";
import {
  assignStationForTicket,
  detectKitchenBottlenecks,
  estimatePreparationTime,
  optimizeKitchenQueue,
  predictKitchenDelays,
  recommendWorkflowImprovements,
  routeOrderToStation,
} from "@/modules/kitchen/ai/kitchen-ai-context";
import { KITCHEN_AI_TOOL_IDS } from "@/modules/kitchen/constants/kitchen-status";

function defineKitchenTool(
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
      category: "Kitchen",
      tags: ["kitchen", "kds", "operations"],
      readOnly: false,
      confirmationRequired: false,
      dryRunSupported: true,
      riskLevel: "low",
      ...partial.metadata,
    },
    handler,
  };
}

const KITCHEN_AGENT_SLUGS = [
  BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
  BUILTIN_AGENT_SLUGS.OPERATIONS,
  BUILTIN_AGENT_SLUGS.ANALYTICS,
];

export const KITCHEN_AI_TOOLS: RegisteredPlatformTool[] = [
  defineKitchenTool(
    {
      id: KITCHEN_AI_TOOL_IDS.ROUTE_ORDER,
      name: "Route Order",
      description: "Recommend optimal station routing for a kitchen order.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.KITCHEN_MANAGE],
      requiredModules: [PLATFORM_MODULES.KITCHEN, PLATFORM_MODULES.ORDERS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["kitchenOrderId"],
        properties: { kitchenOrderId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: KITCHEN_AGENT_SLUGS,
      capabilityId: "capability.kitchen",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const kitchenOrderId = typeof input.kitchenOrderId === "string" ? input.kitchenOrderId : "";
      return routeOrderToStation(kitchenOrderId) ?? { error: "Kitchen order not found." };
    },
  ),
  defineKitchenTool(
    {
      id: KITCHEN_AI_TOOL_IDS.ASSIGN_STATION,
      name: "Assign Station",
      description: "Assign a kitchen ticket to a prep station.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.KITCHEN_MANAGE],
      requiredModules: [PLATFORM_MODULES.KITCHEN],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["ticketId"],
        properties: {
          ticketId: { type: "string" },
          stationId: { type: "string" },
        },
      },
      outputSchema: { type: "object" },
      supportedAgents: KITCHEN_AGENT_SLUGS,
      capabilityId: "capability.kitchen",
      skillIds: [],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    async (input) => {
      const ticketId = typeof input.ticketId === "string" ? input.ticketId : "";
      const stationId = typeof input.stationId === "string" ? input.stationId : undefined;
      return assignStationForTicket(ticketId, stationId) ?? { error: "Ticket not found." };
    },
  ),
  defineKitchenTool(
    {
      id: KITCHEN_AI_TOOL_IDS.PREDICT_DELAYS,
      name: "Predict Delays",
      description: "Predict kitchen orders at risk of delay.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.KITCHEN_READ],
      requiredModules: [PLATFORM_MODULES.KITCHEN, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: { limit: { type: "number" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.kitchen",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const limit = typeof input.limit === "number" ? input.limit : 5;
      return predictKitchenDelays(limit);
    },
  ),
  defineKitchenTool(
    {
      id: KITCHEN_AI_TOOL_IDS.OPTIMIZE_QUEUE,
      name: "Optimize Kitchen Queue",
      description: "Recommend optimal kitchen queue ordering.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.KITCHEN_READ],
      requiredModules: [PLATFORM_MODULES.KITCHEN, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: KITCHEN_AGENT_SLUGS,
      capabilityId: "capability.kitchen",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => optimizeKitchenQueue(),
  ),
  defineKitchenTool(
    {
      id: KITCHEN_AI_TOOL_IDS.ESTIMATE_PREP_TIME,
      name: "Estimate Preparation Time",
      description: "Estimate preparation time for a kitchen order.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.KITCHEN_READ],
      requiredModules: [PLATFORM_MODULES.KITCHEN, PLATFORM_MODULES.MENU],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        required: ["kitchenOrderId"],
        properties: { kitchenOrderId: { type: "string" } },
      },
      outputSchema: { type: "object" },
      supportedAgents: KITCHEN_AGENT_SLUGS,
      capabilityId: "capability.kitchen",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async (input) => {
      const kitchenOrderId = typeof input.kitchenOrderId === "string" ? input.kitchenOrderId : "";
      return estimatePreparationTime(kitchenOrderId) ?? { error: "Kitchen order not found." };
    },
  ),
  defineKitchenTool(
    {
      id: KITCHEN_AI_TOOL_IDS.RECOMMEND_WORKFLOW,
      name: "Recommend Workflow Improvements",
      description: "Recommend kitchen workflow improvements based on performance metrics.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.KITCHEN_READ],
      requiredModules: [PLATFORM_MODULES.KITCHEN, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.kitchen",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => recommendWorkflowImprovements(),
  ),
  defineKitchenTool(
    {
      id: KITCHEN_AI_TOOL_IDS.DETECT_BOTTLENECKS,
      name: "Detect Bottlenecks",
      description: "Detect station bottlenecks in the kitchen.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.KITCHEN_READ],
      requiredModules: [PLATFORM_MODULES.KITCHEN, PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: { type: "object", properties: {} },
      outputSchema: { type: "object" },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.kitchen",
      skillIds: [],
      metadata: { readOnly: true },
    },
    async () => detectKitchenBottlenecks(),
  ),
];

let registered = false;

/** Registers Kitchen platform tools with the AI Tool Platform (mock, idempotent). */
export function registerKitchenAiTools(): void {
  if (registered) {
    return;
  }

  for (const tool of KITCHEN_AI_TOOLS) {
    registerPlatformTool(tool);
  }

  registered = true;
}

registerKitchenAiTools();
