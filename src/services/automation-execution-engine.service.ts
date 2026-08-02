import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { executeActions } from "@/services/automation-action-engine.service";
import { evaluateConditions } from "@/services/automation-condition-engine.service";
import { getOwnedBusinessId } from "@/services/automation-context.service";
import { appendExecutionLog, writeAutomationLog } from "@/services/automation-logger.service";
import { resolveTriggerEvent } from "@/services/automation-trigger-engine.service";
import { getAutomationWorkflow } from "@/services/automation-workflow-manager.service";

export async function executeAutomationWorkflow(
  ownerId: string,
  workflowId: string,
  input: Record<string, unknown> = {},
) {
  const businessId = await getOwnedBusinessId(ownerId);
  const workflow = await getAutomationWorkflow(ownerId, workflowId);
  if (!workflow) throw new Error("Workflow not found");
  if (workflow.status === "ARCHIVED") {
    throw new Error("Workflow is archived");
  }

  const execution = await prisma.automationPlatformExecution.create({
    data: {
      workflowId,
      businessId,
      status: "PENDING",
      input: input as Prisma.InputJsonValue,
    },
  });

  const startedAt = new Date();
  await prisma.automationPlatformExecution.update({
    where: { id: execution.id },
    data: { status: "RUNNING", startedAt },
  });

  await appendExecutionLog(execution.id, "INFO", "Execution started");

  try {
    const trigger = workflow.triggers[0];
    if (trigger) {
      const triggerResult = resolveTriggerEvent(trigger.event, input);
      if (!triggerResult.matched && input.event) {
        throw new Error(`Trigger event mismatch: expected ${trigger.event}`);
      }
    }

    const conditionResult = evaluateConditions(workflow.conditions, input);
    await appendExecutionLog(
      execution.id,
      "INFO",
      `Conditions evaluated: ${conditionResult.passed ? "passed" : "failed"}`,
    );

    if (!conditionResult.passed) {
      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();
      const updated = await prisma.automationPlatformExecution.update({
        where: { id: execution.id },
        data: {
          status: "COMPLETED",
          completedAt,
          duration,
          output: { skipped: true, reason: "Conditions not met" } as Prisma.InputJsonValue,
        },
      });
      return updated;
    }

    const actionResults = await executeActions(
      workflow.actions.map((action) => ({
        type: action.type,
        order: action.order,
        configuration: action.configuration as Record<string, unknown>,
      })),
      { ...input, businessId, ownerId },
    );

    for (const result of actionResults) {
      await appendExecutionLog(execution.id, "INFO", result.message);
    }

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();
    const updated = await prisma.automationPlatformExecution.update({
      where: { id: execution.id },
      data: {
        status: "COMPLETED",
        completedAt,
        duration,
        output: { actions: actionResults } as unknown as Prisma.InputJsonValue,
      },
    });

    await writeAutomationLog(businessId, {
      workflowId,
      executionId: execution.id,
      level: "INFO",
      message: `Workflow executed successfully: ${workflow.name}`,
    });

    return updated;
  } catch (error) {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();
    const message = error instanceof Error ? error.message : "Execution failed";
    await appendExecutionLog(execution.id, "ERROR", message);

    const updated = await prisma.automationPlatformExecution.update({
      where: { id: execution.id },
      data: {
        status: "FAILED",
        completedAt,
        duration,
        error: message,
      },
    });

    await writeAutomationLog(businessId, {
      workflowId,
      executionId: execution.id,
      level: "ERROR",
      message,
    });

    return updated;
  }
}

export async function cancelAutomationExecution(ownerId: string, executionId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const execution = await prisma.automationPlatformExecution.findFirst({
    where: { id: executionId, businessId },
  });
  if (!execution) return null;
  if (execution.status !== "PENDING" && execution.status !== "RUNNING") return execution;

  return prisma.automationPlatformExecution.update({
    where: { id: executionId },
    data: {
      status: "CANCELLED",
      completedAt: new Date(),
    },
  });
}
