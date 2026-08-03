export { AI_TOOLS_ROUTES, AI_TOOLS_NAV_ITEMS } from "@/modules/ai-tools/constants/routes";
export {
  AI_TOOL_CATEGORIES,
  AI_TOOL_CATEGORY_LABELS,
} from "@/modules/ai-tools/constants/categories";
export {
  PLATFORM_TOOL_IDS,
  PLATFORM_MODULES,
  PLATFORM_TOOL_PERMISSIONS,
  DEFAULT_PLATFORM_TOOL_VERSION,
  type PlatformToolId,
} from "@/modules/ai-tools/constants/platform-tools";
export { PLATFORM_SKILL_SLUGS, type PlatformSkillSlug } from "@/modules/ai-tools/constants/skills";
export {
  AI_TOOLS_INTEGRATION_POINTS,
  type AiToolsIntegrationPoint,
} from "@/modules/ai-tools/constants/integration-points";

export { AiToolsNav } from "@/modules/ai-tools/components/ai-tools-nav";
export { AiToolsDashboard } from "@/modules/ai-tools/components/ai-tools-dashboard";
export { AiToolsLists } from "@/modules/ai-tools/components/ai-tools-lists";

export { registerTool } from "@/modules/ai-tools/registry/tool-registry";

export type * from "@/modules/ai-tools/types";

export { MOCK_PLATFORM_TOOLS } from "@/modules/ai-tools/tools";
export { BUILTIN_PLATFORM_SKILLS } from "@/modules/ai-tools/skills";

export {
  PlatformToolRegistry,
  platformToolRegistry,
  registerPlatformTool,
  getPlatformTool,
  listPlatformTools,
} from "@/modules/ai-tools/registry/platform-tool-registry";
export {
  SkillRegistry,
  skillRegistry,
  registerPlatformSkill,
  listPlatformSkills,
} from "@/modules/ai-tools/registry/skill-registry";
export {
  CapabilityRegistry,
  capabilityRegistry,
  listCapabilities,
  BUILTIN_CAPABILITIES,
} from "@/modules/ai-tools/registry/capability-registry";

export { ToolExecutor, toolExecutor } from "@/modules/ai-tools/executors/tool-executor";
export { SkillExecutor, skillExecutor } from "@/modules/ai-tools/executors/skill-executor";

export {
  ToolDiscoveryEngine,
  toolDiscoveryEngine,
  type ToolDiscoveryFilter,
} from "@/modules/ai-tools/services/tool-discovery-engine";
export {
  ToolMetadataService,
  toolMetadataService,
} from "@/modules/ai-tools/services/tool-metadata";
export {
  ToolVersioningService,
  toolVersioningService,
} from "@/modules/ai-tools/services/tool-versioning";
export {
  buildPlatformExecutionContext,
  buildPlatformSnapshot,
  createPlatformContextValue,
  type PlatformContextInput,
} from "@/modules/ai-tools/services/mock-platform.service";

export { AiToolsPlatformProvider } from "@/modules/ai-tools/providers/platform-provider";
export { AiToolsPlatformContext } from "@/modules/ai-tools/contexts/platform-context";

export {
  useAiToolsPlatform,
  useAiToolsPlatformContext,
} from "@/modules/ai-tools/hooks/use-ai-tools-platform";
export { useToolExecution } from "@/modules/ai-tools/hooks/use-tool-execution";
export { useSkillExecution } from "@/modules/ai-tools/hooks/use-skill-execution";

export {
  hasRequiredPermissions,
  hasRequiredModules,
  satisfiesTenantScope,
  satisfiesBranchScope,
  isAgentAllowed,
  evaluateToolAccess,
  createExecutionId,
} from "@/modules/ai-tools/utils/platform-utils";
