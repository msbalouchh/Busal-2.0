import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiProvider,
  AiProviderId,
  AiStreamChunk,
} from "@/modules/ai-engine/types/ai-engine.types";

const DEFAULT_TIMEOUT_MS = 60_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function buildUsage(content: string, prompt: string): Pick<AiCompletionResponse, "promptTokens" | "completionTokens" | "totalTokens"> {
  const promptTokens = estimateTokens(prompt);
  const completionTokens = estimateTokens(content);
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };
}

/** OpenAI-compatible chat completions via fetch. */
export class OpenAiProvider implements AiProvider {
  readonly id = "openai" as const;
  readonly name = "OpenAI";
  readonly models = [
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      providerId: this.id,
      maxTokens: 128_000,
      supportsTools: true,
      inputCostPer1kTokens: 0.15,
      outputCostPer1kTokens: 0.6,
    },
    {
      id: "gpt-4o",
      name: "GPT-4o",
      providerId: this.id,
      maxTokens: 128_000,
      supportsTools: true,
      inputCostPer1kTokens: 2.5,
      outputCostPer1kTokens: 10,
    },
  ];

  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const startedAt = Date.now();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const model = request.model ?? this.models[0]?.id ?? "gpt-4o-mini";
    const messages = [
      { role: "system", content: request.systemPrompt },
      ...request.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens ?? 4096,
    };

    if (request.tools?.length) {
      body.tools = request.tools.map((tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));
    }

    const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const payload = (await response.json()) as {
      choices: Array<{
        message: {
          content: string | null;
          tool_calls?: Array<{
            id: string;
            function: { name: string; arguments: string };
          }>;
        };
        finish_reason: string | null;
      }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const choice = payload.choices[0];
    const content = choice?.message.content ?? "";
    const usage = payload.usage;
    const promptTokens = usage?.prompt_tokens ?? estimateTokens(request.systemPrompt);
    const completionTokens = usage?.completion_tokens ?? estimateTokens(content);
    const totalTokens = usage?.total_tokens ?? promptTokens + completionTokens;

    return {
      content,
      model,
      providerId: this.id,
      promptTokens,
      completionTokens,
      totalTokens,
      toolCalls:
        choice?.message.tool_calls?.map((call) => ({
          id: call.id,
          name: call.function.name,
          arguments: JSON.parse(call.function.arguments) as Record<string, unknown>,
        })) ?? [],
      latencyMs: Date.now() - startedAt,
      cached: false,
      finishReason: choice?.finish_reason ?? null,
    };
  }

  async *stream(request: AiCompletionRequest): AsyncGenerator<AiStreamChunk> {
    const result = await this.complete({ ...request, stream: false });
    yield { contentDelta: result.content, done: true, toolCalls: result.toolCalls };
  }
}

/** Anthropic Messages API via fetch. */
export class AnthropicProvider implements AiProvider {
  readonly id = "anthropic" as const;
  readonly name = "Anthropic";
  readonly models = [
    {
      id: "claude-3-5-sonnet-20241022",
      name: "Claude 3.5 Sonnet",
      providerId: this.id,
      maxTokens: 200_000,
      supportsTools: true,
      inputCostPer1kTokens: 3,
      outputCostPer1kTokens: 15,
    },
    {
      id: "claude-3-5-haiku-20241022",
      name: "Claude 3.5 Haiku",
      providerId: this.id,
      maxTokens: 200_000,
      supportsTools: true,
      inputCostPer1kTokens: 0.8,
      outputCostPer1kTokens: 4,
    },
  ];

  isConfigured(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const startedAt = Date.now();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const model = request.model ?? this.models[0]?.id ?? "gpt-4o-mini";
    const response = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: request.maxTokens ?? 4096,
        system: request.systemPrompt,
        messages: request.messages
          .filter((message) => message.role !== "system")
          .map((message) => ({ role: message.role, content: message.content })),
        temperature: request.temperature ?? 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
    }

    const payload = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
      usage?: { input_tokens: number; output_tokens: number };
      stop_reason: string | null;
    };

    const content = payload.content
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("\n");

    const usage = payload.usage;
    const promptTokens = usage?.input_tokens ?? estimateTokens(request.systemPrompt);
    const completionTokens = usage?.output_tokens ?? estimateTokens(content);
    const totalTokens = (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0) || promptTokens + completionTokens;

    return {
      content,
      model,
      providerId: this.id,
      promptTokens,
      completionTokens,
      totalTokens,
      toolCalls: [],
      latencyMs: Date.now() - startedAt,
      cached: false,
      finishReason: payload.stop_reason,
    };
  }
}

