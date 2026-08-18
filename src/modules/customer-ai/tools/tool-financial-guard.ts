import "server-only";

import type { AiBusinessToolDefinition, AiToolAudience } from "@/modules/customer-ai/tools/tool-types";

/**
 * FINANCIAL RISK TOOL FOUNDATION
 *
 * Financial tools (refunds, payments, payouts) MUST be explicitly registered here
 * before they can execute. Customer audience is NEVER allowed for FINANCIAL tools.
 *
 * Do NOT add mock or simulated financial tools. Each entry must reference a real
 * Busal financial service that has been reviewed for tenant isolation and audit.
 */
export const REGISTERED_FINANCIAL_TOOL_IDS: readonly string[] = [] as const;

const financialToolSet = new Set<string>(REGISTERED_FINANCIAL_TOOL_IDS);

export function isRegisteredFinancialTool(toolId: string): boolean {
  return financialToolSet.has(toolId);
}

export function assertFinancialToolExecutionAllowed(tool: AiBusinessToolDefinition): void {
  if (tool.riskLevel !== "FINANCIAL") return;

  if (tool.audience === "CUSTOMER") {
    throw new Error(
      `FINANCIAL tool "${tool.toolId}" cannot be exposed to customers. Financial operations are owner-only.`,
    );
  }

  if (!isRegisteredFinancialTool(tool.toolId)) {
    throw new Error(
      `FINANCIAL tool "${tool.toolId}" is not registered. ` +
        "Add it to REGISTERED_FINANCIAL_TOOL_IDS only after wiring a real Busal financial service.",
    );
  }
}

export function canExecuteFinancialTool(
  tool: AiBusinessToolDefinition,
  audience: AiToolAudience,
): { allowed: boolean; error?: string } {
  if (tool.riskLevel !== "FINANCIAL") {
    return { allowed: true };
  }

  if (audience === "CUSTOMER") {
    return {
      allowed: false,
      error: "Financial operations are not available through customer AI.",
    };
  }

  if (!isRegisteredFinancialTool(tool.toolId)) {
    return {
      allowed: false,
      error: "This financial operation is not configured. No financial action was taken.",
    };
  }

  return { allowed: true };
}
