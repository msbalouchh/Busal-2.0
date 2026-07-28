import type { AiToolRiskLevel } from "@prisma/client";

import type { ToolDefinition } from "@/modules/ai-tools/types/tool-types";

export interface SafetyCheckInput {
  definition: ToolDefinition;
  dryRun: boolean;
  confirmed: boolean;
}

export interface SafetyCheckResult {
  allowed: boolean;
  requiresConfirmation: boolean;
  isDryRun: boolean;
  reason?: string;
}

export function evaluateToolSafety(input: SafetyCheckInput): SafetyCheckResult {
  const { definition, dryRun, confirmed } = input;
  const isHighRisk =
    definition.riskLevel === "HIGH_RISK" || definition.confirmationRequired === true;

  if (dryRun) {
    if (!definition.dryRunSupported && definition.riskLevel !== "READ_ONLY") {
      return {
        allowed: false,
        requiresConfirmation: false,
        isDryRun: true,
        reason: "Tool does not support dry run mode",
      };
    }

    return {
      allowed: true,
      requiresConfirmation: false,
      isDryRun: true,
    };
  }

  if (definition.readOnly && isHighRisk) {
    return {
      allowed: false,
      requiresConfirmation: false,
      isDryRun: false,
      reason: "Read-only tool cannot be high risk",
    };
  }

  if (isHighRisk && !confirmed) {
    return {
      allowed: false,
      requiresConfirmation: true,
      isDryRun: false,
      reason: "High-risk tool requires explicit confirmation",
    };
  }

  return {
    allowed: true,
    requiresConfirmation: false,
    isDryRun: false,
  };
}

export function isHighRiskTool(definition: ToolDefinition): boolean {
  return definition.riskLevel === "HIGH_RISK" || definition.confirmationRequired === true;
}

export function getRiskLabel(riskLevel: AiToolRiskLevel): string {
  switch (riskLevel) {
    case "READ_ONLY":
      return "Read only";
    case "HIGH_RISK":
      return "High risk";
    default:
      return "Standard";
  }
}
