export {
  hasRequiredPermissions,
  hasRequiredModules,
  satisfiesTenantScope,
  satisfiesBranchScope,
  isAgentAllowed,
  evaluateToolAccess,
} from "@/modules/ai-tools/utils/tool-permissions";

export function createExecutionId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