/** Google Gemini generateContent via fetch. */
export class GeminiProvider implements AiProvider {
  readonly id = "google-gemini" as const;
  readonly name = "Google Gemini";
  readonly models = [
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      providerId: this.id,
      maxTokens: 1_000_000,
      supportsTools: true,
      inputCostPer1kTokens: 0.1,
      outputCostPer1kTokens: 0.4,
    },
  ];

  isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY);
  }

  private apiKey(): string {
    const key = process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    }
    return key;
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const startedAt = Date.now();
    const model = request.model ?? this.models[0]?.id ?? "gpt-4o-mini";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey()}`;

    const contents = request.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      }));

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: request.systemPrompt }] },
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.3,
          maxOutputTokens: request.maxTokens ?? 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
    };

    const content =
      payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? "";
    const usage = payload.usageMetadata;

    return {
      content,
      model,
      providerId: this.id,
      promptTokens: usage?.promptTokenCount ?? estimateTokens(request.systemPrompt),
      completionTokens: usage?.candidatesTokenCount ?? estimateTokens(content),
      totalTokens: usage?.totalTokenCount ?? estimateTokens(content),
      toolCalls: [],
      latencyMs: Date.now() - startedAt,
      cached: false,
      finishReason: payload.candidates?.[0]?.finishReason ?? null,
    };
  }
}

/** Azure OpenAI — OpenAI-compatible endpoint. */
export class AzureOpenAiProvider implements AiProvider {
  readonly id = "azure-openai" as const;
  readonly name = "Azure OpenAI";
  readonly models = [
    {
      id: "gpt-4o",
      name: "Azure GPT-4o",
      providerId: this.id,
      maxTokens: 128_000,
      supportsTools: true,
      inputCostPer1kTokens: 2.5,
      outputCostPer1kTokens: 10,
    },
  ];

  isConfigured(): boolean {
    return Boolean(
      process.env.AZURE_OPENAI_API_KEY &&
        process.env.AZURE_OPENAI_ENDPOINT &&
        process.env.AZURE_OPENAI_DEPLOYMENT,
    );
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const startedAt = Date.now();
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? request.model ?? this.models[0]?.id ?? "gpt-4o";
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21";

    if (!apiKey || !endpoint) {
      throw new Error("Azure OpenAI is not configured");
    }

    const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: request.systemPrompt },
          ...request.messages.map((message) => ({ role: message.role, content: message.content })),
        ],
        temperature: request.temperature ?? 0.3,
        max_tokens: request.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API error (${response.status}): ${errorText}`);
    }

    const payload = (await response.json()) as {
      choices: Array<{ message: { content: string | null }; finish_reason: string | null }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const content = payload.choices[0]?.message.content ?? "";
    const usage = payload.usage;
    const promptTokens = usage?.prompt_tokens ?? estimateTokens(request.systemPrompt);
    const completionTokens = usage?.completion_tokens ?? estimateTokens(content);
    const totalTokens = usage?.total_tokens ?? promptTokens + completionTokens;

    return {
      content,
      model: deployment,
      providerId: this.id,
      promptTokens,
      completionTokens,
      totalTokens,
      toolCalls: [],
      latencyMs: Date.now() - startedAt,
      cached: false,
      finishReason: payload.choices[0]?.finish_reason ?? null,
    };
  }
}

/** Deterministic fallback when no external provider is configured. */
export class MockFallbackProvider implements AiProvider {
  readonly id = "mock-fallback" as const;
  readonly name = "Mock Fallback";
  readonly models = [
    {
      id: "mock-v1",
      name: "Mock Model",
      providerId: this.id,
      maxTokens: 4096,
      supportsTools: true,
      inputCostPer1kTokens: 0,
      outputCostPer1kTokens: 0,
    },
  ];

  isConfigured(): boolean {
    return true;
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const startedAt = Date.now();
    const lastUser = [...request.messages].reverse().find((message) => message.role === "user");
    const userText = lastUser?.content ?? "";

    const content = [
      "I'm Busal AI, your business intelligence assistant.",
      "",
      `You asked: "${userText.slice(0, 500)}"`,
      "",
      "Configure OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_GEMINI_API_KEY, or Azure OpenAI credentials to enable production LLM responses.",
      "",
      "Available context has been injected automatically including tenant, business, subscription, and module data.",
    ].join("\n");

    const tokens = estimateTokens(content + request.systemPrompt);

    return {
      content,
      model: "mock-v1",
      providerId: this.id,
      promptTokens: Math.round(tokens * 0.6),
      completionTokens: Math.round(tokens * 0.4),
      totalTokens: tokens,
      toolCalls: [],
      latencyMs: Date.now() - startedAt,
      cached: false,
      finishReason: "stop",
    };
  }
}

export function createDefaultProviders(): AiProvider[] {
  return [
    new OpenAiProvider(),
    new AnthropicProvider(),
    new GeminiProvider(),
    new AzureOpenAiProvider(),
    new MockFallbackProvider(),
  ];
}

export type { AiProviderId };
