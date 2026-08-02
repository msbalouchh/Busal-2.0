export interface IAIModel {
  readonly id: string;
  readonly name: string;
  readonly providerId: string;
  readonly maxTokens: number;
  readonly supportsTools: boolean;
}

export interface IAIProviderRequest {
  systemPrompt: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface IAIProviderResponse {
  content: string;
  model: string;
  providerId: string;
  tokensUsed?: number;
}

export interface IAIProvider {
  readonly id: string;
  readonly name: string;
  readonly models: IAIModel[];
  complete(request: IAIProviderRequest): Promise<IAIProviderResponse>;
}
