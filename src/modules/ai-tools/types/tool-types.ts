import type { AiToolCategory, AiToolRiskLevel } from "@prisma/client";

import type { BusinessContext } from "@/modules/business-context/types/business-context";

export interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: readonly string[];
  items?: JsonSchema;
  enum?: readonly string[];
}

export interface ToolDefinition {
  toolId: string;
  name: string;
  description: string;
  module: string;
  category: AiToolCategory;
  version?: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  requiredPermissions?: string[];
  supportedIndustries?: string[];
  riskLevel?: AiToolRiskLevel;
  dryRunSupported?: boolean;
  confirmationRequired?: boolean;
  readOnly?: boolean;
  rollbackCapable?: boolean;
}

export interface SelectedRecordRef {
  type: string;
  id: string;
}

export interface ToolContext {
  business: BusinessContext["business"];
  branch: BusinessContext["branch"];
  branchId: string | null;
  user: BusinessContext["user"];
  roleSlug: string | null;
  permissions: string[];
  currentModule: string | null;
  selectedRecord: SelectedRecordRef | null;
  locale: string;
  timezone: string;
}

export type ToolHandler = (
  context: ToolContext,
  input: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

export interface RetryPolicy {
  maxRetries: number;
  timeoutMs: number;
  backoffMs: number;
}

export interface ExecuteToolRequest {
  toolId: string;
  input: Record<string, unknown>;
  agentId?: string | null;
  dryRun?: boolean;
  confirmed?: boolean;
  selectedRecord?: SelectedRecordRef | null;
  currentModule?: string | null;
  modelUsed?: string | null;
  tokensUsed?: number | null;
  retryPolicy?: Partial<RetryPolicy>;
}

export interface ToolExecutionResult {
  executionId: string;
  toolId: string;
  status: string;
  output: Record<string, unknown> | null;
  requiresConfirmation: boolean;
  dryRun: boolean;
  executionTimeMs: number | null;
  errorDetails: string | null;
}

export interface DiscoveredTool {
  toolId: string;
  name: string;
  description: string;
  module: string;
  category: AiToolCategory;
  version: string;
  riskLevel: AiToolRiskLevel;
  readOnly: boolean;
  confirmationRequired: boolean;
  dryRunSupported: boolean;
}
