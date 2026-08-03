import { toolRegistry } from "@/modules/ai/registry/tool-registry";
import type { AiActionRequest, AiActionResult } from "@/modules/ai/types/pipeline";

/** Executes AI tool actions through the ToolRegistry (mock only). */
export class AIActionExecutor {
  async execute(request: AiActionRequest): Promise<AiActionResult> {
    const result = await toolRegistry.execute(request.toolSlug, request.input);

    return {
      success: result.success,
      output: result.output,
      toolSlug: request.toolSlug,
      executedAt: new Date().toISOString(),
    };
  }

  async executeMany(requests: AiActionRequest[]): Promise<AiActionResult[]> {
    return Promise.all(requests.map((request) => this.execute(request)));
  }
}

export const aiActionExecutor = new AIActionExecutor();
