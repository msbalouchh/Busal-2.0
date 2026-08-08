import "server-only";

/** Orchestrates domain AI inference via delegated services. */
import { prisma } from "@/lib/prisma";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { listSettingDefinitionsByModule } from "@/modules/settings-engine/registry/settings-registry";
import { ensureBootstrapSettingsEngine } from "@/modules/settings-engine/plugins/bootstrap-settings";
import type {
  AiAnalyticsSnapshot,
  AiPlatformBundle,
  AiPlatformPermissions,
  AiSettingValue,
  AssistantChatResponse,
} from "@/modules/ai-platform/types/ai-platform-types";
import { getAiAgentDashboard } from "@/services/ai-agents.service";
import {
  getAutomationMonitoringDashboard,
  listAutomationWorkflows,
} from "@/services/ai-automation.service";
import {
  getKnowledgeDashboard,
  listKnowledgeSearchAudits,
  retrieveKnowledge,
} from "@/services/ai-knowledge.service";
import { getAiToolsDashboard } from "@/services/ai-tools.service";
import { runCentralAiChat } from "@/services/ai-engine-bridge.service";
import { resolveScopePreview } from "@/services/settings-engine.service";

function buildPermissions(platform: BusinessContext): AiPlatformPermissions {
  const permissions = platform.authorization.permissions;

  return {
    canUseChat:
      platform.isOwner ||
      hasPermission(permissions, PERMISSION_CODES.AI_KNOWLEDGE_VIEW) ||
      hasPermission(permissions, PERMISSION_CODES.AI_AGENT_VIEW),
    canViewAgents: platform.isOwner || hasPermission(permissions, PERMISSION_CODES.AI_AGENT_VIEW),
    canManageAgents:
      platform.isOwner ||
      hasPermission(permissions, PERMISSION_CODES.AI_AGENT_CREATE) ||
      hasPermission(permissions, PERMISSION_CODES.AI_AGENT_EDIT) ||
      hasPermission(permissions, PERMISSION_CODES.AI_AGENT_DEPLOY),
    canViewKnowledge:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.AI_KNOWLEDGE_VIEW),
    canManageKnowledge:
      platform.isOwner ||
      hasPermission(permissions, PERMISSION_CODES.AI_KNOWLEDGE_UPLOAD) ||
      hasPermission(permissions, PERMISSION_CODES.AI_KNOWLEDGE_EDIT),
    canViewAutomation:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.AI_AUTOMATION_VIEW),
    canManageAutomation:
      platform.isOwner ||
      hasPermission(permissions, PERMISSION_CODES.AI_AUTOMATION_CREATE) ||
      hasPermission(permissions, PERMISSION_CODES.AI_AUTOMATION_EDIT),
    canExecuteAutomation:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.AI_AUTOMATION_EXECUTE),
    canViewTools:
      platform.isOwner ||
      hasPermission(permissions, PERMISSION_CODES.AI_TOOL_EXECUTE) ||
      hasPermission(permissions, PERMISSION_CODES.AI_TOOL_REGISTER),
    canExecuteTools:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.AI_TOOL_EXECUTE),
    canManageTools:
      platform.isOwner ||
      hasPermission(permissions, PERMISSION_CODES.AI_TOOL_REGISTER) ||
      hasPermission(permissions, PERMISSION_CODES.AI_TOOL_ADMIN),
    canViewAnalytics:
      platform.isOwner ||
      hasPermission(permissions, PERMISSION_CODES.AI_TOOL_EXECUTE) ||
      hasPermission(permissions, PERMISSION_CODES.AI_AGENT_VIEW) ||
      hasPermission(permissions, PERMISSION_CODES.AI_AUTOMATION_VIEW),
    canViewSettings:
      platform.isOwner ||
      hasPermission(permissions, PERMISSION_CODES.AI_KNOWLEDGE_VIEW) ||
      hasPermission(permissions, PERMISSION_CODES.AI_AGENT_VIEW),
    canManageSettings:
      platform.isOwner || hasPermission(permissions, PERMISSION_CODES.SETTINGS_EDIT),
  };
}

