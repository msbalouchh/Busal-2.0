import type { AiAgentMemoryType, AiAgentScheduleType, AiAgentStatus } from "@prisma/client";

export interface AgentSkillDefinition {
  skillId: string;
  name: string;
  description: string;
  department: string;
  allowedTools: string[];
  allowedWorkflows: string[];
}

export interface AgentTemplateDefinition {
  templateId: string;
  name: string;
  description: string;
  department: string;
  role: string;
  personality: string;
  goals: string[];
  responsibilities: string[];
  behaviourRules: string[];
  skills: string[];
  allowedTools: string[];
  scheduleType: AiAgentScheduleType;
}

export interface AgentProfileInput {
  personality?: string | null;
  goals?: string[];
  responsibilities?: string[];
  behaviourRules?: string[];
  allowedTools?: string[];
  allowedKnowledgeCollections?: string[];
  memorySettings?: Record<string, unknown> | null;
  modelConfig?: Record<string, unknown> | null;
  temperature?: number;
  tokenLimit?: number;
}

export interface AgentExecutionContext {
  businessId: string;
  branchId: string | null;
  userId: string | null;
  staffId: string | null;
  permissions: string[];
  roleSlug: string;
  input: Record<string, unknown>;
  variables: Record<string, unknown>;
}

export interface AgentExecutionResult {
  response: string;
  structuredOutput: Record<string, unknown>;
  tokensUsed: number;
  costCents: number;
  knowledgeHits: number;
  toolCalls: number;
  automationRuns: number;
}

export interface AgentDelegationRequest {
  fromAgentRecordId: string;
  toAgentRecordId: string;
  taskSummary: string;
  parentExecutionId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AgentMemoryEntry {
  memoryType: AiAgentMemoryType;
  memoryKey?: string | null;
  content: Record<string, unknown>;
  expiresAt?: Date | null;
}

export interface AgentDashboardMetrics {
  totalAgents: number;
  publishedAgents: number;
  pausedAgents: number;
  healthScore: number;
  totalExecutions: number;
  successRate: number;
  averageResponseTimeMs: number;
  totalCostCents: number;
  knowledgeUsage: number;
  automationUsage: number;
  toolUsage: number;
  errors: number;
}

export interface AgentExportPayload {
  templateId: string;
  name: string;
  description: string | null;
  department: string | null;
  role: string | null;
  avatar: string | null;
  profile: AgentProfileInput;
  skills: string[];
  scheduleType: AiAgentScheduleType;
  status: AiAgentStatus;
}
