import "server-only";

import type { AiToolCallRequest } from "@/modules/ai-engine/types/ai-engine.types";
import type { CustomerAiCapabilities } from "@/modules/customer-ai/types/customer-ai.types";
import {
  customerBusinessTools,
  productTools,
} from "@/modules/customer-ai/tools/product-tools";
import { orderTools } from "@/modules/customer-ai/tools/order-tools";
import { reservationTools } from "@/modules/customer-ai/tools/reservation-tools";
import { inventoryTools } from "@/modules/customer-ai/tools/inventory-tools";
import { analyticsTools } from "@/modules/customer-ai/tools/analytics-tools";
import {
  evaluateToolConfirmation,
} from "@/modules/customer-ai/tools/tool-confirmation-service";
import {
  createPendingConfirmation,
  validateConfirmedAction,
  consumePendingConfirmation,
} from "@/modules/customer-ai/tools/confirmation-expiration.service";
import { canExecuteFinancialTool } from "@/modules/customer-ai/tools/tool-financial-guard";
import {
  hasToolPermission,
  permissionsForOwner,
  permissionsFromCustomerCapabilities,
} from "@/modules/customer-ai/tools/tool-permission-service";
import { recordAiBusinessAction } from "@/modules/customer-ai/tools/tool-audit.service";
import type {
  AiBusinessToolContext,
  AiBusinessToolDefinition,
  AiToolAudience,
} from "@/modules/customer-ai/tools/tool-types";
import { toAiToolDefinition } from "@/modules/customer-ai/tools/tool-types";

const ALL_TOOLS: AiBusinessToolDefinition[] = [
  ...customerBusinessTools,
  ...productTools,
  ...orderTools,
  ...reservationTools,
  ...inventoryTools,
  ...analyticsTools,
];

const toolMap = new Map(ALL_TOOLS.map((tool) => [tool.toolId, tool]));

export function listToolsForAudience(
  audience: AiToolAudience,
  permissions: Record<string, boolean>,
): ReturnType<typeof toAiToolDefinition>[] {
  return ALL_TOOLS.filter((tool) => {
    if (tool.audience !== "BOTH" && tool.audience !== audience) return false;
    return hasToolPermission(permissions as never, tool.permission);
  }).map(toAiToolDefinition);
}

export function listCustomerToolsFromCapabilities(
  capabilities: CustomerAiCapabilities,
): ReturnType<typeof toAiToolDefinition>[] {
  return listToolsForAudience("CUSTOMER", permissionsFromCustomerCapabilities(capabilities));
}

export function listOwnerTools(): ReturnType<typeof toAiToolDefinition>[] {
  return listToolsForAudience("OWNER", permissionsForOwner());
}

export async function executeBusinessToolCalls(input: {
  toolCalls: AiToolCallRequest[];
  context: AiBusinessToolContext;
}): Promise<
  Array<{
    toolCallId: string;
    toolId: string;
    output: Record<string, unknown>;
  }>
