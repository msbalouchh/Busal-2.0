import type {
  PlatformExecutionContext,
  PlatformToolDefinition,
} from "@/modules/ai-tools/types/platform-tool";

export function hasRequiredPermissions(
  context: PlatformExecutionContext,
  requiredPermissions: string[],
): boolean {
  if (requiredPermissions.length === 0) {
    return true;
  }

  return requiredPermissions.every((permission) => context.permissions.has(permission));
}

export function hasRequiredModules(
  context: PlatformExecutionContext,
  requiredModules: string[],
): boolean {
  if (requiredModules.length === 0) {
    return true;
  }

  return requiredModules.every((module) => context.installedModules.has(module));
}

export function satisfiesTenantScope(
  context: PlatformExecutionContext,
  requirement: PlatformToolDefinition["requiredTenantScope"],
): boolean {
  if (requirement === "none") {
    return true;
  }

  if (requirement === "optional") {
    return true;
  }

  return Boolean(context.tenantId);
}

export function satisfiesBranchScope(
  context: PlatformExecutionContext,
  requirement: PlatformToolDefinition["requiredBranchScope"],
): boolean {
  if (requirement === "none") {
    return true;
  }

  if (requirement === "optional") {
    return true;
  }

  return Boolean(context.branchId);
}

export function isAgentAllowed(tool: PlatformToolDefinition, agentSlug: string): boolean {
  return tool.supportedAgents.includes(agentSlug);
}

export function evaluateToolAccess(
  tool: PlatformToolDefinition,
  context: PlatformExecutionContext,
): { allowed: boolean; reason: string | null } {
  if (!tool.isEnabled) {
    return { allowed: false, reason: `Tool "${tool.id}" is disabled.` };
  }

  if (!isAgentAllowed(tool, context.agentSlug)) {
    return { allowed: false, reason: `Agent "${context.agentSlug}" cannot use "${tool.id}".` };
  }

  if (!hasRequiredPermissions(context, tool.requiredPermissions)) {
    return { allowed: false, reason: "Missing required permissions." };
  }

  if (!hasRequiredModules(context, tool.requiredModules)) {
    return { allowed: false, reason: "Required modules not installed." };
  }

  if (!satisfiesTenantScope(context, tool.requiredTenantScope)) {
    return { allowed: false, reason: "Tenant scope required." };
  }

  if (!satisfiesBranchScope(context, tool.requiredBranchScope)) {
    return { allowed: false, reason: "Branch scope required." };
  }

  return { allowed: true, reason: null };
}