async function getAiAnalyticsSnapshot(businessId: string): Promise<AiAnalyticsSnapshot> {
  const [toolExecutions, agentExecutions, automationExecutions] = await Promise.all([
    prisma.aiToolExecution.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        status: true,
        tokensUsed: true,
        modelUsed: true,
        executionTimeMs: true,
        errorDetails: true,
        createdAt: true,
        toolId: true,
      },
    }),
    prisma.aiAgentExecution.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        status: true,
        tokensUsed: true,
        durationMs: true,
        costCents: true,
        errorDetails: true,
        createdAt: true,
        agentRecordId: true,
      },
    }),
    prisma.automationWorkflowExecution.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        status: true,
        aiCostTokens: true,
        durationMs: true,
        errorDetails: true,
        createdAt: true,
        workflowId: true,
      },
    }),
  ]);

  const toolTokensUsed = toolExecutions.reduce((sum, row) => sum + (row.tokensUsed ?? 0), 0);
  const agentTokensUsed = agentExecutions.reduce((sum, row) => sum + row.tokensUsed, 0);
  const automationTokensUsed = automationExecutions.reduce((sum, row) => sum + row.aiCostTokens, 0);

  const durations = [
    ...toolExecutions
      .map((row) => row.executionTimeMs)
      .filter((value): value is number => value != null),
    ...agentExecutions
      .map((row) => row.durationMs)
      .filter((value): value is number => value != null),
    ...automationExecutions
      .map((row) => row.durationMs)
      .filter((value): value is number => value != null),
  ];

  const successCount =
    toolExecutions.filter((row) => row.status === "SUCCESS").length +
    agentExecutions.filter((row) => row.status === "COMPLETED").length +
    automationExecutions.filter((row) => row.status === "COMPLETED").length;

  const errorCount =
    toolExecutions.filter((row) => row.status === "FAILED").length +
    agentExecutions.filter((row) => row.status === "FAILED").length +
    automationExecutions.filter((row) => row.status === "FAILED").length;

  const totalEvents = toolExecutions.length + agentExecutions.length + automationExecutions.length;

  const modelMap = new Map<string, { count: number; tokens: number }>();
  for (const execution of toolExecutions) {
    const model = execution.modelUsed ?? "unknown";
    const current = modelMap.get(model) ?? { count: 0, tokens: 0 };
    modelMap.set(model, {
      count: current.count + 1,
      tokens: current.tokens + (execution.tokensUsed ?? 0),
    });
  }

  const recentErrors = [
    ...toolExecutions
      .filter((row) => row.status === "FAILED" && row.errorDetails)
      .map((row) => ({
        id: row.id,
        source: `Tool · ${row.toolId}`,
        message: row.errorDetails ?? "Tool execution failed",
        createdAt: row.createdAt.toISOString(),
      })),
    ...agentExecutions
      .filter((row) => row.status === "FAILED" && row.errorDetails)
      .map((row) => ({
        id: row.id,
        source: `Agent · ${row.agentRecordId}`,
        message: row.errorDetails ?? "Agent execution failed",
        createdAt: row.createdAt.toISOString(),
      })),
    ...automationExecutions
      .filter((row) => row.status === "FAILED" && row.errorDetails)
      .map((row) => ({
        id: row.id,
        source: `Automation · ${row.workflowId}`,
        message: row.errorDetails ?? "Automation execution failed",
        createdAt: row.createdAt.toISOString(),
      })),
  ]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 8);

  return {
    totalTokensUsed: toolTokensUsed + agentTokensUsed + automationTokensUsed,
    toolTokensUsed,
    agentTokensUsed,
    automationTokensUsed,
    totalCostCents: agentExecutions.reduce((sum, row) => sum + row.costCents, 0),
    averageResponseTimeMs:
      durations.length > 0
        ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
        : 0,
    successRate: totalEvents > 0 ? successCount / totalEvents : 0,
    errorRate: totalEvents > 0 ? errorCount / totalEvents : 0,
    modelUsage: [...modelMap.entries()]
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((left, right) => right.count - left.count),
    recentErrors,
  };
}

function formatAssistantMarkdown(
  query: string,
  context: string,
  citations: AssistantChatResponse["citations"],
): string {
  if (citations.length === 0) {
    return `I could not find relevant knowledge for **"${query}"**.\n\nTry uploading documents to your knowledge base or refining your question.`;
  }

  const sources = citations
    .map(
      (citation, index) =>
        `${index + 1}. **${citation.documentTitle}** (${citation.sourceType}, ${(citation.score * 100).toFixed(0)}% match)`,
    )
    .join("\n");

  return `### Answer\n\n${context.trim()}\n\n### Sources\n\n${sources}`;
}

export async function composeAssistantResponse(
  platform: BusinessContext,
  message: string,
  options: { collectionIds?: string[] } = {},
): Promise<AssistantChatResponse> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("Message is required");
  }

  const result = await runCentralAiChat(platform, {
    message: trimmed,
    currentModule: "ai-platform",
    enableTools: true,
    metadata: { collectionIds: options.collectionIds },
  });

  return {
    content: result.content,
    citations: [],
    confidenceScore: result.cached ? 0.85 : 0.92,
    auditId: result.auditId,
  };
}

export async function getAiPlatformSettings(platform: BusinessContext): Promise<AiSettingValue[]> {
  ensureBootstrapSettingsEngine();
  const definitions = listSettingDefinitionsByModule("ai");
  const canResolveStoredValues =
    platform.isOwner || platform.permissions.includes(PERMISSION_CODES.SETTINGS_VIEW);

  if (!canResolveStoredValues) {
    return definitions.map((definition) => ({
      key: definition.key,
      label: definition.key.replace(/^ai\./, "").replaceAll("_", " "),
      value: definition.defaultValue,
      valueType: definition.valueType,
      helpText: definition.helpText,
      minValue: definition.minValue,
      maxValue: definition.maxValue,
      allowedValues: definition.allowedValues,
    }));
  }

  const resolved = await Promise.all(
    definitions.map(async (definition) => {
      const preview = await resolveScopePreview(platform, definition.key, ["BUSINESS"]);
      const value = preview[0]?.value ?? definition.defaultValue;

      return {
        key: definition.key,
        label: definition.key.replace(/^ai\./, "").replaceAll("_", " "),
        value,
        valueType: definition.valueType,
        helpText: definition.helpText,
        minValue: definition.minValue,
        maxValue: definition.maxValue,
        allowedValues: definition.allowedValues,
      };
    }),
  );

  return resolved;
}

