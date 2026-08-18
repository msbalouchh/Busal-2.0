import "server-only";

import type { AiBusinessToolDefinition } from "@/modules/customer-ai/tools/tool-types";
import { riskRequiresConfirmation } from "@/modules/customer-ai/tools/tool-types";

export interface ConfirmationCheckResult {
  blocked: boolean;
  requiresConfirmation: boolean;
  actionId?: string;
  message?: string;
  preview?: Record<string, unknown>;
}

export function evaluateToolConfirmation(input: {
  tool: AiBusinessToolDefinition;
  args: Record<string, unknown>;
  requireConfirmation: boolean;
  confirmedActions?: string[];
  preview?: Record<string, unknown>;
}): ConfirmationCheckResult {
  const needsConfirmation =
    input.requireConfirmation &&
    (riskRequiresConfirmation(input.tool.riskLevel) ||
      input.tool.riskLevel === "LOW_RISK_WRITE");

  if (!needsConfirmation) {
    return { blocked: false, requiresConfirmation: false };
  }

  const actionId =
    input.tool.buildConfirmationActionId?.(input.args) ??
    `${input.tool.toolId}:${JSON.stringify(input.args)}`;

  if (input.confirmedActions?.includes(actionId)) {
    return { blocked: false, requiresConfirmation: false, actionId };
  }

  const message =
    input.tool.buildConfirmationMessage?.(input.args, input.preview) ??
    `Please confirm you want to proceed with ${input.tool.name}.`;

  return {
    blocked: true,
    requiresConfirmation: true,
    actionId,
    message,
    preview: input.preview ?? input.args,
  };
}
