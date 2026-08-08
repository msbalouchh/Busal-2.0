import type { PlatformToolDefinition } from "@/modules/ai-tools/types/platform-tool";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";

export type PlatformCeoConversationStatus = "active" | "archived";

export interface PlatformCeoMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  metadata?: {
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    latencyMs?: number;
    toolUsage?: string[];
    advisory?: {
      executiveSummary: string;
      reasoning: string;
      confidence: number;
      priority: string;
      recommendedActionsCount: number;
    };
  };
}

export interface PlatformCeoConversation {
  id: string;
  title: string;
  status: PlatformCeoConversationStatus;
  createdAt: string;
  updatedAt: string;
  messages: PlatformCeoMessage[];
}

export interface PlatformCeoMemoryEntry {
  id: string;
  content: string;
  createdAt: string;
}

export interface PlatformCeoMemory {
  operatorPreferences: Record<string, unknown>;
  pinnedBusinesses: string[];
  pinnedReports: string[];
  previousSummaries: PlatformCeoMemoryEntry[];
  previousRecommendations: PlatformCeoMemoryEntry[];
}

export interface PlatformCeoAuditEntry {
  id: string;
  operatorId: string;
  operatorEmail: string;
  prompt: string;
  conversationId: string | null;
  timestamp: string;
  toolUsage: string[];
  latencyMs: number;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface PlatformCeoPermissions {
  canView: boolean;
  canChat: boolean;
  canManageConversations: boolean;
}

export interface PlatformCeoIntelligenceSummary {
  weekly: string;
  monthly: string;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    actionLabel: string | null;
  }>;
  operationalInsights: string[];
  scores: Array<{
    id: string;
    label: string;
    value: number;
    format?: "score" | "percent" | "currency" | "number";
  }>;
}

export interface PlatformCeoExecutiveContext {
  generatedAt: string;
  operator: {
    userId: string;
    email: string;
    fullName: string;
    permissions: string[];
  };
  platform: Record<string, unknown>;
  businesses: Record<string, unknown>;
  workspaces: Record<string, unknown>;
  operators: Record<string, unknown>;
  revenue: Record<string, unknown>;
  subscriptions: Record<string, unknown>;
  platformHealth: Record<string, unknown>;
  growth: Record<string, unknown>;
  churn: Record<string, unknown>;
  security: Record<string, unknown>;
  monitoring: Record<string, unknown>;
  aiUsage: Record<string, unknown>;
  featureFlags: Record<string, unknown>;
  support: Record<string, unknown>;
  commercial: Record<string, unknown>;
  intelligenceSummary: PlatformCeoIntelligenceSummary;
  memory: PlatformCeoMemory;
}

export interface PlatformCeoSuggestedPrompt {
  id: string;
  label: string;
  prompt: string;
}

export interface PlatformCeoConversationQuery {
  search?: string;
  status?: PlatformCeoConversationStatus | "all";
  limit?: number;
}

export interface PlatformCeoHubBundle {
  permissions: PlatformCeoPermissions;
  operator: ControlCenterOperatorContext;
  suggestedPrompts: PlatformCeoSuggestedPrompt[];
  recentConversations: PlatformCeoConversation[];
  activeConversation: PlatformCeoConversation | null;
  registeredTools: PlatformCeoToolDefinition[];
  memory: PlatformCeoMemory;
  refreshedAt: string;
}

export interface PlatformCeoChatRequest {
  conversationId?: string | null;
  message: string;
  title?: string;
}

export interface PlatformCeoChatResponse {
  conversation: PlatformCeoConversation;
  assistantMessage: PlatformCeoMessage;
  auditId: string;
  executiveContextGeneratedAt: string;
}

export interface PlatformCeoToolDefinition extends Omit<PlatformToolDefinition, "handler"> {
  domain:
    | "platform_intelligence"
    | "businesses"
    | "analytics"
    | "ai_usage"
    | "security"
    | "monitoring"
    | "billing"
    | "feature_flags"
    | "support"
    | "operators"
    | "settings"
    | "workspace";
}
