import "server-only";

import { randomUUID } from "crypto";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { buildOperatorPlatformContext } from "@/modules/control-center/platform-admin/lib/build-operator-platform-context";
import { buildPlatformCeoExecutiveContext } from "@/modules/control-center/platform-ceo/lib/build-executive-context";
import { platformCeoToolRegistry } from "@/modules/control-center/platform-ceo/lib/ceo-tool-registry";
import {
  PLATFORM_CEO_AGENT_SLUG,
  PLATFORM_CEO_SUGGESTED_PROMPTS,
} from "@/modules/control-center/platform-ceo/constants/platform-ceo";
import {
  appendPlatformCeoAuditEntry,
  appendPlatformCeoMemoryRecommendation,
  appendPlatformCeoMemorySummary,
  appendPlatformCeoMessages,
  archivePlatformCeoConversation,
  createPlatformCeoConversation,
  deletePlatformCeoConversation,
  getPlatformCeoConversation,
  listPlatformCeoConversations,
  loadPlatformCeoMemory,
  renamePlatformCeoConversation,
} from "@/modules/control-center/platform-ceo/repository/platform-ceo.repository";
import type {
  PlatformCeoChatRequest,
  PlatformCeoChatResponse,
  PlatformCeoConversationQuery,
  PlatformCeoHubBundle,
  PlatformCeoMessage,
  PlatformCeoPermissions,
} from "@/modules/control-center/platform-ceo/types/platform-ceo.types";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";
import { runCentralAiChat } from "@/services/ai-engine-bridge.service";
import {
  formatAdvisoryForChat,
  runExecutiveReasoning,
} from "@/modules/control-center/platform-ceo/lib/intelligence/executive-reasoning-engine";

function buildPermissions(operator: ControlCenterOperatorContext): PlatformCeoPermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);
  const canView =
    hasAdmin || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_CEO);

  return {
    canView,
    canChat: canView,
    canManageConversations: canView,
  };
}

function composePromptWithHistory(
  message: string,
  priorMessages: PlatformCeoMessage[],
): string {
  const recent = priorMessages.slice(-8);
  if (recent.length === 0) {
    return message;
  }

  const transcript = recent
    .map((entry) => `${entry.role === "user" ? "Operator" : "Platform CEO"}: ${entry.content}`)
    .join("\n");

  return [
    "Previous conversation context:",
    transcript,
    "",
    `Operator: ${message}`,
    "",
    "Respond as the Platform CEO assistant using the executive context provided in metadata.",
  ].join("\n");
}

export async function getPlatformCeoHubBundle(
  operator: ControlCenterOperatorContext,
  options: {
    conversationId?: string | null;
    conversationQuery?: PlatformCeoConversationQuery;
  } = {},
): Promise<PlatformCeoHubBundle> {
  const permissions = buildPermissions(operator);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const [memory, recentConversations] = await Promise.all([
    loadPlatformCeoMemory(operator.userId),
    listPlatformCeoConversations(operator.userId, options.conversationQuery ?? { limit: 20 }),
  ]);

  const activeConversation = options.conversationId
    ? await getPlatformCeoConversation(operator.userId, options.conversationId)
    : null;

  return {
    permissions,
    operator,
    suggestedPrompts: [...PLATFORM_CEO_SUGGESTED_PROMPTS],
    recentConversations,
    activeConversation,
    registeredTools: platformCeoToolRegistry.listForPermissions(operator.permissions),
    memory,
    refreshedAt: new Date().toISOString(),
  };
}

export async function createPlatformCeoConversationForOperator(
  operator: ControlCenterOperatorContext,
  title?: string,
) {
  const permissions = buildPermissions(operator);
  if (!permissions.canManageConversations) {
    throw new Error("Permission denied");
  }

  return createPlatformCeoConversation(operator.userId, title ?? "New conversation");
}

export async function renamePlatformCeoConversationForOperator(
  operator: ControlCenterOperatorContext,
  conversationId: string,
  title: string,
) {
  const permissions = buildPermissions(operator);
  if (!permissions.canManageConversations) {
    throw new Error("Permission denied");
  }

  return renamePlatformCeoConversation(operator.userId, conversationId, title);
}

export async function archivePlatformCeoConversationForOperator(
  operator: ControlCenterOperatorContext,
  conversationId: string,
) {
  const permissions = buildPermissions(operator);
  if (!permissions.canManageConversations) {
    throw new Error("Permission denied");
  }

  return archivePlatformCeoConversation(operator.userId, conversationId);
}

