import "server-only";

import { randomUUID } from "crypto";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import { getControlCenterOperatorEmails } from "@/modules/control-center/lib/resolve-control-center-authorization";
import { loadOperatorRegistry } from "@/modules/control-center/operators/repository/control-center-operator.repository";
import type {
  CreatePlatformAutomationInput,
  PlatformAutomationExecutionDetail,
  PlatformAutomationExecutionQuery,
  PlatformAutomationManagementBundle,
  PlatformAutomationManagementQuery,
  PlatformAutomationPermissions,
  UpdatePlatformAutomationInput,
} from "@/modules/control-center/automation/types/control-center-platform-automation-types";
import {
  appendPlatformAutomationExecution,
  clonePlatformAutomationRecord,
  createPlatformAutomationRecord,
  deletePlatformAutomationRecord,
  emergencyStopPlatformAutomations,
  exportPlatformAutomationPayload,
  getPlatformAutomationDetail,
  getPlatformAutomationExecutionDetail,
  getStoredPlatformAutomationRecord,
  loadPlatformAutomationOverview,
  logPlatformAutomationAudit,
  queryPlatformAutomationAuditTrail,
  queryPlatformAutomationExecutions,
  queryPlatformAutomations,
  loadPlatformAutomationFilterOptions,
  setPlatformAutomationStatus,
  updatePlatformAutomationExecution,
  updatePlatformAutomationRecord,
  type StoredPlatformAutomationExecutionRecord,
  type StoredPlatformAutomationRecord,
} from "@/modules/control-center/automation/repository/platform-automation.repository";
import {
  moduleScopeFromPlatform,
  publishModuleDomainEvent,
} from "@/modules/platform-orchestration/lib/publish-module-event";
import { prisma } from "@/lib/prisma";
import { runCentralAiInsightForOwner } from "@/services/ai-engine-bridge.service";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";

async function resolveIsPlatformOwner(actor: ControlCenterOperatorContext): Promise<boolean> {
  const registry = await loadOperatorRegistry();
  const record = registry.find((entry) => entry.userId === actor.userId);
  if (record?.role === "PLATFORM_OWNER") return true;

  if (registry.some((entry) => entry.role === "PLATFORM_OWNER")) {
    return false;
  }

  return getControlCenterOperatorEmails().includes(actor.email.trim().toLowerCase());
}

function buildPermissions(
  operator: ControlCenterOperatorContext,
  isPlatformOwner: boolean,
): PlatformAutomationPermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);
  const canView =
    hasAdmin ||
    hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_AUTOMATION) ||
    hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_VIEW);

  return {
    canView,
    canCreate: isPlatformOwner,
    canEdit: isPlatformOwner,
    canDelete: isPlatformOwner,
    canExecute: isPlatformOwner || hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_AUTOMATION_EXECUTE),
    canExport: canView,
    canEmergencyStop: isPlatformOwner,
    isPlatformOwner,
  };
}

function assertCanEdit(permissions: PlatformAutomationPermissions): void {
  if (!permissions.canEdit) {
    throw new Error("Only the Platform Owner may modify platform automations");
  }
}

function assertCanExecute(permissions: PlatformAutomationPermissions): void {
  if (!permissions.canExecute) {
    throw new Error("Permission denied — cannot execute platform automations");
  }
}

