import type { PlatformCeoToolDefinition } from "@/modules/control-center/platform-ceo/types/platform-ceo.types";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { PLATFORM_CEO_AGENT_SLUG } from "@/modules/control-center/platform-ceo/constants/platform-ceo";

const READ_ONLY_METADATA = {
  readOnly: true,
  confirmationRequired: false,
  dryRunSupported: false,
  riskLevel: "low" as const,
};

function baseTool(
  id: string,
  name: string,
  description: string,
  domain: PlatformCeoToolDefinition["domain"],
  category: string,
  permission: string,
): PlatformCeoToolDefinition {
  return {
    id,
    name,
    description,
    version: "1.0.0",
    domain,
    requiredPermissions: [permission],
    requiredModules: ["control-center"],
    requiredTenantScope: "none",
    requiredBranchScope: "none",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional query or filter." },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Read-only summary payload." },
      },
    },
    supportedAgents: [PLATFORM_CEO_AGENT_SLUG],
    capabilityId: `ceo.${domain}`,
    skillIds: [`ceo.${domain}.read`],
    isEnabled: true,
    metadata: {
      category,
      tags: ["platform-ceo", domain, "read-only"],
      ...READ_ONLY_METADATA,
    },
  };
}

const CEO_TOOL_DEFINITIONS: PlatformCeoToolDefinition[] = [
  baseTool(
    "ceo.platform_intelligence",
    "Platform Intelligence",
    "Read platform intelligence scores, trends, alerts, and recommendations.",
    "platform_intelligence",
    "Intelligence",
    PERMISSION_CODES.CONTROL_CENTER_INTELLIGENCE,
  ),
  baseTool(
    "ceo.businesses",
    "Businesses",
    "Read business directory metrics and health rankings.",
    "businesses",
    "Tenants",
    PERMISSION_CODES.CONTROL_CENTER_BUSINESSES,
  ),
  baseTool(
    "ceo.analytics",
    "Analytics",
    "Read platform analytics aggregates and trend data.",
    "analytics",
    "Analytics",
    PERMISSION_CODES.CONTROL_CENTER_ANALYTICS,
  ),
  baseTool(
    "ceo.ai_usage",
    "AI Usage",
    "Read platform-wide AI usage, cost, and adoption metrics.",
    "ai_usage",
    "AI",
    PERMISSION_CODES.CONTROL_CENTER_AI,
  ),
  baseTool(
    "ceo.security",
    "Security",
    "Read security posture, sessions, and account risk signals.",
    "security",
    "Security",
    PERMISSION_CODES.CONTROL_CENTER_SECURITY,
  ),
  baseTool(
    "ceo.monitoring",
    "Monitoring",
    "Read monitoring alerts, incidents, and infrastructure health.",
    "monitoring",
    "Monitoring",
    PERMISSION_CODES.CONTROL_CENTER_MONITORING,
  ),
  baseTool(
    "ceo.billing",
    "Billing",
    "Read billing, invoices, payments, and commercial metrics.",
    "billing",
    "Billing",
    PERMISSION_CODES.CONTROL_CENTER_BILLING,
  ),
  baseTool(
    "ceo.feature_flags",
    "Feature Flags",
    "Read feature flag rollout status across the platform.",
    "feature_flags",
    "Features",
    PERMISSION_CODES.CONTROL_CENTER_FEATURE_FLAGS,
  ),
  baseTool(
    "ceo.support",
    "Support",
    "Read support tickets, incidents, and service status.",
    "support",
    "Support",
    PERMISSION_CODES.CONTROL_CENTER_SUPPORT,
  ),
  baseTool(
    "ceo.operators",
    "Operators",
    "Read Control Center operator directory and roles.",
    "operators",
    "Governance",
    PERMISSION_CODES.CONTROL_CENTER_OPERATORS,
  ),
  baseTool(
    "ceo.settings",
    "Settings",
    "Read platform configuration and governance settings.",
    "settings",
    "Settings",
    PERMISSION_CODES.CONTROL_CENTER_SETTINGS,
  ),
  baseTool(
    "ceo.workspace",
    "Workspace",
    "Read workspace-level metrics and scope summaries.",
    "workspace",
    "Workspaces",
    PERMISSION_CODES.CONTROL_CENTER_WORKSPACES,
  ),
];

const registry = new Map<string, PlatformCeoToolDefinition>(
  CEO_TOOL_DEFINITIONS.map((tool) => [tool.id, tool]),
);

/** CEO tool registry — definitions only; no execution handlers. */
export class PlatformCeoToolRegistry {
  list(): PlatformCeoToolDefinition[] {
    return Array.from(registry.values()).sort((left, right) => left.name.localeCompare(right.name));
  }

  get(id: string): PlatformCeoToolDefinition | undefined {
    return registry.get(id);
  }

  listForPermissions(permissions: ReadonlySet<string> | string[]): PlatformCeoToolDefinition[] {
    const permissionSet =
      permissions instanceof Set ? permissions : new Set(permissions);

    return this.list().filter((tool) =>
      tool.requiredPermissions.every(
        (permission) =>
          permissionSet.has(permission) ||
          permissionSet.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN),
      ),
    );
  }
}

export const platformCeoToolRegistry = new PlatformCeoToolRegistry();

export function listPlatformCeoTools(): PlatformCeoToolDefinition[] {
  return platformCeoToolRegistry.list();
}
