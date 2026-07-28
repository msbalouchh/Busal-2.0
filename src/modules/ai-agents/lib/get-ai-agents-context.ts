import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeAgent,
  serializeAgentDashboard,
  serializeAgentDelegation,
  serializeAgentExecution,
  serializeAgentMemory,
  serializeAgentSkill,
} from "@/modules/ai-agents/utils/ai-agents-utils";
import {
  ensureAgentTemplates,
  getAiAgentDashboard,
  listAgentSkills,
  listAiAgentDelegations,
  listAiAgentExecutions,
  listAiAgentMemories,
  listAiAgents,
} from "@/services/ai-agents.service";

export const getAiAgentsOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_AGENT_VIEW });
  const dashboard = await getAiAgentDashboard(context.business.id);

  return {
    context,
    dashboard: serializeAgentDashboard(dashboard),
  };
});

export const getAiAgentsRegistryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_AGENT_VIEW });
  const agents = await listAiAgents(context.business.id, false);

  return {
    context,
    agents: agents.map(serializeAgent),
  };
});

export const getAiAgentsTemplatesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_AGENT_VIEW });
  await ensureAgentTemplates(context.business.id);
  const templates = await listAiAgents(context.business.id, true);

  return {
    context,
    templates: templates.map(serializeAgent),
  };
});

export const getAiAgentsSkillsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_AGENT_VIEW });

  return {
    context,
    skills: listAgentSkills().map(serializeAgentSkill),
  };
});

export const getAiAgentsExecutionsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_AGENT_VIEW });
  const executions = await listAiAgentExecutions(context.business.id, 100);

  return {
    context,
    executions: executions.map(serializeAgentExecution),
  };
});

export const getAiAgentsDelegationsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_AGENT_VIEW });
  const delegations = await listAiAgentDelegations(context.business.id, 100);

  return {
    context,
    delegations: delegations.map(serializeAgentDelegation),
  };
});

export const getAiAgentsMemoryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_AGENT_VIEW });
  const memories = await listAiAgentMemories(context.business.id, 100);

  return {
    context,
    memories: memories.map(serializeAgentMemory),
  };
});

export const getAiAgentsMonitoringContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.AI_AGENT_VIEW });
  const dashboard = await getAiAgentDashboard(context.business.id);
  const executions = await listAiAgentExecutions(context.business.id, 20);

  return {
    context,
    dashboard: serializeAgentDashboard(dashboard),
    executions: executions.map(serializeAgentExecution),
  };
});