async function resolvePlatformScopeBusinessId(): Promise<string | null> {
  const business = await prisma.business.findFirst({
    where: { onboardingCompleted: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return business?.id ?? null;
}

async function executeAutomationAction(
  action: StoredPlatformAutomationRecord["actions"][number],
  context: {
    automation: StoredPlatformAutomationRecord;
    executionId: string;
    actorId: string;
    businessId: string | null;
  },
  log: (message: string, metadata?: Record<string, unknown>) => void,
): Promise<Record<string, unknown>> {
  const config = action.configuration ?? {};

  switch (action.type) {
    case "publish_orchestration_event": {
      const scopeBusinessId = context.businessId ?? (await resolvePlatformScopeBusinessId());
      if (!scopeBusinessId) {
        throw new Error("No business scope available for orchestration event");
      }

      const eventType =
        (config.eventType as string) ?? "platform.automation.action.executed";

      await publishModuleDomainEvent(moduleScopeFromPlatform({ businessId: scopeBusinessId, userId: context.actorId }), {
        eventType,
        aggregateId: context.automation.id,
        payload: {
          automationId: context.automation.id,
          automationName: context.automation.name,
          executionId: context.executionId,
          actionType: action.type,
          ...(config.payload as Record<string, unknown> | undefined),
        },
        metadata: { source: "platform-automation-center" },
      });

      log("Published orchestration domain event", { eventType });
      return { eventType, published: true };
    }

    case "generate_ai_report":
    case "run_ai_analysis": {
      const ownerId = context.automation.ownerId ?? context.actorId;
      const prompt =
        (config.prompt as string) ??
        `Analyze platform automation context for "${context.automation.name}" and produce an executive summary with risks and recommended actions.`;

      const insight = await runCentralAiInsightForOwner(ownerId, {
        currentModule: "platform-automation",
        prompt,
        contextData: {
          automationId: context.automation.id,
          automationName: context.automation.name,
          category: context.automation.category,
          trigger: context.automation.trigger.type,
          businessId: context.businessId,
          insightType: action.type === "generate_ai_report" ? "executive_report" : "operational_analysis",
        },
        responseFormat: "text",
      });

      log("Completed AI analysis via centralized engine", { insightType: action.type });
      return {
        auditId: insight.auditId,
        summary: insight.content.slice(0, 500),
        tokensUsed: insight.totalTokens,
      };
    }

    case "send_notification":
    case "platform_announcement": {
      const scopeBusinessId = context.businessId ?? (await resolvePlatformScopeBusinessId());
      if (scopeBusinessId) {
        await publishModuleDomainEvent(moduleScopeFromPlatform({ businessId: scopeBusinessId, userId: context.actorId }), {
          eventType: "platform.notification.requested",
          aggregateId: context.executionId,
          payload: {
            title: (config.title as string) ?? context.automation.name,
            body: (config.body as string) ?? context.automation.description,
            channel: (config.channel as string) ?? "platform",
            audience: (config.audience as string) ?? "operators",
          },
        });
      }
      log("Queued platform notification", { actionType: action.type });
      return { queued: true };
    }

    case "create_incident": {
      const scopeBusinessId = context.businessId ?? (await resolvePlatformScopeBusinessId());
      if (!scopeBusinessId) {
        throw new Error("No business scope available to create incident");
      }

      const incident = await prisma.platformIncident.create({
        data: {
          businessId: scopeBusinessId,
          title: (config.title as string) ?? `Automation: ${context.automation.name}`,
          description: (config.description as string) ?? context.automation.description,
          severity: (config.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
          metadata: {
            automationId: context.automation.id,
            executionId: context.executionId,
            source: "platform-automation-center",
          },
        },
      });

      log("Created platform incident", { incidentId: incident.id });
      return { incidentId: incident.id };
    }

    case "create_support_ticket":
    case "create_task":
    case "send_email":
    case "webhook":
    case "pause_feature":
    case "enable_feature":
    case "suspend_business":
    case "activate_business":
    case "assign_operator": {
      const scopeBusinessId = context.businessId ?? (await resolvePlatformScopeBusinessId());
      if (scopeBusinessId) {
        await publishModuleDomainEvent(moduleScopeFromPlatform({ businessId: scopeBusinessId, userId: context.actorId }), {
          eventType: `platform.automation.${action.type}`,
          aggregateId: context.executionId,
          payload: {
            automationId: context.automation.id,
            actionType: action.type,
            configuration: config,
          },
        });
      }
      log(`Dispatched ${action.type} via orchestration`, { actionType: action.type });
      return { dispatched: true, actionType: action.type };
    }

    default: {
      log(`Executed action ${action.type}`, { actionType: action.type });
      return { executed: true, actionType: action.type };
    }
  }
}

async function runPlatformAutomationExecution(
  operator: ControlCenterOperatorContext,
  automation: StoredPlatformAutomationRecord,
  input: Record<string, unknown> = {},
): Promise<PlatformAutomationExecutionDetail> {
  const executionId = randomUUID();
  const startedAt = new Date();
  const logs: StoredPlatformAutomationExecutionRecord["logs"] = [];

  const appendLog = (message: string, metadata?: Record<string, unknown>) => {
    logs.push({
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      metadata,
    });
  };

  const executionBase: StoredPlatformAutomationExecutionRecord = {
    id: executionId,
    automationId: automation.id,
    automationName: automation.name,
    status: "running",
    triggerType: automation.trigger.type,
    startedAt: startedAt.toISOString(),
    completedAt: null,
    durationMs: null,
    input,
    output: {},
    error: null,
    logs,
    triggeredById: operator.userId,
    triggeredByEmail: operator.email,
    businessId: automation.businessId,
    businessName: automation.businessName,
  };

  await appendPlatformAutomationExecution(executionBase);
  await logPlatformAutomationAudit({
    automationId: automation.id,
    automationName: automation.name,
    executionId,
    eventType: "execution.started",
    actorId: operator.userId,
    actorEmail: operator.email,
    message: `Started execution for "${automation.name}"`,
  });

  try {
    appendLog("Evaluating automation conditions");

    const actionOutputs: Record<string, unknown>[] = [];
    const sortedActions = [...automation.actions].sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      appendLog(`Running action: ${action.type}`, { order: action.order });
      const output = await executeAutomationAction(
        action,
        {
          automation,
          executionId,
          actorId: operator.userId,
          businessId: automation.businessId,
        },
        appendLog,
      );
      actionOutputs.push(output);
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const output = { actions: actionOutputs, completedActions: actionOutputs.length };

    await updatePlatformAutomationExecution(executionId, {
      status: "completed",
      completedAt: completedAt.toISOString(),
      durationMs,
      output,
      logs,
    });

    await logPlatformAutomationAudit({
      automationId: automation.id,
      automationName: automation.name,
      executionId,
      eventType: "execution.completed",
      actorId: operator.userId,
      actorEmail: operator.email,
      message: `Completed execution for "${automation.name}" in ${durationMs}ms`,
      metadata: { durationMs, actionCount: sortedActions.length },
    });

    const detail = await getPlatformAutomationExecutionDetail(executionId);
    if (!detail) throw new Error("Execution record missing after completion");
    return detail;
  } catch (error) {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const message = error instanceof Error ? error.message : "Execution failed";

    logs.push({
      timestamp: completedAt.toISOString(),
      level: "error",
      message,
    });

    await updatePlatformAutomationExecution(executionId, {
      status: "failed",
      completedAt: completedAt.toISOString(),
      durationMs,
      error: message,
      logs,
    });

    await logPlatformAutomationAudit({
      automationId: automation.id,
      automationName: automation.name,
      executionId,
      eventType: "execution.failed",
      actorId: operator.userId,
      actorEmail: operator.email,
      message: `Execution failed for "${automation.name}": ${message}`,
    });

    const detail = await getPlatformAutomationExecutionDetail(executionId);
    if (!detail) throw new Error("Execution record missing after failure");
    return detail;
  }
}

export async function getControlCenterPlatformAutomationBundle(
  operator: ControlCenterOperatorContext,
  query: PlatformAutomationManagementQuery = {},
  executionQuery: PlatformAutomationExecutionQuery = {},
): Promise<PlatformAutomationManagementBundle> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const [overview, directory, executions, auditTrail, filterOptions] = await Promise.all([
    loadPlatformAutomationOverview(),
    queryPlatformAutomations(query),
    queryPlatformAutomationExecutions(executionQuery),
    queryPlatformAutomationAuditTrail({ page: 1 }),
    loadPlatformAutomationFilterOptions(),
  ]);

  return {
    overview,
    directory,
    executions,
    auditTrail,
    filterOptions,
    permissions,
    refreshedAt: new Date().toISOString(),
  };
}

export async function getControlCenterPlatformAutomationDetailBundle(
  operator: ControlCenterOperatorContext,
  automationId: string,
) {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const detail = await getPlatformAutomationDetail(automationId);
  if (!detail) {
    throw new Error("Automation not found");
  }

  const [executions, auditTrail] = await Promise.all([
    queryPlatformAutomationExecutions({ automationId, page: 1 }),
    queryPlatformAutomationAuditTrail({ automationId, page: 1 }),
  ]);

  return { detail, executions, auditTrail, permissions };
}

export async function createControlCenterPlatformAutomation(
  operator: ControlCenterOperatorContext,
  input: CreatePlatformAutomationInput,
): Promise<{ id: string }> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);
  assertCanEdit(permissions);

  if (!input.name.trim()) {
    throw new Error("Automation name is required");
  }
  if (input.actions.length === 0) {
    throw new Error("At least one action is required");
  }

  return createPlatformAutomationRecord(operator.userId, operator.email, input);
}

export async function updateControlCenterPlatformAutomation(
  operator: ControlCenterOperatorContext,
  automationId: string,
  input: UpdatePlatformAutomationInput,
): Promise<void> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);
  assertCanEdit(permissions);
  await updatePlatformAutomationRecord(operator.userId, operator.email, automationId, input);
}

