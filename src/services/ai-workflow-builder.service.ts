import "server-only";

/** Non-inference service — no parallel AI execution. */

import { WORKFLOW_TEMPLATES } from "@/modules/ai-orchestrator-management/lib/ai-orchestrator-validation";
import type {
  WorkflowInput,
  WorkflowStepInput,
  WorkflowTemplate,
} from "@/modules/ai-orchestrator-management/types/ai-orchestrator-types";
import { createWorkflow, replaceWorkflowSteps } from "@/services/ai-workflow-manager.service";
import { getSkillBySlug } from "@/services/ai-skill-manager.service";

export function getWorkflowTemplates(): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES;
}

export async function buildWorkflowFromTemplate(
  ownerId: string,
  templateKey: string,
): Promise<{ workflowId: string }> {
  const template = WORKFLOW_TEMPLATES.find((entry) => entry.key === templateKey);
  if (!template) throw new Error(`Workflow template not found: ${templateKey}`);

  const steps: WorkflowStepInput[] = [];
  for (const [index, step] of template.steps.entries()) {
    let skillId: string | null = null;
    if (step.skillSlug) {
      const skill = await getSkillBySlug(ownerId, step.skillSlug);
      skillId = skill?.id ?? null;
    }

    steps.push({
      order: index + 1,
      skillId,
      condition: step.condition ?? null,
      configuration: { label: step.label, template: true },
    });
  }

  const workflow = await createWorkflow(ownerId, {
    name: template.name,
    description: template.description,
    status: "DRAFT",
    configuration: { templateKey, mode: "sequential" },
    steps,
  });

  return { workflowId: workflow.id };
}

export async function appendWorkflowStep(
  ownerId: string,
  workflowId: string,
  step: WorkflowStepInput,
) {
  const { listWorkflowSteps } = await import("@/services/ai-workflow-manager.service");
  const existing = await listWorkflowSteps(ownerId, workflowId);
  return replaceWorkflowSteps(
    ownerId,
    workflowId,
    [...existing, step].map((entry, index) => ({
      order: index + 1,
      agentId: entry.agentId,
      skillId: entry.skillId,
      condition: entry.condition,
      configuration: entry.configuration,
    })),
  );
}

export function validateWorkflowDefinition(input: WorkflowInput): string[] {
  const errors: string[] = [];
  if (!input.name?.trim()) errors.push("Workflow name is required");
  if (input.steps && input.steps.length === 0)
    errors.push("Workflow must contain at least one step");
  return errors;
}