export async function getAiPlatformBundle(platform: BusinessContext): Promise<AiPlatformBundle> {
  const permissions = buildPermissions(platform);
  const businessId = platform.business.id;

  const [
    agents,
    knowledge,
    automation,
    tools,
    analytics,
    recentSearches,
    activeWorkflows,
    recentToolExecutions,
    recentAgentExecutions,
    recentAutomationExecutions,
  ] = await Promise.all([
    permissions.canViewAgents ? getAiAgentDashboard(businessId) : Promise.resolve(null),
    permissions.canViewKnowledge ? getKnowledgeDashboard(businessId) : Promise.resolve(null),
    permissions.canViewAutomation
      ? getAutomationMonitoringDashboard(businessId)
      : Promise.resolve(null),
    permissions.canViewTools ? getAiToolsDashboard(businessId) : Promise.resolve(null),
    permissions.canViewAnalytics ? getAiAnalyticsSnapshot(businessId) : Promise.resolve(null),
    permissions.canUseChat ? listKnowledgeSearchAudits(businessId, 8) : Promise.resolve([]),
    permissions.canViewAutomation
      ? listAutomationWorkflows(businessId, false)
      : Promise.resolve([]),
    permissions.canViewTools
      ? prisma.aiToolExecution.findMany({
          where: { businessId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, toolId: true, status: true, createdAt: true },
        })
      : Promise.resolve([]),
    permissions.canViewAgents
      ? prisma.aiAgentExecution.findMany({
          where: { businessId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, agentRecordId: true, status: true, createdAt: true },
        })
      : Promise.resolve([]),
    permissions.canViewAutomation
      ? prisma.automationWorkflowExecution.findMany({
          where: { businessId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, workflowId: true, status: true, createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  const recentActivity = [
    ...recentAgentExecutions.map((item) => ({
      id: item.id,
      type: "agent" as const,
      title: item.agentRecordId,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    })),
    ...recentToolExecutions.map((item) => ({
      id: item.id,
      type: "tool" as const,
      title: item.toolId,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    })),
    ...recentAutomationExecutions.map((item) => ({
      id: item.id,
      type: "automation" as const,
      title: item.workflowId,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    })),
  ]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 10);

  const healthScores = [agents?.healthScore, automation?.successRate ?? 0].filter(
    (value) => typeof value === "number",
  );
  const healthScore =
    healthScores.length > 0
      ? healthScores.reduce((sum, value) => sum + value, 0) / healthScores.length
      : 1;

  return {
    permissions,
    widgets: {
      totalAgents: agents?.totalAgents ?? 0,
      publishedAgents: agents?.publishedAgents ?? 0,
      knowledgeDocuments: knowledge?.documentCount ?? 0,
      knowledgeSearches: knowledge?.searchCount ?? 0,
      activeAutomations: activeWorkflows.filter(
        (workflow) => workflow.currentVersion?.status === "PUBLISHED",
      ).length,
      automationSuccessRate: automation?.successRate ?? 0,
      registeredTools: tools?.totalTools ?? 0,
      toolExecutions: tools?.totalExecutions ?? 0,
      totalTokensUsed: analytics?.totalTokensUsed ?? 0,
      healthScore,
      pendingApprovals: automation?.pendingApprovals ?? 0,
    },
    recentConversations: recentSearches.map((search) => ({
      id: search.id,
      query: search.query,
      resultCount: search.resultCount,
      confidenceScore: search.confidenceScore,
      createdAt: search.createdAt.toISOString(),
    })),
    recentActivity,
    agents: agents
      ? {
          totalAgents: agents.totalAgents,
          publishedAgents: agents.publishedAgents,
          pausedAgents: agents.pausedAgents,
          healthScore: agents.healthScore,
          successRate: agents.successRate,
        }
      : null,
    knowledge: knowledge
      ? {
          collectionCount: knowledge.collectionCount,
          documentCount: knowledge.documentCount,
          publishedVersions: knowledge.publishedVersions,
          searchCount: knowledge.searchCount,
        }
      : null,
    automation: automation
      ? {
          totalExecutions: automation.totalExecutions,
          failures: automation.failures,
          pendingApprovals: automation.pendingApprovals,
          successRate: automation.successRate,
          totalAiTokens: automation.totalAiTokens,
        }
      : null,
    tools: tools
      ? {
          totalTools: tools.totalTools,
          activeTools: tools.activeTools,
          totalExecutions: tools.totalExecutions,
          successfulExecutions: tools.successfulExecutions,
        }
      : null,
    analytics,
  };
}

export async function getAiPlatformAnalyticsForVerification(
  platform: BusinessContext,
): Promise<number> {
  const analytics = await getAiAnalyticsSnapshot(platform.business.id);
  return analytics.totalTokensUsed;
}
