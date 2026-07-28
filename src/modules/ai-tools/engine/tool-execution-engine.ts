import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { buildToolContext } from "@/modules/ai-tools/engine/tool-context";
import { validateToolInput } from "@/modules/ai-tools/engine/tool-input-validator";
import { evaluateToolSafety } from "@/modules/ai-tools/engine/tool-safety";
import { executeWithRetry, resolveRetryPolicy } from "@/modules/ai-tools/engine/tool-retry";
import { getRegisteredTool, getToolHandler } from "@/modules/ai-tools/registry/tool-registry";
import type { ExecuteToolRequest, ToolExecutionResult } from "@/modules/ai-tools/types/tool-types";

export interface EngineDependencies {
  loadToolRecord: (
    businessId: string,
    toolId: string,
  ) => Promise<{
    id: string;
    status: string;
    toolId: string;
  } | null>;
  createExecution: (input: {
    businessId: string;
    branchId: string | null;
    toolRecordId: string;
    toolId: string;
    agentId: string | null;
    userId: string | null;
    staffId: string | null;
    input: Record<string, unknown>;
    status: string;
    dryRun: boolean;
    confirmed: boolean;
    parentExecutionId?: string | null;
  }) => Promise<{ id: string }>;
  finalizeExecution: (
    executionId: string,
    input: {
      status: string;
      output?: Record<string, unknown> | null;
      errorDetails?: string | null;
      executionTimeMs?: number | null;
      tokensUsed?: number | null;
      modelUsed?: string | null;
      retryCount?: number;
    },
  ) => Promise<void>;
}

function assertExecutePermission(platform: BusinessContext): void {
  if (!platform.permissions.includes(PERMISSION_CODES.AI_TOOL_EXECUTE)) {
    throw new Error("Permission denied: ai.tool.execute required");
  }
}

function assertToolPermissions(platform: BusinessContext, requiredPermissions: string[]): void {
  for (const permission of requiredPermissions) {
    if (!platform.permissions.includes(permission)) {
      throw new Error(`Permission denied: ${permission} required`);
    }
  }
}

export async function runToolExecution(
  platform: BusinessContext,
  request: ExecuteToolRequest,
  dependencies: EngineDependencies,
): Promise<ToolExecutionResult> {
  const startedAt = Date.now();
  const definition = getRegisteredTool(request.toolId);
  const handler = getToolHandler(request.toolId);

  if (!definition || !handler) {
    throw new Error(`Tool not registered: ${request.toolId}`);
  }

  validateToolInput(definition.inputSchema, request.input);
  assertExecutePermission(platform);
  assertToolPermissions(platform, definition.requiredPermissions ?? []);

  const toolRecord = await dependencies.loadToolRecord(platform.business.id, request.toolId);
  if (!toolRecord) {
    throw new Error(`Tool not synced for business: ${request.toolId}`);
  }

  if (toolRecord.status === "DISABLED") {
    throw new Error(`Tool is disabled: ${request.toolId}`);
  }

  const safety = evaluateToolSafety({
    definition,
    dryRun: request.dryRun === true,
    confirmed: request.confirmed === true,
  });

  const execution = await dependencies.createExecution({
    businessId: platform.business.id,
    branchId: platform.branchId,
    toolRecordId: toolRecord.id,
    toolId: request.toolId,
    agentId: request.agentId ?? null,
    userId: platform.user.id,
    staffId: platform.staffSession?.staffId ?? null,
    input: request.input,
    status: safety.requiresConfirmation ? "AWAITING_CONFIRMATION" : "RUNNING",
    dryRun: safety.isDryRun,
    confirmed: request.confirmed === true,
  });

  if (safety.requiresConfirmation) {
    await dependencies.finalizeExecution(execution.id, {
      status: "AWAITING_CONFIRMATION",
      output: {
        message: safety.reason ?? "Confirmation required",
        toolId: request.toolId,
      },
      executionTimeMs: Date.now() - startedAt,
      tokensUsed: request.tokensUsed ?? null,
      modelUsed: request.modelUsed ?? null,
    });

    return {
      executionId: execution.id,
      toolId: request.toolId,
      status: "AWAITING_CONFIRMATION",
      output: {
        message: safety.reason ?? "Confirmation required",
        toolId: request.toolId,
      },
      requiresConfirmation: true,
      dryRun: false,
      executionTimeMs: Date.now() - startedAt,
      errorDetails: null,
    };
  }

  if (!safety.allowed) {
    await dependencies.finalizeExecution(execution.id, {
      status: "FAILED",
      errorDetails: safety.reason ?? "Tool execution blocked by safety layer",
      executionTimeMs: Date.now() - startedAt,
    });

    throw new Error(safety.reason ?? "Tool execution blocked by safety layer");
  }

  const toolContext = buildToolContext(platform, {
    currentModule: request.currentModule ?? null,
    selectedRecord: request.selectedRecord ?? null,
  });

  const retryPolicy = resolveRetryPolicy(request.retryPolicy);

  try {
    const { result, retryCount } = await executeWithRetry(
      () => handler(toolContext, request.input),
      retryPolicy,
    );

    const status = safety.isDryRun ? "DRY_RUN" : "SUCCESS";

    await dependencies.finalizeExecution(execution.id, {
      status,
      output: result,
      executionTimeMs: Date.now() - startedAt,
      tokensUsed: request.tokensUsed ?? null,
      modelUsed: request.modelUsed ?? null,
      retryCount,
    });

    return {
      executionId: execution.id,
      toolId: request.toolId,
      status,
      output: result,
      requiresConfirmation: false,
      dryRun: safety.isDryRun,
      executionTimeMs: Date.now() - startedAt,
      errorDetails: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool execution failed";

    await dependencies.finalizeExecution(execution.id, {
      status: "FAILED",
      errorDetails: message,
      executionTimeMs: Date.now() - startedAt,
      tokensUsed: request.tokensUsed ?? null,
      modelUsed: request.modelUsed ?? null,
    });

    return {
      executionId: execution.id,
      toolId: request.toolId,
      status: "FAILED",
      output: null,
      requiresConfirmation: false,
      dryRun: safety.isDryRun,
      executionTimeMs: Date.now() - startedAt,
      errorDetails: message,
    };
  }
}
