import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeAgent,
  serializeAgentDashboard,
  serializeAgentExecution,
} from "@/modules/ai-agents/utils/ai-agents-utils";
import {
  serializeAutomationDashboard,
  serializeAutomationExecution,
  serializeAutomationWorkflow,
} from "@/modules/ai-automation/utils/ai-automation-utils";
import {
  serializeKnowledgeCollection,
  serializeKnowledgeDashboard,
  serializeKnowledgeDocument,
  serializeKnowledgeSearchAudit,
} from "@/modules/ai-knowledge/utils/ai-knowledge-utils";
import {
  serializeAiTool,
  serializeAiToolExecution,
  serializeAiToolsDashboard,
} from "@/modules/ai-tools/utils/ai-tools-utils";
import {
  getAiAgentDashboard,
  listAiAgentExecutions,
  listAiAgents,
} from "@/services/ai-agents.service";
import {
  getAutomationMonitoringDashboard,
  listAutomationExecutions,
  listAutomationWorkflows,
} from "@/services/ai-automation.service";
import {
  getKnowledgeDashboard,
  listKnowledgeCollections,
  listKnowledgeDocuments,
  listKnowledgeSearchAudits,
} from "@/services/ai-knowledge.service";
import {
  discoverAvailableAiTools,
  listAiToolExecutions,
  listAiTools,
} from "@/services/ai-tools.service";
import {
  getAiPlatformAnalyticsForVerification,
  getAiPlatformBundle,
  getAiPlatformSettings,
} from "@/services/ai-platform-module.service";

export const getAiPlatformContext = cache(async () => {
  const platform = await protectedPage();
  const bundle = await getAiPlatformBundle(platform);

  return {
    platform,
    ...bundle,
  };
});

export const getAiPlatformAssistantContext = cache(async () => {
  const platform = await protectedPage({
    permission: PERMISSION_CODES.AI_KNOWLEDGE_VIEW,
  });
  const [bundle, collections, recentSearches] = await Promise.all([
    getAiPlatformBundle(platform),
    listKnowledgeCollections(platform.business.id),
    listKnowledgeSearchAudits(platform.business.id, 20),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    collections: collections.map(serializeKnowledgeCollection),
    recentSearches: recentSearches.map(serializeKnowledgeSearchAudit),
  };
});

export const getAiPlatformAgentsContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.AI_AGENT_VIEW });
  const [bundle, agents, dashboard, executions] = await Promise.all([
    getAiPlatformBundle(platform),
    listAiAgents(platform.business.id, false),
    getAiAgentDashboard(platform.business.id),
    listAiAgentExecutions(platform.business.id, 20),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    agents: agents.map(serializeAgent),
    dashboard: serializeAgentDashboard(dashboard),
    executions: executions.map(serializeAgentExecution),
  };
});

export const getAiPlatformKnowledgeContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.AI_KNOWLEDGE_VIEW });
  const [bundle, dashboard, documents, collections, recentSearches] = await Promise.all([
    getAiPlatformBundle(platform),
    getKnowledgeDashboard(platform.business.id),
    listKnowledgeDocuments(platform.business.id),
    listKnowledgeCollections(platform.business.id),
    listKnowledgeSearchAudits(platform.business.id, 10),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    dashboard: serializeKnowledgeDashboard(dashboard),
    documents: documents.map(serializeKnowledgeDocument),
    collections: collections.map(serializeKnowledgeCollection),
    recentSearches: recentSearches.map(serializeKnowledgeSearchAudit),
  };
});

export const getAiPlatformAutomationContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.AI_AUTOMATION_VIEW });
  const [bundle, dashboard, workflows, executions] = await Promise.all([
    getAiPlatformBundle(platform),
    getAutomationMonitoringDashboard(platform.business.id),
    listAutomationWorkflows(platform.business.id, false),
    listAutomationExecutions(platform.business.id, 20),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    dashboard: serializeAutomationDashboard(dashboard),
    workflows: workflows.map(serializeAutomationWorkflow),
    executions: executions.map(serializeAutomationExecution),
  };
});

export const getAiPlatformToolsContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.AI_TOOL_EXECUTE });
  const [bundle, tools, executions, discovered] = await Promise.all([
    getAiPlatformBundle(platform),
    listAiTools(platform.business.id),
    listAiToolExecutions(platform.business.id, 20),
    discoverAvailableAiTools(platform),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    dashboard: serializeAiToolsDashboard({ tools, executions }),
    tools: tools.map(serializeAiTool),
    executions: executions.map(serializeAiToolExecution),
    discovered,
  };
});

export const getAiPlatformAnalyticsContext = cache(async () => {
  const platform = await protectedPage();
  const bundle = await getAiPlatformBundle(platform);

  return {
    platform,
    permissions: bundle.permissions,
    analytics: bundle.analytics,
    widgets: bundle.widgets,
  };
});

export const getAiPlatformSettingsContext = cache(async () => {
  const platform = await protectedPage();
  const [bundle, settings] = await Promise.all([
    getAiPlatformBundle(platform),
    getAiPlatformSettings(platform),
  ]);

  return {
    platform,
    permissions: bundle.permissions,
    settings,
  };
});

export const getAiPlatformModuleContext = getAiPlatformContext;
export const getAiPlatformAnalyticsVerificationTotal = getAiPlatformAnalyticsForVerification;