export async function cloneControlCenterPlatformAutomation(
  operator: ControlCenterOperatorContext,
  automationId: string,
): Promise<{ id: string }> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);
  assertCanEdit(permissions);
  return clonePlatformAutomationRecord(operator.userId, operator.email, automationId);
}

export async function pauseControlCenterPlatformAutomation(
  operator: ControlCenterOperatorContext,
  automationId: string,
): Promise<void> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);
  assertCanEdit(permissions);
  await setPlatformAutomationStatus(operator.userId, operator.email, automationId, "paused", false);
}

export async function resumeControlCenterPlatformAutomation(
  operator: ControlCenterOperatorContext,
  automationId: string,
): Promise<void> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);
  assertCanEdit(permissions);
  await setPlatformAutomationStatus(operator.userId, operator.email, automationId, "active", true);
}

export async function deleteControlCenterPlatformAutomation(
  operator: ControlCenterOperatorContext,
  automationId: string,
): Promise<void> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);
  if (!permissions.canDelete) {
    throw new Error("Only the Platform Owner may delete automations");
  }
  await deletePlatformAutomationRecord(operator.userId, operator.email, automationId);
}

export async function runControlCenterPlatformAutomation(
  operator: ControlCenterOperatorContext,
  automationId: string,
  input: Record<string, unknown> = {},
): Promise<PlatformAutomationExecutionDetail> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);
  assertCanExecute(permissions);

  const automation = await getStoredPlatformAutomationRecord(automationId);
  if (!automation) {
    throw new Error("Automation not found");
  }

  await logPlatformAutomationAudit({
    automationId,
    automationName: automation.name,
    eventType: "automation.executed",
    actorId: operator.userId,
    actorEmail: operator.email,
    message: `Manual execution requested for "${automation.name}"`,
  });

  return runPlatformAutomationExecution(operator, automation, input);
}

