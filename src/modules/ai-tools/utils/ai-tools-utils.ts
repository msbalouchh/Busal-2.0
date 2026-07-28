import type { AiTool, AiToolExecution } from "@prisma/client";

export interface AiToolView {
  id: string;
  toolId: string;
  name: string;
  description: string;
  module: string;
  category: string;
  version: string;
  status: string;
  riskLevel: string;
  readOnly: boolean;
  confirmationRequired: boolean;
  dryRunSupported: boolean;
  rollbackCapable: boolean;
  requiredPermissions: string[];
  supportedIndustries: string[];
}

export interface AiToolExecutionView {
  id: string;
  toolId: string;
  agentId: string | null;
  status: string;
  dryRun: boolean;
  confirmed: boolean;
  executionTimeMs: number | null;
  tokensUsed: number | null;
  modelUsed: string | null;
  errorDetails: string | null;
  createdAt: string;
}

export interface AiToolsDashboardView {
  totalTools: number;
  activeTools: number;
  disabledTools: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  awaitingConfirmation: number;
}

export function serializeAiTool(tool: AiTool): AiToolView {
  return {
    id: tool.id,
    toolId: tool.toolId,
    name: tool.name,
    description: tool.description,
    module: tool.module,
    category: tool.category,
    version: tool.version,
    status: tool.status,
    riskLevel: tool.riskLevel,
    readOnly: tool.readOnly,
    confirmationRequired: tool.confirmationRequired,
    dryRunSupported: tool.dryRunSupported,
    rollbackCapable: tool.rollbackCapable,
    requiredPermissions: tool.requiredPermissions,
    supportedIndustries: tool.supportedIndustries,
  };
}

export function serializeAiToolExecution(execution: AiToolExecution): AiToolExecutionView {
  return {
    id: execution.id,
    toolId: execution.toolId,
    agentId: execution.agentId,
    status: execution.status,
    dryRun: execution.dryRun,
    confirmed: execution.confirmed,
    executionTimeMs: execution.executionTimeMs,
    tokensUsed: execution.tokensUsed,
    modelUsed: execution.modelUsed,
    errorDetails: execution.errorDetails,
    createdAt: execution.createdAt.toISOString(),
  };
}

export function serializeAiToolsDashboard(input: {
  tools: AiTool[];
  executions: AiToolExecution[];
}): AiToolsDashboardView {
  return {
    totalTools: input.tools.length,
    activeTools: input.tools.filter((tool) => tool.status === "ACTIVE").length,
    disabledTools: input.tools.filter((tool) => tool.status === "DISABLED").length,
    totalExecutions: input.executions.length,
    successfulExecutions: input.executions.filter((execution) => execution.status === "SUCCESS")
      .length,
    failedExecutions: input.executions.filter((execution) => execution.status === "FAILED").length,
    awaitingConfirmation: input.executions.filter(
      (execution) => execution.status === "AWAITING_CONFIRMATION",
    ).length,
  };
}
