import type { CommunicationAiActionType } from "@prisma/client";

import { AI_CONFIDENCE_ESCALATION_THRESHOLD } from "@/modules/communication/constants/routes";
import type { TimelineMessage } from "@/modules/communication/types/communication-types";

export interface AiInsightResult {
  actionType: CommunicationAiActionType;
  result: Record<string, unknown>;
  confidence: number;
  requiresApproval: boolean;
  shouldEscalate: boolean;
}

export function generateAiInsight(
  actionType: CommunicationAiActionType,
  timeline: TimelineMessage[],
): AiInsightResult {
  const messageCount = timeline.length;
  const lastMessage = timeline.at(-1);

  switch (actionType) {
    case "SUMMARIZE":
      return {
        actionType,
        result: {
          summary: `Conversation with ${messageCount} messages. Latest: ${lastMessage?.body.slice(0, 120) ?? "No messages"}.`,
        },
        confidence: 0.85,
        requiresApproval: true,
        shouldEscalate: false,
      };
    case "DRAFT_REPLY":
      return {
        actionType,
        result: {
          draft: "Thank you for reaching out. I'll look into this and get back to you shortly.",
        },
        confidence: 0.75,
        requiresApproval: true,
        shouldEscalate: false,
      };
    case "SUGGEST_RESPONSE":
      return {
        actionType,
        result: {
          suggestions: [
            "Acknowledge the customer's concern",
            "Provide a timeline for resolution",
            "Offer alternative solutions",
          ],
        },
        confidence: 0.8,
        requiresApproval: true,
        shouldEscalate: false,
      };
    case "CLASSIFY":
      return {
        actionType,
        result: { category: messageCount > 5 ? "support" : "inquiry", tags: ["customer-service"] },
        confidence: 0.7,
        requiresApproval: true,
        shouldEscalate: false,
      };
    case "SENTIMENT":
      return {
        actionType,
        result: { sentiment: "neutral", score: 0.5 },
        confidence: 0.65,
        requiresApproval: true,
        shouldEscalate: false,
      };
    case "RECOMMEND_ACTION":
      return {
        actionType,
        result: { actions: ["assign_to_senior", "schedule_follow_up"] },
        confidence: 0.72,
        requiresApproval: true,
        shouldEscalate: false,
      };
    case "ESCALATE":
      return {
        actionType,
        result: { reason: "Low confidence or complex issue detected", escalateTo: "manager" },
        confidence: 0.55,
        requiresApproval: true,
        shouldEscalate: true,
      };
    default:
      return {
        actionType,
        result: {},
        confidence: 0.5,
        requiresApproval: true,
        shouldEscalate: true,
      };
  }
}

export function shouldEscalateByConfidence(confidence: number): boolean {
  return confidence < AI_CONFIDENCE_ESCALATION_THRESHOLD;
}

export function canAutoSendMessage(autoSend: boolean, requiresApproval: boolean): boolean {
  return autoSend && !requiresApproval;
}
