import { platformToolRegistry } from "@/modules/ai-tools/registry/platform-tool-registry";
import { skillRegistry } from "@/modules/ai-tools/registry/skill-registry";
import { capabilityRegistry } from "@/modules/ai-tools/registry/capability-registry";
import { evaluateToolAccess } from "@/modules/ai-tools/utils/tool-permissions";
import type { CapabilityDiscoveryFilter } from "@/modules/ai-tools/types/capability";
import type {
  DiscoveredPlatformTool,
  PlatformExecutionContext,
} from "@/modules/ai-tools/types/platform-tool";
import type { PlatformSkillDefinition } from "@/modules/ai-tools/types/skill";

export interface ToolDiscoveryFilter {
  agentSlug?: string;
  permissions?: string[];
  installedModules?: string[];
  context?: PlatformExecutionContext;
}

/** Discovers tools, skills, and capabilities available to an agent in context. */
export class ToolDiscoveryEngine {
  discoverTools(filter: ToolDiscoveryFilter = {}): DiscoveredPlatformTool[] {
    const context = filter.context ?? buildDiscoveryContext(filter);

    return platformToolRegistry
      .listEnabled()
      .filter((tool) => !filter.agentSlug || tool.supportedAgents.includes(filter.agentSlug))
      .filter((tool) => evaluateToolAccess(tool, context).allowed)
      .map((tool) => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        version: tool.version,
        requiredPermissions: tool.requiredPermissions,
        requiredModules: tool.requiredModules,
        supportedAgents: tool.supportedAgents,
        metadata: tool.metadata,
      }));
  }

  discoverSkills(filter: ToolDiscoveryFilter = {}): PlatformSkillDefinition[] {
    const skills = filter.agentSlug
      ? skillRegistry.listForAgent(filter.agentSlug)
      : skillRegistry.listEnabled();

    if (!filter.installedModules || filter.installedModules.length === 0) {
      return skills;
    }

    return skills.filter((skill) =>
      skill.requiredModules.every((module) => filter.installedModules?.includes(module)),
    );
  }

  discoverCapabilities(
    filter: CapabilityDiscoveryFilter = {},
  ): ReturnType<typeof capabilityRegistry.list> {
    let results = capabilityRegistry.list();

    if (filter.agentSlug) {
      results = results.filter((capability) =>
        capability.supportedAgents.includes(filter.agentSlug!),
      );
    }

    if (filter.installedModules && filter.installedModules.length > 0) {
      results = results.filter((capability) =>
        filter.installedModules?.includes(capability.module),
      );
    }

    return results;
  }
}

function buildDiscoveryContext(filter: ToolDiscoveryFilter): PlatformExecutionContext {
  return {
    agentSlug: filter.agentSlug ?? "",
    userId: "discovery-user",
    tenantId: "tenant-harbour",
    workspaceId: "ws-harbour-kitchen",
    businessId: "biz-harbour-kitchen",
    branchId: "branch-harbour-main",
    permissions: new Set(filter.permissions ?? []),
    installedModules: new Set(filter.installedModules ?? []),
  };
}

export const toolDiscoveryEngine = new ToolDiscoveryEngine();
