import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { serializeSkillExecution } from "@/modules/ai-skills-management/lib/ai-skills-validation";
import type {
  SkillExecutionInput,
  SkillExecutionRecord,
} from "@/modules/ai-skills-management/types/ai-skills-types";
import { loadSkillForExecution } from "@/services/ai-skill-loader.service";
import { getSkillBySlug, registerSkill } from "@/services/ai-skill-manager.service";
import {
  getBuiltInSkillTemplates,
  getSkillTemplateBySlug,
} from "@/services/ai-skill-registry.service";
import {
  assertValidSkillInput,
  assertValidSkillOutput,
} from "@/services/ai-skill-validator.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function runTemplateSkill(
  slug: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return {
    template: true,
    slug,
    message: `Template execution completed for ${slug}`,
    receivedInput: input,
    executedAt: new Date().toISOString(),
  };
}

export async function executeSkill(
  ownerId: string,
  payload: SkillExecutionInput,
  staffId?: string | null,
): Promise<SkillExecutionRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const { skill } = await loadSkillForExecution(ownerId, payload.skillId);
  const input = payload.input ?? {};

  assertValidSkillInput(skill, input);

  const startedAt = new Date();
  const execution = await prisma.aISkillExecution.create({
    data: {
      skillId: skill.id,
      agentId: payload.agentId ?? null,
      businessId,
      staffId: staffId ?? null,
      status: "RUNNING",
      startedAt,
      input: input as Prisma.InputJsonValue,
      metadata: (payload.metadata ?? {}) as Prisma.InputJsonValue,
    },
    include: { skill: { select: { name: true } } },
  });

  try {
    const output = await runTemplateSkill(skill.slug, input);
    assertValidSkillOutput(skill, output);
    const completedAt = new Date();

    const updated = await prisma.aISkillExecution.update({
      where: { id: execution.id },
      data: {
        status: "COMPLETED",
        completedAt,
        duration: completedAt.getTime() - startedAt.getTime(),
        output: output as Prisma.InputJsonValue,
      },
      include: { skill: { select: { name: true } } },
    });

    await prisma.aiAgentAuditLog.create({
      data: {
        businessId,
        staffId,
        entityType: "ai_skill_execution",
        entityId: updated.id,
        action: "skill.execute",
        metadata: { skillId: skill.id, skillSlug: skill.slug } as Prisma.InputJsonValue,
      },
    });

    return serializeSkillExecution(updated);
  } catch (error) {
    const completedAt = new Date();
    const updated = await prisma.aISkillExecution.update({
      where: { id: execution.id },
      data: {
        status: "FAILED",
        completedAt,
        duration: completedAt.getTime() - startedAt.getTime(),
        error: error instanceof Error ? error.message : "Skill execution failed",
      },
      include: { skill: { select: { name: true } } },
    });
    return serializeSkillExecution(updated);
  }
}

export async function listSkillExecutions(
  ownerId: string,
  skillId?: string,
  limit = 50,
): Promise<SkillExecutionRecord[]> {
  const businessId = await getOwnedBusinessId(ownerId);
  const executions = await prisma.aISkillExecution.findMany({
    where: {
      businessId,
      ...(skillId ? { skillId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { skill: { select: { name: true } } },
  });

  return executions.map(serializeSkillExecution);
}

export async function registerBuiltInSkills(ownerId: string): Promise<number> {
  const templates = getBuiltInSkillTemplates();
  let created = 0;

  for (const template of templates) {
    const existing = await getSkillBySlug(ownerId, template.slug);
    if (existing) continue;

    await registerSkill(ownerId, {
      name: template.name,
      slug: template.slug,
      category: template.category,
      description: template.description,
      status: "ACTIVE",
      configuration: template.configuration,
      inputSchema: template.inputSchema,
      outputSchema: template.outputSchema,
    });
    created += 1;
  }

  return created;
}

export async function registerSkillFromTemplate(ownerId: string, slug: string) {
  const template = getSkillTemplateBySlug(slug);
  if (!template) throw new Error(`Skill template not found: ${slug}`);

  const existing = await getSkillBySlug(ownerId, slug);
  if (existing) return existing;

  return registerSkill(ownerId, {
    name: template.name,
    slug: template.slug,
    category: template.category,
    description: template.description,
    status: "DRAFT",
    configuration: template.configuration,
    inputSchema: template.inputSchema,
    outputSchema: template.outputSchema,
  });
}
