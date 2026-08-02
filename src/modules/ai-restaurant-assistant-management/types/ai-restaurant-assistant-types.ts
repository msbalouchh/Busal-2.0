import type {
  ConversationStatus,
  MessageRole,
  RecommendationPriority,
  RecommendationStatus,
} from "@prisma/client";

export interface ConversationRecord {
  id: string;
  businessId: string;
  staffId: string | null;
  title: string;
  status: ConversationStatus;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessagePreview?: string | null;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface RecommendationRecord {
  id: string;
  businessId: string;
  type: string;
  priority: RecommendationPriority;
  title: string;
  description: string;
  action: string | null;
  status: RecommendationStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageInput {
  conversationId?: string | null;
  message: string;
  branchId?: string | null;
}

export interface AssistantResponse {
  conversationId: string;
  message: MessageRecord;
  intent?: string;
  insightCards?: InsightCard[];
}

export interface InsightCard {
  id: string;
  category: string;
  title: string;
  value: string;
  hint?: string;
}

export interface BusinessHealthSummary {
  score: number;
  label: string;
  highlights: InsightCard[];
  concerns: string[];
}

export interface PeriodSummary {
  period: "daily" | "weekly" | "monthly";
  title: string;
  content: string;
  insights: InsightCard[];
}

export interface ConversationListQuery {
  search?: string;
  status?: ConversationStatus | "ALL";
  pinnedOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ConversationListResult {
  items: ConversationRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AiCompletionRequest {
  systemPrompt: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

export interface AiCompletionResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed?: number;
}

export interface AiProviderCapabilities {
  supportsStreaming: boolean;
  supportsTools: boolean;
  maxContextTokens: number;
}

export interface UpdateRecommendationInput {
  status: RecommendationStatus;
}
