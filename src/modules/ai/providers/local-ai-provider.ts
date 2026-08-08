import type { AiProvider, AiProviderRequest, AiProviderResponse } from "@/modules/ai/types/context";

/** @deprecated Delegates to centralized AI engine provider manager fallback. */
export class LocalAiProvider implements AiProvider {
  readonly id = "local-mock";
  readonly name = "Busal Central AI (Fallback)";
  readonly capabilities = {
    supportsStreaming: false,
    supportsTools: true,
    maxContextTokens: 8192,
  };

  async complete(request: AiProviderRequest): Promise<AiProviderResponse> {
    const { aiProviderManager } = await import("@/modules/ai-engine/providers/provider-manager");
    const provider = aiProviderManager.resolveProvider({ preferredProviderId: "mock-fallback" });
    const lastUser = [...request.messages].reverse().find((message) => message.role === "user");
    const userMessage = lastUser?.content?.trim() ?? "";

    const response = await provider.complete({
      systemPrompt: request.systemPrompt,
      messages: request.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });

    return {
      content: response.content || `Processed: ${userMessage || "hello"}`,
      providerId: response.providerId,
      model: response.model,
      tokensUsed: response.totalTokens,
    };
  }
}

export const localAiProvider = new LocalAiProvider();
