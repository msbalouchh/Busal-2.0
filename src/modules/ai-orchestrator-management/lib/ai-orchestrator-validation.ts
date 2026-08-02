import type { Prisma, WorkflowExecutionStatus, WorkflowStatus } from "@prisma/client";

import type {
  WorkflowExecutionRecord,
  WorkflowInput,
  WorkflowListQuery,
  WorkflowRecord,
  WorkflowStepInput,
  WorkflowStepRecord,
  WorkflowTemplate,
  WorkflowUpdateInput,
} from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

export function serializeWorkflow(workflow: {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  version: string;
  configuration: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  _count?: { steps: number; executions: number };
}): WorkflowRecord {
  return {
    id: workflow.id,
    businessId: workflow.businessId,
    name: workflow.name,
    description: workflow.description,
    status: workflow.status,
    version: workflow.version,
    configuration: jsonToRecord(workflow.configuration),
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
    stepCount: workflow._count?.steps ?? 0,
    executionCount: workflow._count?.executions ?? 0,
  };
}

export function serializeWorkflowStep(step: {
  id: string;
  workflowId: string;
  order: number;
  agentId: string | null;
  skillId: string | null;
  condition: string | null;
  configuration: Prisma.JsonValue;
  createdAt: Date;
}): WorkflowStepRecord {
  return {
    id: step.id,
    workflowId: step.workflowId,
    order: step.order,
    agentId: step.agentId,
    skillId: step.skillId,
    condition: step.condition,
    configuration: jsonToRecord(step.configuration),
    createdAt: step.createdAt.toISOString(),
  };
}

export function serializeWorkflowExecution(execution: {
  id: string;
  workflowId: string;
  businessId: string;
  staffId: string | null;
  status: WorkflowExecutionStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  duration: number | null;
  input: Prisma.JsonValue;
  output: Prisma.JsonValue;
  metadata: Prisma.JsonValue;
  error: string | null;
  createdAt: Date;
  workflow?: { name: string };
}): WorkflowExecutionRecord {
  return {
    id: execution.id,
    workflowId: execution.workflowId,
    businessId: execution.businessId,
    staffId: execution.staffId,
    status: execution.status,
    startedAt: execution.startedAt?.toISOString() ?? null,
    completedAt: execution.completedAt?.toISOString() ?? null,
    duration: execution.duration,
    input: jsonToRecord(execution.input),
    output: jsonToRecord(execution.output),
    metadata: jsonToRecord(execution.metadata),
    error: execution.error,
    createdAt: execution.createdAt.toISOString(),
    workflowName: execution.workflow?.name,
  };
}

function jsonToRecord(value: Prisma.JsonValue): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function validateWorkflowInput(input: WorkflowInput): void {
  if (!input.name?.trim()) throw new Error("Workflow name is required");
}

export function validateWorkflowUpdateInput(input: WorkflowUpdateInput): void {
  if (input.name !== undefined && !input.name.trim()) {
    throw new Error("Workflow name cannot be empty");
  }
}

export function validateWorkflowListQuery(query: WorkflowListQuery = {}): WorkflowListQuery {
  return {
    ...query,
    page: Math.max(1, query.page ?? 1),
    pageSize: Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE)),
  };
}

export function validateWorkflowSteps(steps: WorkflowStepInput[]): void {
  if (steps.length === 0) throw new Error("At least one workflow step is required");
  const orders = steps.map((step) => step.order);
  if (new Set(orders).size !== orders.length) {
    throw new Error("Workflow step order values must be unique");
  }
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    key: "restaurant-summary",
    name: "Restaurant Summary",
    description: "Collect sales, inventory, and reservations then generate a summary.",
    steps: [
      { label: "Collect Sales", skillSlug: "analyze-sales" },
      { label: "Collect Inventory", skillSlug: "analyze-inventory" },
      { label: "Collect Reservations", skillSlug: "analyze-reservations" },
      { label: "Generate Summary", skillSlug: "summarize-business" },
      { label: "Return Result", skillSlug: "generate-insight" },
    ],
  },
  {
    key: "customer-analysis",
    name: "Customer Analysis",
    description: "Retrieve customer data, analyze orders, and create recommendations.",
    steps: [
      { label: "Retrieve Customer Data", skillSlug: "search-data" },
      { label: "Analyze Orders", skillSlug: "analyze-customers" },
      { label: "Generate Insights", skillSlug: "generate-insight" },
      { label: "Create Recommendation", skillSlug: "create-recommendation" },
    ],
  },
];
