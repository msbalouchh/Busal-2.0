import { MOCK_AI_RESPONSES } from "@/modules/ai/constants/mock-data";
import type { AiProvider, AiProviderRequest, AiProviderResponse } from "@/modules/ai/types/context";

/**
 * Local mock AI provider — no external API calls, no API keys.
 * Replaceable via provider registration in future integrations.
 */
export class LocalAiProvider implements AiProvider {
  readonly id = "local-mock";
  readonly name = "Busal Local AI (Mock)";
  readonly capabilities = {
    supportsStreaming: false,
    supportsTools: true,
    maxContextTokens: 8192,
  };

  async complete(request: AiProviderRequest): Promise<AiProviderResponse> {
    const lastUser = [...request.messages].reverse().find((message) => message.role === "user");
    const userMessage = lastUser?.content?.trim() ?? "";
    const canned = MOCK_AI_RESPONSES[request.agentSlug];
    const content =
      canned ??
      `I'm ${request.agentSlug} on Busal OS (mock). You said: "${userMessage || "hello"}". Connect a cloud provider to enable live inference.`;

    return {
      content,
      providerId: this.id,
      model: "busal-mock-v1",
      tokensUsed: 0,
    };
  }
}

export const localAiProvider = new LocalAiProvider();
