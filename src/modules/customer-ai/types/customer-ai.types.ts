import type { CUSTOMER_AI_CHANNELS, CUSTOMER_AI_TONE_OPTIONS } from "@/modules/customer-ai/constants/customer-ai.constants";

export type CustomerAiChannel = (typeof CUSTOMER_AI_CHANNELS)[keyof typeof CUSTOMER_AI_CHANNELS];
export type CustomerAiTone = (typeof CUSTOMER_AI_TONE_OPTIONS)[number];

export interface CustomerAiIdentity {
  aiName: string;
  aiPersonality: string;
  aiAvatarUrl: string | null;
  aiGreeting: string | null;
  aiTone: CustomerAiTone;
  businessName: string;
  whiteLabelName: string | null;
}

export interface CustomerAiCapabilities {
  enabled: boolean;
  readMenu: boolean;
  readHours: boolean;
  readReservations: boolean;
  readOrders: boolean;
  createReservation: boolean;
  createOrder: boolean;
  requireConfirmation: boolean;
}

export interface AiOperationsCapabilities extends CustomerAiCapabilities {
  permissions: Record<string, boolean>;
  ordersCancel: boolean;
  ordersCreate: boolean;
  reservationsCancel: boolean;
  reservationsUpdate: boolean;
  inventoryRead: boolean;
  analyticsRead: boolean;
  destructiveActionsEnabled: boolean;
}

export interface CustomerAiSessionContext {
  sessionId: string;
  sessionToken: string;
  businessId: string;
  customerId: string | null;
  channel: CustomerAiChannel;
  verifiedEmail: string | null;
  verifiedPhone: string | null;
}

export interface CustomerAiChatInput {
  message: string;
  businessId: string;
  conversationId?: string;
  sessionToken?: string;
  channel?: CustomerAiChannel;
  customerId?: string;
  confirmedActions?: string[];
  audience?: "CUSTOMER" | "OWNER";
  ownerId?: string;
}

export interface CustomerAiChatResult {
  conversationId: string;
  sessionToken: string;
  content: string;
  aiName: string;
  aiAvatarUrl: string | null;
  greeting: string | null;
  model: string;
  toolResults: Array<{ toolId: string; output: Record<string, unknown> }>;
  requiresConfirmation?: Array<{ actionId: string; description: string }>;
  escalated: boolean;
}

export interface CustomerAiPublicConfig {
  businessId: string;
  aiName: string;
  aiAvatarUrl: string | null;
  aiGreeting: string | null;
  aiTone: string;
  businessName: string;
  whiteLabelName: string | null;
  enabled: boolean;
}

export interface CustomerAiAnalyticsSnapshot {
  totalConversations: number;
  questionsAnswered: number;
  unresolvedQuestions: number;
  escalations: number;
  reservationsAssisted: number;
  ordersAssisted: number;
  toolExecutions: number;
  confirmationRequired: number;
  tokenUsageEstimate: number;
}

export interface CustomerConversationSummary {
  id: string;
  customerId: string | null;
  customerName: string | null;
  channel: string;
  title: string;
  status: string;
  messageCount: number;
  lastMessageAt: string;
  escalated: boolean;
}
