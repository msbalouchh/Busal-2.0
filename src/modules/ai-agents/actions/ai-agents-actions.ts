"use server";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import {
  archiveAiAgent,
  assignAgentSkill,
  createAiAgent,
  delegateAiAgentTask,
  executeAiAgent,
  exportAiAgentTemplate,
  importAiAgentTemplate,
  pauseAiAgent,
  publishAiAgentVersion,
  rollbackAiAgentVersion,
  setAiAgentTesting,
  storeAiAgentMemory,
} from "@/services/ai-agents.service";

export async function createAiAgentAction(input: {
  name: string;
  agentId?: string;
  description?: string;
  department?: string;
  role?: string;
  skillIds?: string[];
}) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_CREATE, async ({ platform }) =>
    createAiAgent(platform, input),
  );
}

export async function publishAiAgentAction(agentRecordId: string, versionId: string) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_DEPLOY, async ({ platform }) =>
    publishAiAgentVersion(platform, agentRecordId, versionId),
  );
}

export async function executeAiAgentAction(agentRecordId: string, input?: Record<string, unknown>) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_VIEW, async ({ platform }) =>
    executeAiAgent(platform, agentRecordId, input ?? {}),
  );
}

export async function delegateAiAgentAction(input: {
  fromAgentRecordId: string;
  toAgentRecordId: string;
  taskSummary: string;
}) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_DEPLOY, async ({ platform }) =>
    delegateAiAgentTask(platform, input),
  );
}

export async function assignAgentSkillAction(agentRecordId: string, skillId: string) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_EDIT, async ({ platform }) =>
    assignAgentSkill(platform, agentRecordId, skillId),
  );
}

export async function pauseAiAgentAction(agentRecordId: string) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_DISABLE, async ({ platform }) =>
    pauseAiAgent(platform, agentRecordId),
  );
}

export async function importAiAgentTemplateAction(templateId: string) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_CREATE, async ({ platform }) =>
    importAiAgentTemplate(platform, templateId),
  );
}

export async function exportAiAgentTemplateAction(agentRecordId: string) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_VIEW, async ({ platform }) =>
    exportAiAgentTemplate(platform, agentRecordId),
  );
}

export async function rollbackAiAgentAction(agentRecordId: string, versionId: string) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_ADMIN, async ({ platform }) =>
    rollbackAiAgentVersion(platform, agentRecordId, versionId),
  );
}

export async function setAiAgentTestingAction(agentRecordId: string) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_EDIT, async ({ platform }) =>
    setAiAgentTesting(platform, agentRecordId),
  );
}

export async function archiveAiAgentAction(agentRecordId: string) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_DISABLE, async ({ platform }) =>
    archiveAiAgent(platform, agentRecordId),
  );
}

export async function storeAiAgentMemoryAction(
  agentRecordId: string,
  input: {
    memoryType: "SHORT_TERM" | "LONG_TERM" | "BUSINESS" | "CONVERSATION" | "TASK";
    memoryKey?: string;
    content: Record<string, unknown>;
  },
) {
  return protectedAction(PERMISSION_CODES.AI_AGENT_EDIT, async ({ platform }) =>
    storeAiAgentMemory(platform, agentRecordId, input),
  );
}