export async function deletePlatformCeoConversationForOperator(
  operator: ControlCenterOperatorContext,
  conversationId: string,
) {
  const permissions = buildPermissions(operator);
  if (!permissions.canManageConversations) {
    throw new Error("Permission denied");
  }

  return deletePlatformCeoConversation(operator.userId, conversationId);
}

export async function searchPlatformCeoConversationsForOperator(
  operator: ControlCenterOperatorContext,
  query: PlatformCeoConversationQuery,
) {
  const permissions = buildPermissions(operator);
  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  return listPlatformCeoConversations(operator.userId, query);
}

export async function sendPlatformCeoMessage(
  operator: ControlCenterOperatorContext,
  request: PlatformCeoChatRequest,
): Promise<PlatformCeoChatResponse> {
  const permissions = buildPermissions(operator);
  if (!permissions.canChat) {
    throw new Error("Permission denied");
  }

  const trimmedMessage = request.message.trim();
  if (!trimmedMessage) {
    throw new Error("Message is required");
  }

  const memory = await loadPlatformCeoMemory(operator.userId);
  const executiveContext = await buildPlatformCeoExecutiveContext(operator, memory);
  const advisory = runExecutiveReasoning({ context: executiveContext, question: trimmedMessage });
  const registeredTools = platformCeoToolRegistry.listForPermissions(operator.permissions);
  const toolUsage = registeredTools.map((tool) => tool.id);

  let conversation =
    request.conversationId != null
      ? await getPlatformCeoConversation(operator.userId, request.conversationId)
      : null;

  if (!conversation) {
    conversation = await createPlatformCeoConversation(
      operator.userId,
      request.title ?? trimmedMessage.slice(0, 80),
    );
  }

  const userMessage: PlatformCeoMessage = {
    id: randomUUID(),
    role: "user",
    content: trimmedMessage,
    createdAt: new Date().toISOString(),
  };

  const platform = await buildOperatorPlatformContext(operator);
  const composedMessage = composePromptWithHistory(trimmedMessage, conversation.messages);

  const aiResult = await runCentralAiChat(platform, {
    message: composedMessage,
    agentSlug: PLATFORM_CEO_AGENT_SLUG,
    currentModule: "control-center",
    enableTools: false,
    stream: false,
    metadata: {
      executiveContext,
      executiveAdvisory: advisory,
      registeredTools: registeredTools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        domain: tool.domain,
        readOnly: tool.metadata.readOnly,
      })),
      operator: {
        userId: operator.userId,
        email: operator.email,
        fullName: operator.fullName,
      },
    },
  });

  const structuredContent = formatAdvisoryForChat(advisory);
  const displayContent =
    aiResult.content.trim().length > 50
      ? `${structuredContent}\n\n---\n\n${aiResult.content}`
      : structuredContent;

  const assistantMessage: PlatformCeoMessage = {
    id: randomUUID(),
    role: "assistant",
    content: displayContent,
    createdAt: new Date().toISOString(),
    metadata: {
      model: aiResult.model,
      promptTokens: aiResult.promptTokens,
      completionTokens: aiResult.completionTokens,
      totalTokens: aiResult.totalTokens,
      latencyMs: aiResult.latencyMs,
      toolUsage,
      advisory: {
        executiveSummary: advisory.executiveSummary,
        reasoning: advisory.reasoning,
        confidence: advisory.confidence,
        priority: advisory.priority,
        recommendedActionsCount: advisory.recommendedActions.length,
      },
    },
  };

  const updatedConversation = await appendPlatformCeoMessages(operator.userId, conversation.id, [
    userMessage,
    assistantMessage,
  ]);

  const auditId = randomUUID();
  await appendPlatformCeoAuditEntry(operator.userId, {
    id: auditId,
    operatorId: operator.userId,
    operatorEmail: operator.email,
    prompt: trimmedMessage,
    conversationId: updatedConversation.id,
    timestamp: new Date().toISOString(),
    toolUsage,
    latencyMs: aiResult.latencyMs,
    model: aiResult.model,
    promptTokens: aiResult.promptTokens,
    completionTokens: aiResult.completionTokens,
    totalTokens: aiResult.totalTokens,
  });

  await appendPlatformCeoMemorySummary(operator.userId, advisory.executiveSummary.slice(0, 500));
  await appendPlatformCeoMemoryRecommendation(
    operator.userId,
    advisory.recommendedActions
      .slice(0, 2)
      .map((item) => item.title)
      .join("; ") || "No new recommendations",
  );

  return {
    conversation: updatedConversation,
    assistantMessage,
    auditId,
    executiveContextGeneratedAt: executiveContext.generatedAt,
  };
}
