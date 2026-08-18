import type { AiToolDefinition } from "@/modules/ai-engine/types/ai-engine.types";

export type AiToolRiskLevel =
  | "READ"
  | "LOW_RISK_WRITE"
  | "WRITE"
  | "HIGH_RISK_WRITE"
  | "FINANCIAL"
  | "DESTRUCTIVE";

export type AiToolAudience = "CUSTOMER" | "OWNER";

export type AiPermissionKey =
  | "ai.customer.read"
  | "ai.customer.write"
  | "ai.orders.read"
  | "ai.orders.create"
  | "ai.orders.update"
  | "ai.orders.cancel"
  | "ai.reservations.read"
  | "ai.reservations.create"
  | "ai.reservations.update"
  | "ai.reservations.cancel"
  | "ai.products.read"
  | "ai.inventory.read"
  | "ai.analytics.read"
  | "ai.communication.send"
  | "ai.business.write";

export interface AiBusinessToolContext {
  businessId: string;
  branchId?: string | null;
  customerId?: string | null;
  ownerId?: string | null;
  sessionToken?: string;
  conversationId?: string;
  channel?: string;
  audience: AiToolAudience;
  confirmedActions?: string[];
  permissions: Record<AiPermissionKey, boolean>;
  requireConfirmation: boolean;
}

export type AiBusinessToolHandler = (
  input: Record<string, unknown>,
  context: AiBusinessToolContext,
) => Promise<object | null>;

export interface AiBusinessToolDefinition {
  toolId: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  permission: AiPermissionKey;
  riskLevel: AiToolRiskLevel;
  audience: AiToolAudience | "BOTH";
  requiresCustomerVerification?: boolean;
  buildConfirmationActionId?: (input: Record<string, unknown>) => string;
  buildConfirmationMessage?: (input: Record<string, unknown>, preview?: Record<string, unknown>) => string;
  validateArgs?: (
    input: Record<string, unknown>,
    context: AiBusinessToolContext,
  ) => Promise<{ valid: true; preview?: Record<string, unknown> } | { valid: false; error: string }>;
  handler: AiBusinessToolHandler;
}

export interface AiToolExecutionResult {
  toolCallId: string;
  toolId: string;
  output: Record<string, unknown>;
  permissionGranted: boolean;
  confirmationRequired: boolean;
  executed: boolean;
  success: boolean;
}

export function toAiToolDefinition(tool: AiBusinessToolDefinition): AiToolDefinition {
  return {
    name: tool.toolId,
    description: tool.description,
    parameters: tool.inputSchema,
  };
}

export function riskRequiresConfirmation(risk: AiToolRiskLevel): boolean {
  return (
    risk === "WRITE" ||
    risk === "HIGH_RISK_WRITE" ||
    risk === "FINANCIAL" ||
    risk === "DESTRUCTIVE"
  );
}
