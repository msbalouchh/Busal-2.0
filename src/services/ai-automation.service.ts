import "server-only";

/** Orchestrates domain AI inference via delegated services. */


import type {
  AutomationEventCategory,
  AutomationExecutionStatus,
  AutomationTriggerType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { persistAutomationEvent } from "@/modules/ai-automation/engine/event-bus";
import { executeWorkflowVersion } from "@/modules/ai-automation/engine/workflow-engine";
import {
  DEFAULT_WORKFLOW_TEMPLATES,
  ensureBootstrapAutomationPlugins,
} from "@/modules/ai-automation/plugins/bootstrap-automation";
import type { WorkflowNode } from "@/modules/ai-automation/types/automation-types";

function assertPermission(platform: BusinessContext, permission: string): void {
  if (!platform.permissions.includes(permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

async function logAutomationAudit(
  businessId: string,
  staffId: string | null,
  entityType: string,
  entityId: string,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.automationAuditLog.create({
    data: {
      businessId,
      staffId,
      entityType,
      entityId,
      action,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

function defaultNodesForTemplate(eventType: string, includeApproval: boolean): WorkflowNode[] {
  const nodes: WorkflowNode[] = [
    {
      id: "trigger-1",
      type: "TRIGGER",
      label: "Event Trigger",
      config: { eventType },
    },
    {
      id: "condition-1",
      type: "CONDITION",
      label: "Validate Event",
      config: {
        expression: {
          operator: "AND",
          children: [{ operator: "EQ", field: "eventType", value: eventType }],
        },
      },
    },
    {
      id: "ai-1",
      type: "AI_DECISION",
      label: "AI Decision",
      config: {
        prompt: `Analyse ${eventType} and recommend next steps`,
        useTools: true,
        defaultDecision: "proceed",
      },
    },
  ];

  if (includeApproval) {
    nodes.push({
      id: "approval-1",
      type: "APPROVAL",
      label: "Manager Approval",
      config: { approvalType: "MANAGER" },
    });
  }

  nodes.push(
    {
      id: "action-1",
      type: "ACTION",
      label: "Notify Staff",
      config: { actionType: "NOTIFY_STAFF", message: `Automation triggered for ${eventType}` },
    },
    {
      id: "completion-1",
      type: "COMPLETION",
      label: "Complete",
      config: {},
    },
  );

  return nodes;
}

export async function ensureAutomationTemplates(businessId: string): Promise<void> {
  ensureBootstrapAutomationPlugins();

  for (const template of DEFAULT_WORKFLOW_TEMPLATES) {
    const existing = await prisma.automationWorkflow.findFirst({
      where: { businessId, name: template.name, isTemplate: true },
    });

    if (existing) {
      continue;
    }

    const workflow = await prisma.automationWorkflow.create({
      data: {
        businessId,
        name: template.name,
        description: template.description,
        isTemplate: true,
      },
    });

    const version = await prisma.automationWorkflowVersion.create({
      data: {
        workflowId: workflow.id,
        businessId,
        versionNumber: 1,
        status: "PUBLISHED",
        triggerType: template.triggerType,
        triggerConfig: { eventType: template.eventType },
        nodes: defaultNodesForTemplate(
          template.eventType,
          template.eventType === "InvoiceOverdue",
        ) as unknown as Prisma.InputJsonValue,
        publishedAt: new Date(),
      },
    });

    await prisma.automationWorkflow.update({
      where: { id: workflow.id },
      data: { currentVersionId: version.id },
    });
  }
}

export async function createAutomationWorkflow(
  platform: BusinessContext,
  input: {
    name: string;
    description?: string | null;
    triggerType: AutomationTriggerType;
    triggerConfig: Record<string, unknown>;
    nodes: WorkflowNode[];
    isTemplate?: boolean;
  },
) {
  assertPermission(platform, PERMISSION_CODES.AI_AUTOMATION_CREATE);

  const workflow = await prisma.automationWorkflow.create({
    data: {
      businessId: platform.business.id,
      name: input.name,
      description: input.description ?? null,
      isTemplate: input.isTemplate ?? false,
    },
  });

  const version = await prisma.automationWorkflowVersion.create({
    data: {
      workflowId: workflow.id,
      businessId: platform.business.id,
      versionNumber: 1,
      status: "DRAFT",
      triggerType: input.triggerType,
      triggerConfig: input.triggerConfig as Prisma.InputJsonValue,
      nodes: input.nodes as unknown as Prisma.InputJsonValue,
    },
  });

  await logAutomationAudit(
    platform.business.id,
    platform.staffSession?.staffId ?? null,
    "workflow",
    workflow.id,
    "created",
    { versionId: version.id },
  );

  return { workflow, version };
}

export async function publishAutomationWorkflowVersion(
  platform: BusinessContext,
  workflowId: string,
  versionId: string,
) {
  assertPermission(platform, PERMISSION_CODES.AI_AUTOMATION_EDIT);

  const version = await prisma.automationWorkflowVersion.findFirst({
    where: { id: versionId, workflowId, businessId: platform.business.id },
  });

  if (!version) {
    throw new Error("Workflow version not found");
  }

  const published = await prisma.automationWorkflowVersion.update({
    where: { id: version.id },
    data: { status: "PUBLISHED", publishedAt: new Date(), archivedAt: null },
  });

  await prisma.automationWorkflow.update({
    where: { id: workflowId },
    data: { currentVersionId: published.id },
  });

  await logAutomationAudit(
    platform.business.id,
    platform.staffSession?.staffId ?? null,
    "workflow_version",
    published.id,
    "published",
  );

  return published;
}

export async function archiveAutomationWorkflowVersion(
  platform: BusinessContext,
  versionId: string,
) {
  assertPermission(platform, PERMISSION_CODES.AI_AUTOMATION_DELETE);

  return prisma.automationWorkflowVersion.updateMany({
    where: { id: versionId, businessId: platform.business.id },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
}

export async function listAutomationWorkflows(businessId: string, templatesOnly = false) {
  await ensureAutomationTemplates(businessId);

  return prisma.automationWorkflow.findMany({
    where: { businessId, isTemplate: templatesOnly },
    include: { currentVersion: true },
    orderBy: [{ isTemplate: "desc" }, { name: "asc" }],
  });
}

export async function listAutomationExecutions(businessId: string, limit = 50) {
  return prisma.automationWorkflowExecution.findMany({
    where: { businessId },
    include: {
      workflow: { select: { name: true } },
      steps: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listAutomationApprovalRequests(businessId: string) {
  return prisma.automationApprovalRequest.findMany({
    where: { businessId, status: "AWAITING_APPROVAL" },
    include: {
      execution: {
        include: { workflow: { select: { name: true } } },
      },
    },
    orderBy: { requestedAt: "desc" },
  });
}

export async function listAutomationEvents(businessId: string, limit = 50) {
  return prisma.automationEvent.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getAutomationMonitoringDashboard(businessId: string) {
  const [executions, failures, approvals, events] = await Promise.all([
    prisma.automationWorkflowExecution.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.automationWorkflowExecution.count({
      where: { businessId, status: "FAILED" },
    }),
    prisma.automationApprovalRequest.count({
      where: { businessId, status: "AWAITING_APPROVAL" },
    }),
    prisma.automationEvent.count({ where: { businessId } }),
  ]);

  const completed = executions.filter((execution) => execution.status === "COMPLETED");
  const successRate = executions.length > 0 ? completed.length / executions.length : 0;
  const avgDuration =
    completed.length > 0
      ? completed.reduce((sum, execution) => sum + (execution.durationMs ?? 0), 0) /
        completed.length
      : 0;
  const totalAiTokens = executions.reduce((sum, execution) => sum + execution.aiCostTokens, 0);

  return {
    totalExecutions: executions.length,
    failures,
    pendingApprovals: approvals,
    totalEvents: events,
    successRate,
    averageDurationMs: Math.round(avgDuration),
    totalAiTokens,
    retries: executions.reduce((sum, execution) => sum + execution.retryCount, 0),
    aiDecisions: executions.reduce((sum, execution) => sum + execution.aiDecisionCount, 0),
  };
}

export async function triggerAutomationWorkflowManually(
  platform: BusinessContext,
  workflowId: string,
  input: Record<string, unknown> = {},
) {
  assertPermission(platform, PERMISSION_CODES.AI_AUTOMATION_EXECUTE);

  const workflow = await prisma.automationWorkflow.findFirst({
    where: { id: workflowId, businessId: platform.business.id },
    include: { currentVersion: true },
  });

  if (!workflow?.currentVersion || workflow.currentVersion.status !== "PUBLISHED") {
    throw new Error("Published workflow version not found");
  }

  return executeWorkflowVersion(
    platform,
    {
      workflowId: workflow.id,
      versionId: workflow.currentVersion.id,
      triggerType: "MANUAL",
      nodes: workflow.currentVersion.nodes,
      eventPayload: input,
    },
    buildWorkflowDependencies(),
  );
}

export async function approveAutomationExecution(
  platform: BusinessContext,
  approvalRequestId: string,
  notes?: string | null,
) {
  assertPermission(platform, PERMISSION_CODES.AI_AUTOMATION_APPROVE);

  const approval = await prisma.automationApprovalRequest.findFirst({
    where: { id: approvalRequestId, businessId: platform.business.id },
    include: {
      execution: {
        include: {
          workflow: { include: { currentVersion: true } },
        },
      },
    },
  });

  if (!approval || approval.status !== "AWAITING_APPROVAL") {
    throw new Error("Approval request not found");
  }

  await prisma.automationApprovalRequest.update({
    where: { id: approval.id },
    data: {
      status: "COMPLETED",
      resolvedAt: new Date(),
      resolvedBy: platform.user.id,
      notes: notes ?? null,
    },
  });

  await prisma.automationWorkflowExecution.update({
    where: { id: approval.executionId },
    data: {
      status: "RUNNING",
    },
  });

  const version = approval.execution.workflow.currentVersion;
  if (!version) {
    throw new Error("Workflow version missing after approval");
  }

  const resumed = await executeWorkflowVersion(
    platform,
    {
      workflowId: approval.execution.workflowId,
      versionId: version.id,
      triggerType: approval.execution.triggerType,
      nodes: version.nodes,
      eventPayload: (approval.execution.input as Record<string, unknown> | null) ?? {},
      executionId: approval.executionId,
      startAfterNodeId: approval.nodeId,
    },
    buildWorkflowDependencies(),
  );

  await logAutomationAudit(
    platform.business.id,
    platform.staffSession?.staffId ?? null,
    "approval",
    approval.id,
    "approved",
    { executionId: approval.executionId },
  );

  return resumed;
}

export async function processAutomationEvent(eventId: string, businessId: string): Promise<void> {
  ensureBootstrapAutomationPlugins();

  const event = await prisma.automationEvent.findFirst({
    where: { id: eventId, businessId },
  });

  if (!event) {
    return;
  }

  const workflows = await prisma.automationWorkflow.findMany({
    where: { businessId, isTemplate: false },
    include: { currentVersion: true },
  });

  const platform = await buildSystemPlatformContext(businessId);
  if (!platform) {
    return;
  }

  for (const workflow of workflows) {
    const version = workflow.currentVersion;
    if (!version || version.status !== "PUBLISHED" || version.triggerType !== "SYSTEM_EVENT") {
      continue;
    }

    const triggerConfig = version.triggerConfig as Record<string, unknown>;
    if (triggerConfig.eventType !== event.eventType) {
      continue;
    }

    await executeWorkflowVersion(
      platform,
      {
        workflowId: workflow.id,
        versionId: version.id,
        triggerType: version.triggerType,
        nodes: version.nodes,
        eventId: event.id,
        eventPayload: {
          ...(event.payload as Record<string, unknown>),
          eventType: event.eventType,
          category: event.category,
        },
      },
      buildWorkflowDependencies(),
    );
  }
}

async function buildSystemPlatformContext(businessId: string): Promise<BusinessContext | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true },
  });

  if (!business?.owner) {
    return null;
  }

  const { resolveAuthorizationContext } =
    await import("@/modules/authorization/services/authorization.service");
  const { mapProfileToAuthUser } = await import("@/services/user.service");
  const { getOwnedBusinessById } = await import("@/services/business-profile.service");

  const profile = await getOwnedBusinessById(business.ownerId, businessId);
  if (!profile) {
    return null;
  }

  const user = mapProfileToAuthUser(business.owner.id, business.owner.email, business.owner, {});
  const authorization = await resolveAuthorizationContext(user, profile);

  return {
    user,
    business: profile,
    branch: null,
    branchId: null,
    roleSlug: authorization.roleSlug,
    permissions: Array.from(authorization.permissions),
    authorization,
    staffSession: null,
    isOwner: authorization.isOwner,
    accessibleBusinesses: [],
    accessibleBranches: [],
  };
}

function buildWorkflowDependencies() {
  return {
    createExecution: async (input: {
      businessId: string;
      branchId: string | null;
      workflowId: string;
      versionId: string;
      triggerType: AutomationTriggerType;
      eventId?: string | null;
      input?: Record<string, unknown>;
    }) =>
      prisma.automationWorkflowExecution.create({
        data: {
          businessId: input.businessId,
          branchId: input.branchId,
          workflowId: input.workflowId,
          versionId: input.versionId,
          triggerType: input.triggerType,
          eventId: input.eventId ?? null,
          input: input.input ? (input.input as Prisma.InputJsonValue) : undefined,
          status: "PENDING",
        },
        select: { id: true },
      }),
    updateExecution: async (
      executionId: string,
      input: {
        status: AutomationExecutionStatus;
        output?: Record<string, unknown> | null;
        errorDetails?: string | null;
        durationMs?: number | null;
        aiDecisionCount?: number;
        aiCostTokens?: number;
        startedAt?: Date | null;
        completedAt?: Date | null;
      },
    ) => {
      await prisma.automationWorkflowExecution.update({
        where: { id: executionId },
        data: {
          status: input.status,
          output: input.output ? (input.output as Prisma.InputJsonValue) : undefined,
          errorDetails: input.errorDetails ?? null,
          durationMs: input.durationMs ?? null,
          aiDecisionCount: input.aiDecisionCount,
          aiCostTokens: input.aiCostTokens,
          startedAt: input.startedAt ?? undefined,
          completedAt: input.completedAt ?? undefined,
        },
      });
    },
    createStep: async (input: {
      executionId: string;
      nodeId: string;
      nodeType: WorkflowNode["type"];
      status: AutomationExecutionStatus;
      input?: Record<string, unknown>;
      output?: Record<string, unknown>;
      confidenceScore?: number;
      reasoning?: string;
      errorDetails?: string;
      durationMs?: number;
    }) => {
      await prisma.automationExecutionStep.create({
        data: {
          executionId: input.executionId,
          nodeId: input.nodeId,
          nodeType: input.nodeType,
          status: input.status,
          input: input.input ? (input.input as Prisma.InputJsonValue) : undefined,
          output: input.output ? (input.output as Prisma.InputJsonValue) : undefined,
          confidenceScore: input.confidenceScore ?? null,
          reasoning: input.reasoning ?? null,
          errorDetails: input.errorDetails ?? null,
          durationMs: input.durationMs ?? null,
        },
      });
    },
    createApproval: async (input: {
      executionId: string;
      businessId: string;
      nodeId: string;
      approvalType: "MANAGER" | "FINANCE" | "OWNER" | "CUSTOM";
      approverRole?: string | null;
    }) =>
      prisma.automationApprovalRequest.create({
        data: {
          executionId: input.executionId,
          businessId: input.businessId,
          nodeId: input.nodeId,
          approvalType: input.approvalType,
          approverRole: input.approverRole ?? null,
          status: "AWAITING_APPROVAL",
        },
        select: { id: true },
      }),
  };
}

export async function publishAutomationEvent(input: {
  businessId: string;
  branchId?: string | null;
  category: AutomationEventCategory;
  eventType: string;
  payload: Record<string, unknown>;
  sourceModule: string;
}) {
  ensureBootstrapAutomationPlugins();
  const event = await persistAutomationEvent(input);
  await processAutomationEvent(event.id, input.businessId);
  return event;
}

export { ensureBootstrapAutomationPlugins };
