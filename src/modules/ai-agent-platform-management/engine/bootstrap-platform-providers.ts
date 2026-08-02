import "server-only";

import type {
  IAIProvider,
  IAIProviderRequest,
  IAIProviderResponse,
} from "@/modules/ai-agent-platform-management/interfaces/ai-provider.interface";
import { registerPlatformAiProvider } from "@/modules/ai-agent-platform-management/engine/platform-provider-registry";

class StubPlatformAiProvider implements IAIProvider {
  readonly id = "platform-stub";
  readonly name = "Platform Stub Provider";
  readonly models = [
    {
      id: "stub-v1",
      name: "Stub Model v1",
      providerId: this.id,
      maxTokens: 4096,
      supportsTools: true,
    },
  ];

  async complete(request: IAIProviderRequest): Promise<IAIProviderResponse> {
    const lastUser = [...request.messages].reverse().find((message) => message.role === "user");
    return {
      content:
        lastUser?.content ??
        "Platform provider ready. Connect an external LLM to enable generation.",
      model: "stub-v1",
      providerId: this.id,
      tokensUsed: 0,
    };
  }
}

let bootstrapped = false;

export function ensurePlatformAiProviders(): void {
  if (bootstrapped) return;
  registerPlatformAiProvider(new StubPlatformAiProvider(), { isDefault: true });
  bootstrapped = true;
}
