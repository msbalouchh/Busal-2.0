"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { CUSTOMER_AI_ROUTES } from "@/modules/customer-ai/constants/customer-ai.constants";
import { updateCustomerAiIdentity, uploadCustomerAiAvatar } from "@/modules/customer-ai/services/customer-ai-identity.service";
import {
  getCustomerAiCapabilities,
  updateCustomerAiCapabilities,
} from "@/modules/customer-ai/services/customer-ai-settings.service";
import { getCustomerAiIdentity } from "@/modules/customer-ai/services/customer-ai-identity.service";
import {
  escalateCustomerConversation,
  getCustomerAiAnalytics,
  getCustomerConversationDetail,
  listCustomerConversations,
} from "@/modules/customer-ai/services/customer-ai-analytics.service";
import { syncBusinessDataToKnowledge, getCustomerAiKnowledgeSummary } from "@/modules/customer-ai/services/customer-ai-knowledge-sync.service";
import { verifyCustomerIdentity } from "@/modules/customer-ai/services/customer-identity.service";
import { runCustomerAiChat } from "@/modules/customer-ai/services/customer-ai-chat.service";
import { listMessagingChannels } from "@/modules/customer-ai/channels/messaging-channel-registry";
import { issueEmbedToken } from "@/modules/platform/services/platform-embed.service";
import { getAiOperationsCapabilities } from "@/modules/customer-ai/tools/tool-permission-service";
import type { CustomerAiCapabilities } from "@/modules/customer-ai/types/customer-ai.types";

export async function updateCustomerAiIdentityAction(input: {
  aiName?: string;
  aiPersonality?: string;
  aiAvatarUrl?: string | null;
  aiGreeting?: string | null;
  aiTone?: string;
}) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_EDIT, async ({ platform }) => {
    const result = await updateCustomerAiIdentity(platform.business.id, input);
    revalidatePath(CUSTOMER_AI_ROUTES.controlCenter);
    return result;
  });
}

export async function syncBusinessKnowledgeAction() {
  return protectedAction(PERMISSION_CODES.AI_KNOWLEDGE_ADMIN, async ({ platform }) => {
    const result = await syncBusinessDataToKnowledge(platform.business.id);
    revalidatePath(CUSTOMER_AI_ROUTES.controlCenter);
    return result;
  });
}

export async function getCustomerAiControlCenterAction() {
  return protectedAction(PERMISSION_CODES.AI_VIEW, async ({ platform }) => {
    const businessId = platform.business.id;
    const [identity, capabilities, operationsCapabilities, analytics, conversations, channels, knowledge] =
      await Promise.all([
      getCustomerAiIdentity(businessId),
      getCustomerAiCapabilities(platform),
      getAiOperationsCapabilities(platform),
      getCustomerAiAnalytics(businessId),
      listCustomerConversations(businessId),
      Promise.resolve(listMessagingChannels()),
      getCustomerAiKnowledgeSummary(businessId),
    ]);

    return { identity, capabilities, operationsCapabilities, analytics, conversations, channels, knowledge };
  });
}

export async function uploadCustomerAiAvatarAction(input: {
  originalName: string;
  mimeType: string;
  contentBase64: string;
}) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_EDIT, async ({ platform }) => {
    const result = await uploadCustomerAiAvatar(platform, input);
    revalidatePath(CUSTOMER_AI_ROUTES.controlCenter);
    return result;
  });
}

export async function updateCustomerAiCapabilitiesAction(input: Partial<CustomerAiCapabilities>) {
  return protectedAction(PERMISSION_CODES.SETTINGS_EDIT, async ({ platform }) => {
    const result = await updateCustomerAiCapabilities(platform, input);
    revalidatePath(CUSTOMER_AI_ROUTES.controlCenter);
    return result;
  });
}

export async function issueCustomerAiEmbedTokenAction(origin: string) {
  return protectedAction(PERMISSION_CODES.AI_VIEW, async ({ platform }) => {
    const token = await issueEmbedToken({
      businessId: platform.business.id,
      widgetType: "ai",
      origin: origin.trim() || "https://localhost",
    });
    if (!token) {
      throw new Error("Unable to issue embed token. Check embed settings and allowed origins.");
    }
    const embedUrl = `/embed/chat?businessId=${platform.business.id}&token=${encodeURIComponent(token)}`;
    return { token, embedUrl };
  });
}

export async function escalateConversationAction(conversationId: string) {
  return protectedAction(PERMISSION_CODES.AI_VIEW, async ({ platform }) => {
    await escalateCustomerConversation(platform.business.id, conversationId);
    revalidatePath(CUSTOMER_AI_ROUTES.controlCenter);
    revalidatePath(CUSTOMER_AI_ROUTES.conversations);
    return { success: true };
  });
}

export async function getCustomerConversationDetailAction(conversationId: string) {
  return protectedAction(PERMISSION_CODES.AI_VIEW, async ({ platform }) => {
    const detail = await getCustomerConversationDetail(platform.business.id, conversationId);
    if (!detail) {
      throw new Error("Conversation not found");
    }
    return detail;
  });
}

export async function sendCustomerAiChatAction(input: {
  businessId: string;
  message: string;
  conversationId?: string;
  sessionToken?: string;
  channel?: string;
  confirmedActions?: string[];
}) {
  return runCustomerAiChat({
    businessId: input.businessId,
    message: input.message,
    conversationId: input.conversationId,
    sessionToken: input.sessionToken,
    channel: input.channel as "website" | undefined,
    confirmedActions: input.confirmedActions,
  });
}

export async function verifyCustomerIdentityAction(input: {
  businessId: string;
  sessionToken: string;
  email?: string;
  phone?: string;
  orderReference?: string;
}) {
  return verifyCustomerIdentity(input);
}
