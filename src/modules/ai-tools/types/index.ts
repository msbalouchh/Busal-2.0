import type {
  DiscoveredPlatformTool,
  PlatformExecutionContext,
} from "@/modules/ai-tools/types/platform-tool";
import type { RegisteredPlatformSkill } from "@/modules/ai-tools/types/skill";
import type { PlatformCapabilityDefinition } from "@/modules/ai-tools/types/capability";

export interface AiToolsPlatformContextValue {
  context: PlatformExecutionContext;
  tools: DiscoveredPlatformTool[];
  skills: RegisteredPlatformSkill[];
  capabilities: PlatformCapabilityDefinition[];
  setActiveAgent: (agentSlug: string) => void;
  refresh: () => void;
}

export type {
  PlatformJsonSchema,
  TenantScopeRequirement,
  BranchScopeRequirement,
  PlatformToolDefinition,
  PlatformToolMetadata,
  PlatformToolVersion,
  PlatformToolHandler,
  RegisteredPlatformTool,
  PlatformExecutionContext,
  PlatformToolExecutionRequest,
  PlatformToolExecutionResult,
  DiscoveredPlatformTool,
} from "@/modules/ai-tools/types/platform-tool";
export type {
  PlatformSkillDefinition,
  PlatformSkillHandler,
  RegisteredPlatformSkill,
  PlatformSkillExecutionRequest,
  PlatformSkillExecutionResult,
} from "@/modules/ai-tools/types/skill";
export type {
  PlatformCapabilityDefinition,
  CapabilityDiscoveryFilter,
} from "@/modules/ai-tools/types/capability";
