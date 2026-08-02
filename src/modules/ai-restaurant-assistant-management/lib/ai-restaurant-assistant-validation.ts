import type { ConversationStatus, RecommendationStatus } from "@prisma/client";

import type {
  ConversationListQuery,
  SendMessageInput,
  UpdateRecommendationInput,
} from "@/modules/ai-restaurant-assistant-management/types/ai-restaurant-assistant-types";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_TITLE_LENGTH = 120;

export function validateSendMessageInput(input: SendMessageInput): void {
  const message = input.message?.trim();
  if (!message) throw new Error("Message is required");
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
  }
}

export function validateConversationTitle(title: string): void {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Conversation title is required");
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title cannot exceed ${MAX_TITLE_LENGTH} characters`);
  }
}

export function validateConversationListQuery(query: ConversationListQuery): void {
  if (query.page !== undefined && query.page < 1) throw new Error("Invalid page");
  if (query.pageSize !== undefined && (query.pageSize < 1 || query.pageSize > 100)) {
    throw new Error("Page size must be between 1 and 100");
  }
}

export function validateRecommendationUpdate(input: UpdateRecommendationInput): void {
  const allowed: RecommendationStatus[] = ["VIEWED", "IMPLEMENTED", "DISMISSED"];
  if (!allowed.includes(input.status)) {
    throw new Error("Invalid recommendation status");
  }
}

export function normalizeConversationStatus(status?: string): ConversationStatus | "ALL" {
  if (!status || status === "ALL") return "ALL";
  if (status === "ACTIVE" || status === "ARCHIVED") return status;
  throw new Error("Invalid conversation status");
}

export function truncateTitle(message: string): string {
  const cleaned = message.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 60) return cleaned;
  return `${cleaned.slice(0, 57)}...`;
}