> {
  const results: Array<{ toolCallId: string; toolId: string; output: Record<string, unknown> }> = [];

  for (const call of input.toolCalls) {
    const tool = toolMap.get(call.name);
    if (!tool) {
      results.push({
        toolCallId: call.id,
        toolId: call.name,
        output: { error: `Tool not available: ${call.name}` },
      });
      continue;
    }

    if (tool.audience !== "BOTH" && tool.audience !== input.context.audience) {
      await recordAiBusinessAction({
        businessId: input.context.businessId,
        toolId: tool.toolId,
        audience: input.context.audience,
        riskLevel: tool.riskLevel,
        customerId: input.context.customerId,
        conversationId: input.context.conversationId,
        sessionId: input.context.sessionToken,
        channel: input.context.channel,
        permissionGranted: false,
        confirmationRequired: false,
        confirmationStatus: "not_required",
        executionStatus: "skipped",
        success: false,
        errorMessage: "Tool not available for this audience",
        inputSummary: call.arguments,
      });
      results.push({
        toolCallId: call.id,
        toolId: call.name,
        output: { error: `Tool not available for ${input.context.audience.toLowerCase()} audience.` },
      });
      continue;
    }

    const permissionGranted = hasToolPermission(input.context.permissions, tool.permission);
    if (!permissionGranted) {
      await recordAiBusinessAction({
        businessId: input.context.businessId,
        toolId: tool.toolId,
        audience: input.context.audience,
        riskLevel: tool.riskLevel,
        customerId: input.context.customerId,
        conversationId: input.context.conversationId,
        sessionId: input.context.sessionToken,
        channel: input.context.channel,
        permissionGranted: false,
        confirmationRequired: false,
        confirmationStatus: "not_required",
        executionStatus: "skipped",
        success: false,
        errorMessage: "Permission denied",
        inputSummary: call.arguments,
      });
      results.push({
        toolCallId: call.id,
        toolId: call.name,
        output: { error: "This action is not enabled for AI. Please contact the business directly." },
      });
      continue;
    }

    const financialCheck = canExecuteFinancialTool(tool, input.context.audience);
    if (!financialCheck.allowed) {
      results.push({
        toolCallId: call.id,
        toolId: call.name,
        output: { error: financialCheck.error ?? "Financial operation not permitted." },
      });
      continue;
    }

    if (tool.requiresCustomerVerification && !input.context.customerId) {
      results.push({
        toolCallId: call.id,
        toolId: call.name,
        output: { error: "Customer verification required.", requiresVerification: true },
      });
      continue;
    }

    let preview: Record<string, unknown> | undefined = call.arguments;

    if (tool.validateArgs) {
      const validation = await tool.validateArgs(call.arguments, input.context);
      if (!validation.valid) {
        await recordAiBusinessAction({
          businessId: input.context.businessId,
          toolId: tool.toolId,
          audience: input.context.audience,
          riskLevel: tool.riskLevel,
          customerId: input.context.customerId,
          conversationId: input.context.conversationId,
          sessionId: input.context.sessionToken,
          channel: input.context.channel,
          permissionGranted: true,
          confirmationRequired: false,
          confirmationStatus: "not_required",
          executionStatus: "skipped",
          success: false,
          errorMessage: validation.error,
          inputSummary: call.arguments,
        });
        results.push({
          toolCallId: call.id,
          toolId: call.name,
          output: { error: validation.error },
        });
        continue;
      }
      preview = validation.preview ?? preview;
    }

    const confirmation = evaluateToolConfirmation({
      tool,
      args: call.arguments,
      requireConfirmation: input.context.requireConfirmation,
      confirmedActions: input.context.confirmedActions,
      preview,
    });

    if (confirmation.blocked) {
      if (confirmation.actionId) {
        await createPendingConfirmation({
          businessId: input.context.businessId,
          actionId: confirmation.actionId,
          toolId: tool.toolId,
          conversationId: input.context.conversationId,
          sessionId: input.context.sessionToken,
          channel: input.context.channel,
          payload: call.arguments,
        });
      }
      await recordAiBusinessAction({
        businessId: input.context.businessId,
        toolId: tool.toolId,
        audience: input.context.audience,
        riskLevel: tool.riskLevel,
        customerId: input.context.customerId,
        conversationId: input.context.conversationId,
        sessionId: input.context.sessionToken,
        channel: input.context.channel,
        permissionGranted: true,
        confirmationRequired: true,
        confirmationStatus: "pending",
        executionStatus: "skipped",
        success: false,
        inputSummary: call.arguments,
        outputSummary: { preview: confirmation.preview },
      });
      results.push({
        toolCallId: call.id,
        toolId: call.name,
        output: {
          requiresConfirmation: true,
          actionId: confirmation.actionId,
          message: confirmation.message,
          preview: confirmation.preview,
        },
      });
      continue;
    }

    if (confirmation.actionId && input.context.confirmedActions?.includes(confirmation.actionId)) {
      const validation = await validateConfirmedAction({
        businessId: input.context.businessId,
        actionId: confirmation.actionId,
        confirmedActions: input.context.confirmedActions,
      });
      if (!validation.valid) {
        const errorMessage =
          validation.reason === "expired"
            ? "This confirmation has expired. Please request the action again."
            : validation.reason === "already_consumed"
              ? "This action was already executed and cannot be confirmed again."
              : "Confirmation is not valid for this action.";
        await recordAiBusinessAction({
          businessId: input.context.businessId,
          toolId: tool.toolId,
          audience: input.context.audience,
          riskLevel: tool.riskLevel,
          customerId: input.context.customerId,
          conversationId: input.context.conversationId,
          sessionId: input.context.sessionToken,
          channel: input.context.channel,
          permissionGranted: true,
          confirmationRequired: true,
          confirmationStatus: validation.reason === "expired" ? "expired" : "rejected",
          executionStatus: "skipped",
          success: false,
          errorMessage,
          inputSummary: call.arguments,
        });
        results.push({ toolCallId: call.id, toolId: call.name, output: { error: errorMessage } });
        continue;
      }
    }

    try {
      const rawOutput = await tool.handler(call.arguments, input.context);
      const output: Record<string, unknown> =
        rawOutput === null
          ? { error: "Tool returned no result." }
          : (rawOutput as Record<string, unknown>);
      const entityId =
        typeof output.orderId === "string"
          ? output.orderId
          : typeof output.reservationId === "string"
            ? output.reservationId
            : null;

      if (confirmation.actionId) {
        await consumePendingConfirmation(input.context.businessId, confirmation.actionId);
      }

      await recordAiBusinessAction({
        businessId: input.context.businessId,
        toolId: tool.toolId,
        audience: input.context.audience,
        riskLevel: tool.riskLevel,
        customerId: input.context.customerId,
        conversationId: input.context.conversationId,
        sessionId: input.context.sessionToken,
        channel: input.context.channel,
        entityType: entityId ? tool.toolId.split(".")[0] : null,
        entityId,
        permissionGranted: true,
        confirmationRequired: confirmation.requiresConfirmation,
        confirmationStatus: confirmation.requiresConfirmation ? "confirmed" : "not_required",
        executionStatus: "executed",
        success: !output.error,
        inputSummary: call.arguments,
        outputSummary: output,
        errorMessage: typeof output.error === "string" ? output.error : null,
      });

      results.push({ toolCallId: call.id, toolId: call.name, output });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tool execution failed";
      await recordAiBusinessAction({
        businessId: input.context.businessId,
        toolId: tool.toolId,
        audience: input.context.audience,
        riskLevel: tool.riskLevel,
        customerId: input.context.customerId,
        conversationId: input.context.conversationId,
        sessionId: input.context.sessionToken,
        channel: input.context.channel,
        permissionGranted: true,
        confirmationRequired: false,
        confirmationStatus: "not_required",
        executionStatus: "failed",
        success: false,
        inputSummary: call.arguments,
        errorMessage: message,
      });
      results.push({ toolCallId: call.id, toolId: call.name, output: { error: message } });
    }
  }

  return results;
}

export { ALL_TOOLS as businessOperationTools };
