import { skillRegistry } from "@/modules/ai-tools/registry/skill-registry";
import { toolExecutor } from "@/modules/ai-tools/executors/tool-executor";
import { evaluateToolAccess } from "@/modules/ai-tools/utils/tool-permissions";
import { platformToolRegistry } from "@/modules/ai-tools/registry/platform-tool-registry";
import type {
  PlatformSkillExecutionRequest,
  PlatformSkillExecutionResult,
} from "@/modules/ai-tools/types/skill";

/** Executes skills by orchestrating one or more registered tools (mock only). */
export class SkillExecutor {
  async execute(request: PlatformSkillExecutionRequest): Promise<PlatformSkillExecutionResult> {
    const startedAt = Date.now();
    const skill = skillRegistry.getOrThrow(request.skillId);

    if (!skill.isEnabled) {
      return {
        skillId: request.skillId,
        success: false,
        output: null,
        error: `Skill "${request.skillId}" is disabled.`,
        toolsInvoked: [],
        executionTimeMs: Date.now() - startedAt,
      };
    }

    if (!skill.supportedAgents.includes(request.context.agentSlug)) {
      return {
        skillId: request.skillId,
        success: false,
        output: null,
        error: `Agent "${request.context.agentSlug}" cannot execute skill "${request.skillId}".`,
        toolsInvoked: [],
        executionTimeMs: Date.now() - startedAt,
      };
    }

    const toolsInvoked: string[] = [];
    const outputs: Record<string, unknown>[] = [];

    for (const toolId of skill.toolIds) {
      const tool = platformToolRegistry.getOrThrow(toolId);
      const access = evaluateToolAccess(tool, request.context);

      if (!access.allowed) {
        continue;
      }

      const result = await toolExecutor.execute({
        toolId,
        input: request.input,
        context: request.context,
      });

      toolsInvoked.push(toolId);

      if (result.output) {
        outputs.push(result.output);
      }

      if (!result.success) {
        return {
          skillId: request.skillId,
          success: false,
          output: null,
          error: result.error,
          toolsInvoked,
          executionTimeMs: Date.now() - startedAt,
        };
      }
    }

    return {
      skillId: request.skillId,
      success: true,
      output: {
        skillId: request.skillId,
        results: outputs,
        toolsInvoked,
      },
      error: null,
      toolsInvoked,
      executionTimeMs: Date.now() - startedAt,
    };
  }
}

export const skillExecutor = new SkillExecutor();
