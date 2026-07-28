import type { AiTool } from "@prisma/client";

import type { DiscoveredTool, ToolDefinition } from "@/modules/ai-tools/types/tool-types";

export interface DiscoveryFilter {
  permissions: string[];
  industry: string | null;
  installedModules?: string[];
  category?: AiTool["category"];
}

function hasRequiredPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (requiredPermissions.length === 0) {
    return true;
  }

  return requiredPermissions.every((permission) => userPermissions.includes(permission));
}

function matchesIndustry(supportedIndustries: string[], industry: string | null): boolean {
  if (supportedIndustries.length === 0) {
    return true;
  }

  if (!industry) {
    return true;
  }

  return supportedIndustries.some((value) => value.toLowerCase() === industry.toLowerCase());
}

function matchesModule(module: string, installedModules?: string[]): boolean {
  if (!installedModules || installedModules.length === 0) {
    return true;
  }

  return installedModules.includes(module);
}

export function discoverToolsFromDefinitions(
  definitions: ToolDefinition[],
  dbRecords: AiTool[],
  filter: DiscoveryFilter,
): DiscoveredTool[] {
  const activeRecords = new Map(
    dbRecords
      .filter((record) => record.status === "ACTIVE")
      .map((record) => [record.toolId, record]),
  );

  return definitions
    .filter((definition) => activeRecords.has(definition.toolId))
    .filter((definition) =>
      hasRequiredPermissions(filter.permissions, definition.requiredPermissions ?? []),
    )
    .filter((definition) => matchesIndustry(definition.supportedIndustries ?? [], filter.industry))
    .filter((definition) => matchesModule(definition.module, filter.installedModules))
    .filter((definition) => !filter.category || definition.category === filter.category)
    .map((definition) => {
      const record = activeRecords.get(definition.toolId)!;

      return {
        toolId: definition.toolId,
        name: definition.name,
        description: definition.description,
        module: definition.module,
        category: definition.category,
        version: record.version,
        riskLevel: record.riskLevel,
        readOnly: record.readOnly,
        confirmationRequired: record.confirmationRequired,
        dryRunSupported: record.dryRunSupported,
      };
    });
}
