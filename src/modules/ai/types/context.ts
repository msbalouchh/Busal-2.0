export interface AiProviderCapabilities {
  supportsStreaming: boolean;
  supportsTools: boolean;
  maxContextTokens: number;
}

export interface AiProviderRequest {
  systemPrompt: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  agentSlug: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AiProviderResponse {
  content: string;
  providerId: string;
  model: string;
  tokensUsed: number;
}

export interface AiProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: AiProviderCapabilities;
  complete(request: AiProviderRequest): Promise<AiProviderResponse>;
}

export interface AiPlatformContext {
  userId: string;
  tenantId: string | null;
  workspaceId: string | null;
  businessId: string | null;
  branchId: string | null;
  activeAgentSlug: string | null;
  activeConversationId: string | null;
  permissions: ReadonlySet<string>;
}

export interface AiContextValue {
  context: AiPlatformContext;
  activeAgentSlug: string | null;
  activeConversationId: string | null;
  setActiveAgent: (agentSlug: string | null) => void;
  setActiveConversation: (conversationId: string | null) => void;
  refresh: () => void;
}
