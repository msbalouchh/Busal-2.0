import "server-only";

import type { AiToolCallRequest } from "@/modules/ai-engine/types/ai-engine.types";
import type { CustomerAiCapabilities } from "@/modules/customer-ai/types/customer-ai.types";
import {
  executeBusinessToolCalls,
  listCustomerToolsFromCapabilities,
} from "@/modules/customer-ai/tools/tool-registry";
import { permissionsFromCustomerCapabilities } from "@/modules/customer-ai/tools/tool-permission-service";
import type { AiBusinessToolContext } from "@/modules/customer-ai/tools/tool-types";

export interface CustomerToolContext {
  businessId: string;
  branchId?: string | null;
  customerId?: string | null;
  sessionToken?: string;
  conversationId?: string;
  channel?: string;
  capabilities: CustomerAiCapabilities;
  confirmedActions?: string[];
}

export function listCustomerAiTools(capabilities: CustomerAiCapabilities) {
  return listCustomerToolsFromCapabilities(capabilities);
}

export async function executeCustomerAiToolCalls(input: {
  toolCalls: AiToolCallRequest[];
  context: CustomerToolContext;
}): Promise<Array<{ toolCallId: string; toolId: string; output: Record<string, unknown> }>> {
  const toolContext: AiBusinessToolContext = {
    businessId: input.context.businessId,
    branchId: input.context.branchId,
    customerId: input.context.customerId,
    sessionToken: input.context.sessionToken,
    conversationId: input.context.conversationId,
    channel: input.context.channel,
    audience: "CUSTOMER",
    confirmedActions: input.context.confirmedActions,
    permissions: permissionsFromCustomerCapabilities(input.context.capabilities),
    requireConfirmation: input.context.capabilities.requireConfirmation,
  };

  return executeBusinessToolCalls({ toolCalls: input.toolCalls, context: toolContext });
}

/** @deprecated Use tool-registry directly */
export function registerCustomerAiTools(): void {
  // Tools are registered statically in tool-registry.ts
}
