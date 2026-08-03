import type {
  PlatformExecutionContext,
  PlatformJsonSchema,
} from "@/modules/ai-tools/types/platform-tool";

export interface PlatformSkillDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  version: string;
  toolIds: string[];
  requiredPermissions: string[];
  requiredModules: string[];
  supportedAgents: string[];
  inputSchema: PlatformJsonSchema;
  outputSchema: PlatformJsonSchema;
  isEnabled: boolean;
}

export type PlatformSkillHandler = (
  input: Record<string, unknown>,
  context: PlatformExecutionContext,
) => Promise<Record<string, unknown>>;

export interface RegisteredPlatformSkill extends PlatformSkillDefinition {
  handler?: PlatformSkillHandler;
}

export interface PlatformSkillExecutionRequest {
  skillId: string;
  input: Record<string, unknown>;
  context: PlatformExecutionContext;
}

export interface PlatformSkillExecutionResult {
  skillId: string;
  success: boolean;
  output: Record<string, unknown> | null;
  error: string | null;
  toolsInvoked: string[];
  executionTimeMs: number;
}
