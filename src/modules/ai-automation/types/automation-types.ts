import type {
  AutomationActionType,
  AutomationEventCategory,
  AutomationNodeType,
  AutomationTriggerType,
} from "@prisma/client";

export interface AutomationEventDefinition {
  eventType: string;
  category: AutomationEventCategory;
  description: string;
  sourceModule: string;
}

export interface AutomationActionDefinition {
  actionType: AutomationActionType;
  label: string;
  description: string;
  requiredPermissions: string[];
}

export interface AutomationTriggerDefinition {
  triggerType: AutomationTriggerType;
  label: string;
  description: string;
}

export interface WorkflowNode {
  id: string;
  type: AutomationNodeType;
  label: string;
  config: Record<string, unknown>;
  nextNodeId?: string | null;
}

export interface ConditionExpression {
  operator: "AND" | "OR" | "NOT" | "EQ" | "NEQ" | "GT" | "GTE" | "LT" | "LTE" | "IN" | "CONTAINS";
  field?: string;
  value?: unknown;
  children?: ConditionExpression[];
  ruleType?: "business" | "date" | "branch" | "role" | "value" | "custom";
}

export interface WorkflowExecutionContext {
  businessId: string;
  branchId: string | null;
  userId: string | null;
  staffId: string | null;
  permissions: string[];
  roleSlug: string | null;
  eventPayload: Record<string, unknown>;
  variables: Record<string, unknown>;
}

export interface AiDecisionResult {
  decision: string;
  confidenceScore: number;
  reasoning: string;
  structuredOutput: Record<string, unknown>;
}

export interface WorkflowExecutionResult {
  executionId: string;
  status: string;
  output: Record<string, unknown> | null;
  awaitingApproval: boolean;
  approvalRequestId: string | null;
}