export async function retryControlCenterPlatformAutomationExecution(
  operator: ControlCenterOperatorContext,
  executionId: string,
): Promise<PlatformAutomationExecutionDetail> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);
  assertCanExecute(permissions);

  const previous = await getPlatformAutomationExecutionDetail(executionId);
  if (!previous) {
    throw new Error("Execution not found");
  }

  const automation = await getStoredPlatformAutomationRecord(previous.automationId);
  if (!automation) {
    throw new Error("Automation not found");
  }

  await logPlatformAutomationAudit({
    automationId: automation.id,
    automationName: automation.name,
    executionId,
    eventType: "execution.retried",
    actorId: operator.userId,
    actorEmail: operator.email,
    message: `Retry requested for execution ${executionId}`,
  });

  return runPlatformAutomationExecution(operator, automation, previous.input);
}

export async function emergencyStopControlCenterPlatformAutomations(
  operator: ControlCenterOperatorContext,
): Promise<{ stopped: number }> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canEmergencyStop) {
    throw new Error("Only the Platform Owner may activate emergency stop");
  }

  const stopped = await emergencyStopPlatformAutomations(operator.userId, operator.email);
  return { stopped };
}

export async function exportControlCenterPlatformAutomation(
  operator: ControlCenterOperatorContext,
  format: "json" | "csv",
): Promise<{ filename: string; content: string; mimeType: string }> {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canExport) {
    throw new Error("Permission denied");
  }

  const payload = await exportPlatformAutomationPayload();
  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    return {
      filename: `platform-automation-${timestamp}.json`,
      content: JSON.stringify({ exportedAt: new Date().toISOString(), ...payload }, null, 2),
      mimeType: "application/json",
    };
  }

  const rows = [
    ["id", "name", "category", "status", "priority", "trigger", "enabled", "business", "updatedAt"],
    ...payload.automations.map((entry) => [
      entry.id,
      entry.name,
      entry.category,
      entry.status,
      entry.priority,
      entry.triggerType,
      String(entry.enabled),
      entry.businessName ?? "",
      entry.updatedAt,
    ]),
  ];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

  return {
    filename: `platform-automation-${timestamp}.csv`,
    content: csv,
    mimeType: "text/csv",
  };
}

export async function getControlCenterPlatformAutomationExecutionDetail(
  operator: ControlCenterOperatorContext,
  executionId: string,
) {
  const isPlatformOwner = await resolveIsPlatformOwner(operator);
  const permissions = buildPermissions(operator, isPlatformOwner);

  if (!permissions.canView) {
    throw new Error("Permission denied");
  }

  const detail = await getPlatformAutomationExecutionDetail(executionId);
  if (!detail) {
    throw new Error("Execution not found");
  }

  return { detail, permissions };
}
