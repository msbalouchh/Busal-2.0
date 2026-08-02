import type { WorkflowExecutionStatus, WorkflowStatus } from "@prisma/client";

export interface WorkflowRecord {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  version: string;
  configuration: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  stepCount: number;
  executionCount: number;
}

export interface WorkflowStepRecord {
  id: string;
  workflowId: string;
  order: number;
  agentId: string | null;
  skillId: string | null;
  condition: string | null;
  configuration: Record<string, unknown>;
  createdAt: string;
}

export interface WorkflowExecutionRecord {
  id: string;
  workflowId: string;
  businessId: string;
  staffId: string | null;
  status: WorkflowExecutionStatus;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  metadata: Record<string, unknown>;
  error: string | null;
  createdAt: string;
  workflowName?: string;
}

export interface WorkflowInput {
  name: string;
  description?: string | null;
  status?: WorkflowStatus;
  version?: string;
  configuration?: Record<string, unknown>;
  steps?: WorkflowStepInput[];
}

export interface WorkflowStepInput {
  order: number;
  agentId?: string | null;
  skillId?: string | null;
  condition?: string | null;
  configuration?: Record<string, unknown>;
}

export interface WorkflowUpdateInput {
  name?: string;
  description?: string | null;
  status?: WorkflowStatus;
  version?: string;
  configuration?: Record<string, unknown>;
}

export interface WorkflowListQuery {
  search?: string;
  status?: WorkflowStatus | "ALL";
  page?: number;
  pageSize?: number;
}

export interface WorkflowListResult {
  items: WorkflowRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WorkflowExecutionInput {
  workflowId: string;
  input?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface WorkflowDashboardStats {
  totalWorkflows: number;
  activeWorkflows: number;
  draftWorkflows: number;
  totalExecutions: number;
  runningExecutions: number;
  failedExecutions: number;
}

export interface WorkflowTemplate {
  key: string;
  name: string;
  description: string;
  steps: Array<{ label: string; skillSlug?: string; condition?: string | null }>;
}

export interface WorkflowTimelineEntry {
  id: string;
  workflowName: string;
  status: WorkflowExecutionStatus;
  createdAt: string;
  duration: number | null;
}

export interface OrchestratorContextState {
  shared: Record<string, unknown>;
  stepResults: Array<Record<string, unknown>>;
}
