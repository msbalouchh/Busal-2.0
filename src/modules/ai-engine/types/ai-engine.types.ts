export const AI_PROVIDER_IDS = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GEMINI: "google-gemini",
  AZURE_OPENAI: "azure-openai",
  MOCK: "mock-fallback",
} as const;

export type AiProviderId = (typeof AI_PROVIDER_IDS)[keyof typeof AI_PROVIDER_IDS];

export interface AiModelDefinition {
  id: string;
  name: string;
  providerId: AiProviderId;
  maxTokens: number;
  supportsTools: boolean;
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
}

export type AiMessageRole = "system" | "user" | "assistant" | "tool";

export interface AiChatMessage {
  role: AiMessageRole;
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface AiToolCallRequest {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AiCompletionRequest {
  systemPrompt: string;
  messages: AiChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: AiToolDefinition[];
  stream?: boolean;
}

export interface AiToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AiCompletionResponse {
  content: string;
  model: string;
  providerId: AiProviderId;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  toolCalls: AiToolCallRequest[];
  latencyMs: number;
  cached: boolean;
  finishReason: string | null;
}

export interface AiStreamChunk {
  contentDelta: string;
  done: boolean;
  toolCalls?: AiToolCallRequest[];
}

export interface AiProvider {
  readonly id: AiProviderId;
  readonly name: string;
  readonly models: AiModelDefinition[];
  isConfigured(): boolean;
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
  stream?(request: AiCompletionRequest): AsyncGenerator<AiStreamChunk>;
}

export interface AiEngineChatInput {
  message: string;
  conversationId?: string;
  agentSlug?: string;
  currentModule?: string;
  model?: string;
  providerId?: AiProviderId;
  temperature?: number;
  maxTokens?: number;
  enableTools?: boolean;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AiEngineChatResult {
  conversationId: string;
  content: string;
  model: string;
  providerId: AiProviderId;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costCents: number;
  latencyMs: number;
  toolCalls: AiToolCallRequest[];
  toolResults: Array<{ toolCallId: string; toolId: string; output: Record<string, unknown> }>;
  auditId: string;
  cached: boolean;
}

export interface AiEngineInsightInput {
  prompt: string;
  currentModule: string;
  contextData?: Record<string, unknown>;
  responseFormat?: "text" | "json";
}

export interface AiEngineInsightResult {
  content: string;
  parsed?: Record<string, unknown>;
  model: string;
  providerId: AiProviderId;
  totalTokens: number;
  costCents: number;
  auditId: string;
}

export interface AiInjectedContext {
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  enabledModules: string[];
  permissions: string[];
  roleSlug: string | null;
  isOwner: boolean;
  businessName: string;
  industry: string;
  timezone: string;
  currency: string;
  currentModule: string | null;
  businessProfile: Record<string, unknown>;
  relevantData: Record<string, unknown>;
}
