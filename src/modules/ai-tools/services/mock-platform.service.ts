import { DEFAULT_MOCK_AI_SCOPE } from "@/modules/ai/constants/mock-data";
import { capabilityRegistry } from "@/modules/ai-tools/registry/capability-registry";
import { skillRegistry } from "@/modules/ai-tools/registry/skill-registry";
import { platformToolRegistry } from "@/modules/ai-tools/registry/platform-tool-registry";
import { toolDiscoveryEngine } from "@/modules/ai-tools/services/tool-discovery-engine";
import type { PlatformExecutionContext } from "@/modules/ai-tools/types/platform-tool";
import type { AiToolsPlatformContextValue } from "@/modules/ai-tools/types";

export interface PlatformContextInput {
  agentSlug?: string;
  userId?: string;
  tenantId?: string;
  workspaceId?: string;
  businessId?: string;
  branchId?: string;
  permissions?: string[];
  installedModules?: string[];
}

export function buildPlatformExecutionContext(
  input: PlatformContextInput = {},
): PlatformExecutionContext {
  return {
    agentSlug: input.agentSlug ?? "business-assistant",
    userId: input.userId ?? "user-harbour-owner",
    tenantId: input.tenantId ?? DEFAULT_MOCK_AI_SCOPE.tenantId,
    workspaceId: input.workspaceId ?? DEFAULT_MOCK_AI_SCOPE.workspaceId,
    businessId: input.businessId ?? DEFAULT_MOCK_AI_SCOPE.businessId,
    branchId: input.branchId ?? DEFAULT_MOCK_AI_SCOPE.branchId,
    permissions: new Set(input.permissions ?? ["customers.read", "orders.read", "analytics.read"]),
    installedModules: new Set(
      input.installedModules ?? [
        "crm",
        "reservations",
        "menu",
        "orders",
        "kitchen",
        "pos",
        "inventory",
        "finance",
        "marketing",
        "analytics",
        "notifications",
      ],
    ),
  };
}

export function buildPlatformSnapshot(input: PlatformContextInput = {}) {
  const context = buildPlatformExecutionContext(input);

  return {
    context,
    tools: toolDiscoveryEngine.discoverTools({ context, agentSlug: context.agentSlug }),
    skills: toolDiscoveryEngine.discoverSkills({
      agentSlug: context.agentSlug,
      installedModules: Array.from(context.installedModules),
    }),
    capabilities: capabilityRegistry.listForAgent(context.agentSlug),
    allTools: platformToolRegistry.list(),
    allSkills: skillRegistry.list(),
  };
}

export function createPlatformContextValue(
  input: PlatformContextInput = {},
): Omit<AiToolsPlatformContextValue, "setActiveAgent" | "refresh"> {
  const snapshot = buildPlatformSnapshot(input);

  return {
    context: snapshot.context,
    tools: snapshot.tools,
    skills: snapshot.skills,
    capabilities: snapshot.capabilities,
  };
}
