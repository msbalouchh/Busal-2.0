import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  serializeSkill,
  slugifySkill,
  validateSkillInput,
  validateSkillListQuery,
  validateSkillUpdateInput,
} from "@/modules/ai-skills-management/lib/ai-skills-validation";
import type {
  SkillDashboardStats,
  SkillInput,
  SkillListQuery,
  SkillListResult,
  SkillRecord,
  SkillUpdateInput,
} from "@/modules/ai-skills-management/types/ai-skills-types";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";

async function getOwnedBusinessId(ownerId: string): Promise<string> {
  const business = await getOrCreateBusinessForOwner(ownerId);
  return business.id;
}

async function logSkillAudit(
  businessId: string,
  staffId: string | null,
  entityId: string,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.aiAgentAuditLog.create({
    data: {
      businessId,
      staffId,
      entityType: "ai_skill",
      entityId,
      action,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

function buildSkillWhere(businessId: string, query: SkillListQuery): Prisma.AISkillWhereInput {
  return {
    businessId,
    ...(query.status && query.status !== "ALL" ? { status: query.status } : {}),
    ...(query.category && query.category !== "ALL" ? { category: query.category } : {}),
    ...(query.search?.trim()
      ? {
          OR: [
            { name: { contains: query.search.trim(), mode: "insensitive" } },
            { slug: { contains: query.search.trim(), mode: "insensitive" } },
            { description: { contains: query.search.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function listSkills(
  ownerId: string,
  query: SkillListQuery = {},
): Promise<SkillListResult> {
  const validated = validateSkillListQuery(query);
  const businessId = await getOwnedBusinessId(ownerId);
  const where = buildSkillWhere(businessId, validated);
  const page = validated.page ?? 1;
  const pageSize = validated.pageSize ?? 20;

  const [total, items] = await Promise.all([
    prisma.aISkill.count({ where }),
    prisma.aISkill.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { executions: true } } },
    }),
  ]);

  return {
    items: items.map(serializeSkill),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getSkill(ownerId: string, skillId: string): Promise<SkillRecord> {
  const businessId = await getOwnedBusinessId(ownerId);
  const skill = await prisma.aISkill.findFirst({
    where: { id: skillId, businessId },
    include: { _count: { select: { executions: true } } },
  });
  if (!skill) throw new Error("Skill not found");
  return serializeSkill(skill);
}

export async function getSkillBySlug(ownerId: string, slug: string): Promise<SkillRecord | null> {
  const businessId = await getOwnedBusinessId(ownerId);
  const skill = await prisma.aISkill.findFirst({
    where: { businessId, slug },
    include: { _count: { select: { executions: true } } },
  });
  return skill ? serializeSkill(skill) : null;
}

export async function registerSkill(
  ownerId: string,
  input: SkillInput,
  staffId?: string | null,
): Promise<SkillRecord> {
  validateSkillInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const slug = input.slug?.trim() || slugifySkill(input.name);

  const skill = await prisma.aISkill.create({
    data: {
      businessId,
      categoryId: input.categoryId ?? null,
      name: input.name.trim(),
      slug,
      category: input.category,
      description: input.description?.trim() || null,
      version: input.version ?? "1.0.0",
      status: input.status ?? "DRAFT",
      configuration: (input.configuration ?? {}) as Prisma.InputJsonValue,
      inputSchema: (input.inputSchema ?? {}) as Prisma.InputJsonValue,
      outputSchema: (input.outputSchema ?? {}) as Prisma.InputJsonValue,
    },
    include: { _count: { select: { executions: true } } },
  });

  await logSkillAudit(businessId, staffId ?? null, skill.id, "skill.register");
  return serializeSkill(skill);
}

export async function updateSkill(
  ownerId: string,
  skillId: string,
  input: SkillUpdateInput,
  staffId?: string | null,
): Promise<SkillRecord> {
  validateSkillUpdateInput(input);
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aISkill.findFirst({ where: { id: skillId, businessId } });
  if (!existing) throw new Error("Skill not found");

  const skill = await prisma.aISkill.update({
    where: { id: skillId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.version !== undefined ? { version: input.version } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.configuration !== undefined
        ? { configuration: input.configuration as Prisma.InputJsonValue }
        : {}),
      ...(input.inputSchema !== undefined
        ? { inputSchema: input.inputSchema as Prisma.InputJsonValue }
        : {}),
      ...(input.outputSchema !== undefined
        ? { outputSchema: input.outputSchema as Prisma.InputJsonValue }
        : {}),
    },
    include: { _count: { select: { executions: true } } },
  });

  await logSkillAudit(businessId, staffId ?? null, skillId, "skill.update");
  return serializeSkill(skill);
}

export async function deleteSkill(
  ownerId: string,
  skillId: string,
  staffId?: string | null,
): Promise<void> {
  const businessId = await getOwnedBusinessId(ownerId);
  const existing = await prisma.aISkill.findFirst({ where: { id: skillId, businessId } });
  if (!existing) throw new Error("Skill not found");

  await prisma.aISkill.delete({ where: { id: skillId } });
  await logSkillAudit(businessId, staffId ?? null, skillId, "skill.delete");
}

export async function enableSkill(
  ownerId: string,
  skillId: string,
  staffId?: string | null,
): Promise<SkillRecord> {
  return updateSkill(ownerId, skillId, { status: "ACTIVE" }, staffId);
}

export async function disableSkill(
  ownerId: string,
  skillId: string,
  staffId?: string | null,
): Promise<SkillRecord> {
  return updateSkill(ownerId, skillId, { status: "DISABLED" }, staffId);
}

export async function versionSkill(
  ownerId: string,
  skillId: string,
  version: string,
  staffId?: string | null,
): Promise<SkillRecord> {
  if (!version.trim()) throw new Error("Version is required");
  return updateSkill(ownerId, skillId, { version: version.trim() }, staffId);
}

export async function getSkillDashboardStats(ownerId: string): Promise<SkillDashboardStats> {
  const businessId = await getOwnedBusinessId(ownerId);

  const [
    totalSkills,
    activeSkills,
    draftSkills,
    disabledSkills,
    totalExecutions,
    failedExecutions,
    categories,
  ] = await Promise.all([
    prisma.aISkill.count({ where: { businessId } }),
    prisma.aISkill.count({ where: { businessId, status: "ACTIVE" } }),
    prisma.aISkill.count({ where: { businessId, status: "DRAFT" } }),
    prisma.aISkill.count({ where: { businessId, status: "DISABLED" } }),
    prisma.aISkillExecution.count({ where: { businessId } }),
    prisma.aISkillExecution.count({ where: { businessId, status: "FAILED" } }),
    prisma.aISkillCategory.count(),
  ]);

  return {
    totalSkills,
    activeSkills,
    draftSkills,
    disabledSkills,
    totalExecutions,
    failedExecutions,
    categories,
  };
}

export async function listSkillCategories(ownerId: string) {
  const businessId = await getOwnedBusinessId(ownerId);
  const categories = await prisma.aISkillCategory.findMany({ orderBy: { name: "asc" } });
  const counts = await Promise.all(
    categories.map((category) =>
      prisma.aISkill.count({ where: { businessId, categoryId: category.id } }),
    ),
  );

  const { serializeSkillCategory } =
    await import("@/modules/ai-skills-management/lib/ai-skills-validation");
  return categories.map((category, index) => serializeSkillCategory(category, counts[index] ?? 0));
}

export async function searchSkills(ownerId: string, query: SkillListQuery = {}) {
  return listSkills(ownerId, query);
}
