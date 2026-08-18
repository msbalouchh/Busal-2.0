import "server-only";

import { runCustomerAiChat } from "@/modules/customer-ai/services/customer-ai-chat.service";
import {
  normalizeInboundMessage,
} from "@/modules/customer-ai/channels/messaging-channel-registry";
import type { CustomerAiChannel } from "@/modules/customer-ai/types/customer-ai.types";
import type { CustomerAiChatResult } from "@/modules/customer-ai/types/customer-ai.types";

/**
 * Routes normalized channel messages through the single customer AI brain.
 * External omnichannel webhooks use processChannelWebhookPayload instead.
 */
export async function routeChannelMessageToCustomerAi(input: {
  businessId: string;
  channel: CustomerAiChannel;
  payload: Record<string, unknown>;
  conversationId?: string;
  sessionToken?: string;
  customerId?: string;
  confirmedActions?: string[];
}): Promise<CustomerAiChatResult | null> {
  const normalized = normalizeInboundMessage({
    businessId: input.businessId,
    channel: input.channel,
    payload: input.payload,
  });

  if (!normalized) return null;

  return runCustomerAiChat({
    businessId: normalized.businessId,
    message: normalized.message,
    conversationId: input.conversationId,
    sessionToken: input.sessionToken,
    customerId: input.customerId,
    channel: input.channel,
    confirmedActions: input.confirmedActions,
  });
}

export function buildChannelReplyPayload(result: CustomerAiChatResult): Record<string, unknown> {
  return {
    content: result.content,
    aiName: result.aiName,
    aiAvatarUrl: result.aiAvatarUrl,
    conversationId: result.conversationId,
    sessionToken: result.sessionToken,
    requiresConfirmation: result.requiresConfirmation ?? [],
  };
}
