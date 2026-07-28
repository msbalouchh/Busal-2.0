import type {
  AiAgent,
  AiAgentDelegation,
  AiAgentExecution,
  AiAgentMemory,
  AiAgentSchedule,
  AiAgentVersion,
} from "@prisma/client";

import type { AgentDashboardMetrics } from "@/modules/ai-agents/types/agent-types";

export interface AgentView {
  id: string;
  agentId: string;
  name: string;
  description: string | null;
  avatar: string | null;
  department: string | null;
  role: string | null;
  status: AiAgent["status"];
  branchId: string | null;
  isTemplate: boolean;
  versionNumber: number | null;
  createdAt: string;
}

export interface AgentExecutionView {
  id: string;
  agentName: string;
  status: AiAgentExecution["status"];
  triggerType: AiAgentExecution["triggerType"];
  tokensUsed: number;
  costCents: number;
  knowledgeHits: number;
  toolCalls: number;
  durationMs: number | null;
  errorDetails: string | null;
  createdAt: string;
}

export interface AgentDelegationView {
  id: string;
  fromAgentName: string;
  toAgentName: string;
  taskSummary: string;
  status: AiAgentDelegation["status"];
  createdAt: string;
  completedAt: string | null;
}

export interface AgentMemoryView {
  id: string;
  agentName: string;
  memoryType: AiAgentMemory["memoryType"];
  memoryKey: string | null;
  contentPreview: string;
  createdAt: string;
}

export type AgentDashboardView = AgentDashboardMetrics;

export function serializeAgent(
  agent: AiAgent & { currentVersion?: AiAgentVersion | null },
): AgentView {
  return {
    id: agent.id,
    agentId: agent.agentId,
    name: agent.name,
    description: agent.description,
    avatar: agent.avatar,
    department: agent.department,
    role: agent.role,
    status: agent.status,
    branchId: agent.branchId,
    isTemplate: agent.isTemplate,
    versionNumber: agent.currentVersion?.versionNumber ?? null,
    createdAt: agent.createdAt.toISOString(),
  };
}

export function serializeAgentExecution(
  execution: AiAgentExecution & { agent: AiAgent },
): AgentExecutionView {
  return {
    id: execution.id,
    agentName: execution.agent.name,
    status: execution.status,
    triggerType: execution.triggerType,
    tokensUsed: execution.tokensUsed,
    costCents: execution.costCents,
    knowledgeHits: execution.knowledgeHits,
    toolCalls: execution.toolCalls,
    durationMs: execution.durationMs,
    errorDetails: execution.errorDetails,
    createdAt: execution.createdAt.toISOString(),
  };
}

export function serializeAgentDelegation(
  delegation: AiAgentDelegation & { fromAgent: AiAgent; toAgent: AiAgent },
): AgentDelegationView {
  return {
    id: delegation.id,
    fromAgentName: delegation.fromAgent.name,
    toAgentName: delegation.toAgent.name,
    taskSummary: delegation.taskSummary,
    status: delegation.status,
    createdAt: delegation.createdAt.toISOString(),
    completedAt: delegation.completedAt?.toISOString() ?? null,
  };
}

export function serializeAgentMemory(memory: AiAgentMemory & { agent: AiAgent }): AgentMemoryView {
  const preview = JSON.stringify(memory.content).slice(0, 120);

  return {
    id: memory.id,
    agentName: memory.agent.name,
    memoryType: memory.memoryType,
    memoryKey: memory.memoryKey,
    contentPreview: preview,
    createdAt: memory.createdAt.toISOString(),
  };
}

export function serializeAgentDashboard(metrics: AgentDashboardMetrics): AgentDashboardView {
  return metrics;
}

export function serializeAgentSchedule(schedule: AiAgentSchedule & { agent: AiAgent }) {
  return {
    id: schedule.id,
    agentName: schedule.agent.name,
    scheduleType: schedule.scheduleType,
    isActive: schedule.isActive,
    eventType: schedule.eventType,
    lastRunAt: schedule.lastRunAt?.toISOString() ?? null,
    nextRunAt: schedule.nextRunAt?.toISOString() ?? null,
  };
}

export function serializeAgentSkill(skill: {
  skillId: string;
  name: string;
  description: string;
  department: string;
  allowedTools: string[];
  allowedWorkflows: string[];
}) {
  return skill;
}
