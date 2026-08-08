import "server-only";

import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { registerAllPlatformAiTools } from "@/modules/ai-tools/plugins/register-platform-ai-tools";
import { listRegisteredTools, getToolHandler } from "@/modules/ai-tools/registry/tool-registry";
import { executeAiTool } from "@/services/ai-tools.service";
import type { AiToolCallRequest, AiToolDefinition } from "@/modules/ai-engine/types/ai-engine.types";
import { DOMAIN_EVENT_TYPES } from "@/modules/platform-orchestration/constants/domain-events";
import { publishModuleDomainEvent } from "@/modules/platform-orchestration/lib/publish-module-event";

/** Bridges AI tool calls to the production ai-tools execution engine. */
export class AiToolExecutionFacade {
  ensureToolsRegistered(): void {
    registerAllPlatformAiTools();
  }

  listAvailableTools(platform: BusinessContext, currentModule?: string | null): AiToolDefinition[] {
    this.ensureToolsRegistered();

    return listRegisteredTools()
      .filter((tool) => {
        if (!currentModule) {
          return true;
        }
        return tool.module === currentModule || tool.module === "platform";
      })
      .filter((tool) => {
        const required = tool.requiredPermissions ?? [];
        return required.every((permission) => platform.permissions.includes(permission));
      })
      .map((tool) => ({
        name: tool.toolId,
        description: tool.description,
        parameters: tool.inputSchema as Record<string, unknown>,
      }));
  }

  async executeToolCalls(input: {
    platform: BusinessContext;
    toolCalls: AiToolCallRequest[];
    currentModule?: string | null;
    model?: string;
    tokensUsed?: number;
  }): Promise<Array<{ toolCallId: string; toolId: string; output: Record<string, unknown> }>> {
    this.ensureToolsRegistered();
    const results: Array<{ toolCallId: string; toolId: string; output: Record<string, unknown> }> = [];

    for (const call of input.toolCalls) {
      const handler = getToolHandler(call.name);
      if (!handler) {
        results.push({
          toolCallId: call.id,
          toolId: call.name,
          output: { error: `Tool not registered: ${call.name}` },
        });
        continue;
      }

      const execution = await executeAiTool(input.platform, {
        toolId: call.name,
        input: call.arguments,
        currentModule: input.currentModule ?? undefined,
        modelUsed: input.model,
        tokensUsed: input.tokensUsed,
        confirmed: true,
      });

      results.push({
        toolCallId: call.id,
        toolId: call.name,
        output: (execution.output as Record<string, unknown> | null) ?? {
          status: execution.status,
          error: execution.errorDetails,
        },
      });

      await publishModuleDomainEvent(
        {
          tenantId: input.platform.business.id,
          workspaceId: `${input.platform.business.id}-ws`,
          businessId: input.platform.business.id,
          branchId: input.platform.branchId,
          userId: input.platform.user.id,
        },
        {
          eventType: DOMAIN_EVENT_TYPES.AI_CONTEXT_UPDATED,
          aggregateId: execution.executionId,
          payload: {
            toolId: call.name,
            status: execution.status,
            source: "ai-engine-tool",
          },
        },
      );
    }

    return results;
  }
}

export const aiToolExecutionFacade = new AiToolExecutionFacade();
