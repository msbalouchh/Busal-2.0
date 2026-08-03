import { platformToolRegistry } from "@/modules/ai-tools/registry/platform-tool-registry";
import { evaluateToolAccess } from "@/modules/ai-tools/utils/tool-permissions";
import type {
  PlatformToolExecutionRequest,
  PlatformToolExecutionResult,
} from "@/modules/ai-tools/types/platform-tool";

/** Executes platform tools through the registry (mock only, no backend). */
export class ToolExecutor {
  async execute(request: PlatformToolExecutionRequest): Promise<PlatformToolExecutionResult> {
    const startedAt = Date.now();
    const tool = platformToolRegistry.getOrThrow(request.toolId);
    const access = evaluateToolAccess(tool, request.context);

    if (!access.allowed) {
      return {
        toolId: request.toolId,
        success: false,
        output: null,
        error: access.reason,
        dryRun: request.dryRun ?? false,
        executionTimeMs: Date.now() - startedAt,
        version: tool.version,
      };
    }

    if (request.dryRun) {
      return {
        toolId: request.toolId,
        success: true,
        output: {
          dryRun: true,
          toolId: request.toolId,
          input: request.input,
          message: `Dry run for ${tool.name} — no side effects.`,
        },
        error: null,
        dryRun: true,
        executionTimeMs: Date.now() - startedAt,
        version: tool.version,
      };
    }

    try {
      const handler = platformToolRegistry.getHandler(request.toolId);

      if (!handler) {
        throw new Error(`No handler for tool "${request.toolId}".`);
      }

      const output = await handler(request.input, request.context);

      return {
        toolId: request.toolId,
        success: true,
        output,
        error: null,
        dryRun: false,
        executionTimeMs: Date.now() - startedAt,
        version: tool.version,
      };
    } catch (error) {
      return {
        toolId: request.toolId,
        success: false,
        output: null,
        error: error instanceof Error ? error.message : "Tool execution failed.",
        dryRun: false,
        executionTimeMs: Date.now() - startedAt,
        version: tool.version,
      };
    }
  }
}

export const toolExecutor = new ToolExecutor();
