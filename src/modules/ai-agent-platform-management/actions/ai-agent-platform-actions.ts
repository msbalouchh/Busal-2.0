"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AI_AGENT_PLATFORM_ROUTES } from "@/modules/ai-agent-platform-management/constants/routes";
import { requireAiAgentPlatformActionContext } from "@/modules/ai-agent-platform-management/lib/get-ai-agent-platform-context";
import type {
  ExecuteAgentInput,
  PlatformAgentCapabilityInput,
  PlatformAgentInput,
  PlatformAgentToolInput,
} from "@/modules/ai-agent-platform-management/types/ai-agent-platform-types";
import { updateAgentConfiguration } from "@/services/ai-agent-platform-config.service";
import { executePlatformAgent } from "@/services/ai-agent-platform-executor.service";
import {
  assignAgentTool,
  createPlatformAgent,
  deletePlatformAgent,
  updatePlatformAgent,
  upsertAgentCapability,
} from "@/services/ai-agent-platform-manager.service";

function revalidateAgentPages(agentId?: string) {
  revalidatePath(AI_AGENT_PLATFORM_ROUTES.dashboard());
  revalidatePath(AI_AGENT_PLATFORM_ROUTES.executions());
  if (agentId) {
    revalidatePath(AI_AGENT_PLATFORM_ROUTES.agent(agentId));
    revalidatePath(AI_AGENT_PLATFORM_ROUTES.agentConfig(agentId));
    revalidatePath(AI_AGENT_PLATFORM_ROUTES.executions(agentId));
  }
}

export async function createPlatformAgentAction(input: PlatformAgentInput) {
  const context = await requireAiAgentPlatformActionContext(PERMISSION_CODES.AI_AGENT_CREATE);
  const agent = await createPlatformAgent(context.user.id, input);
  revalidateAgentPages(agent.id);
  return agent;
}

export async function updatePlatformAgentAction(
  agentId: string,
  input: Partial<PlatformAgentInput>,
) {
  const context = await requireAiAgentPlatformActionContext(PERMISSION_CODES.AI_AGENT_UPDATE);
  const agent = await updatePlatformAgent(context.user.id, agentId, input);
  revalidateAgentPages(agentId);
  return agent;
}

export async function deletePlatformAgentAction(agentId: string) {
  const context = await requireAiAgentPlatformActionContext(PERMISSION_CODES.AI_AGENT_DELETE);
  await deletePlatformAgent(context.user.id, agentId);
  revalidateAgentPages(agentId);
  return { success: true };
}

export async function updateAgentConfigurationAction(
  agentId: string,
  configuration: Record<string, unknown>,
) {
  const context = await requireAiAgentPlatformActionContext(PERMISSION_CODES.AI_AGENT_UPDATE);
  await updateAgentConfiguration(context.user.id, agentId, configuration);
  revalidateAgentPages(agentId);
  return { success: true };
}

export async function assignAgentToolAction(agentId: string, input: PlatformAgentToolInput) {
  const context = await requireAiAgentPlatformActionContext(PERMISSION_CODES.AI_AGENT_UPDATE);
  const tool = await assignAgentTool(context.user.id, agentId, input);
  revalidateAgentPages(agentId);
  return tool;
}

export async function upsertAgentCapabilityAction(
  agentId: string,
  input: PlatformAgentCapabilityInput,
) {
  const context = await requireAiAgentPlatformActionContext(PERMISSION_CODES.AI_AGENT_UPDATE);
  const capability = await upsertAgentCapability(context.user.id, agentId, input);
  revalidateAgentPages(agentId);
  return capability;
}

export async function executePlatformAgentAction(input: ExecuteAgentInput) {
  const context = await requireAiAgentPlatformActionContext(PERMISSION_CODES.AI_AGENT_EXECUTE);
  const execution = await executePlatformAgent(
    context.user.id,
    context.authorization.permissions,
    input,
    context.authorization.isOwner,
  );
  revalidateAgentPages(input.agentId);
  return execution;
}
