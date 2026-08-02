import "server-only";

import {
  composeRestaurantAssistantReply,
  detectRestaurantIntent,
} from "@/modules/ai-restaurant-assistant-management/engine/restaurant-assistant-engine";
import type { AiProvider } from "@/modules/ai-restaurant-assistant-management/engine/ai-provider-registry";
import type {
  AiCompletionRequest,
  AiCompletionResponse,
} from "@/modules/ai-restaurant-assistant-management/types/ai-restaurant-assistant-types";

/**
 * Local rule-based provider that composes responses from existing restaurant data.
 * No external API calls — serves as the default until a cloud provider is connected.
 */
export class LocalRestaurantAiProvider implements AiProvider {
  readonly id = "local-restaurant";
  readonly name = "Local Restaurant Assistant";
  readonly capabilities = {
    supportsStreaming: false,
    supportsTools: true,
    maxContextTokens: 8000,
  };

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const lastUserMessage = [...request.messages].reverse().find((entry) => entry.role === "user");
    const message = lastUserMessage?.content?.trim() ?? "";

    const ownerMatch = request.systemPrompt.match(/ownerId:([a-f0-9-]+)/i);
    const branchMatch = request.systemPrompt.match(/branchId:([a-f0-9-]+)/i);

    if (ownerMatch?.[1] && message) {
      const composed = await composeRestaurantAssistantReply(
        ownerMatch[1],
        message,
        branchMatch?.[1] ?? null,
      );
      return {
        content: composed.content,
        provider: this.id,
        model: "local-rule-engine-v1",
        tokensUsed: 0,
      };
    }

    const { intent } = detectRestaurantIntent(message);
    const fallbackByIntent: Partial<Record<string, string>> = {
      sales_today: "Ask your business admin to connect analytics for live sales data.",
      reservations_today: "Check Reservations in Busal OS for today's bookings.",
      low_inventory: "Open Inventory to review stock levels and reorder points.",
      general:
        message ||
        "I'm ready to help with your restaurant. Ask about sales, orders, inventory, or reservations.",
    };

    return {
      content:
        fallbackByIntent[intent] ??
        "I can help with sales, orders, inventory, reservations, and business summaries when connected to your workspace.",
      provider: this.id,
      model: "local-rule-engine-v1",
      tokensUsed: 0,
    };
  }
}
