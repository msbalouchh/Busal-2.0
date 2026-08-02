import type { KnowledgeCitation } from "@/modules/ai-knowledge/types/knowledge-types";

export interface AiPlatformPermissions {
  canUseChat: boolean;
  canViewAgents: boolean;
  canManageAgents: boolean;
  canViewKnowledge: boolean;
  canManageKnowledge: boolean;
  canViewAutomation: boolean;
  canManageAutomation: boolean;
  canExecuteAutomation: boolean;
  canViewTools: boolean;
  canExecuteTools: boolean;
  canManageTools: boolean;
  canViewAnalytics: boolean;
  canViewSettings: boolean;
  canManageSettings: boolean;
}

export interface AiDashboardWidgets {
  totalAgents: number;
  publishedAgents: number;
  knowledgeDocuments: number;
  knowledgeSearches: number;
  activeAutomations: number;
  automationSuccessRate: number;
  registeredTools: number;
  toolExecutions: number;
  totalTokensUsed: number;
  healthScore: number;
  pendingApprovals: number;
}

export interface AiRecentConversation {
  id: string;
  query: string;
  resultCount: number;
  confidenceScore: number | null;
  createdAt: string;
}

export interface AiPlatformActivityItem {
  id: string;
  type: "agent" | "tool" | "automation" | "knowledge";
  title: string;
  status: string;
  createdAt: string;
}

export interface AiAnalyticsSnapshot {
  totalTokensUsed: number;
  toolTokensUsed: number;
  agentTokensUsed: number;
  automationTokensUsed: number;
  totalCostCents: number;
  averageResponseTimeMs: number;
  successRate: number;
  errorRate: number;
  modelUsage: Array<{ model: string; count: number; tokens: number }>;
  recentErrors: Array<{ id: string; source: string; message: string; createdAt: string }>;
}

export interface AiSettingValue {
  key: string;
  label: string;
  value: unknown;
  valueType: string;
  helpText?: string;
  minValue?: number;
  maxValue?: number;
  allowedValues?: unknown[];
}

export interface AssistantMessageCitation {
  documentTitle: string;
  content: string;
  score: number;
  sourceType: string;
}

export interface AssistantChatResponse {
  content: string;
  citations: AssistantMessageCitation[];
  confidenceScore: number;
  auditId: string;
}

export interface AiPlatformBundle {
  permissions: AiPlatformPermissions;
  widgets: AiDashboardWidgets;
  recentConversations: AiRecentConversation[];
  recentActivity: AiPlatformActivityItem[];
  agents: {
    totalAgents: number;
    publishedAgents: number;
    pausedAgents: number;
    healthScore: number;
    successRate: number;
  } | null;
  knowledge: {
    collectionCount: number;
    documentCount: number;
    publishedVersions: number;
    searchCount: number;
  } | null;
  automation: {
    totalExecutions: number;
    failures: number;
    pendingApprovals: number;
    successRate: number;
    totalAiTokens: number;
  } | null;
  tools: {
    totalTools: number;
    activeTools: number;
    totalExecutions: number;
    successfulExecutions: number;
  } | null;
  analytics: AiAnalyticsSnapshot | null;
}

export interface SendAssistantMessageInput {
  message: string;
  collectionIds?: string[];
}

export type SerializedKnowledgeCitation = KnowledgeCitation;
