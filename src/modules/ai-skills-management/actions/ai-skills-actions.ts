"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AI_SKILLS_ROUTES } from "@/modules/ai-skills-management/constants/routes";
import { requireAiSkillsActionContext } from "@/modules/ai-skills-management/lib/get-ai-skills-context";
import type {
  SkillExecutionInput,
  SkillInput,
  SkillUpdateInput,
} from "@/modules/ai-skills-management/types/ai-skills-types";
import { updateSkillConfiguration } from "@/services/ai-skill-config.service";
import {
  disableSkill,
  enableSkill,
  registerSkill,
  deleteSkill,
  updateSkill,
  versionSkill,
} from "@/services/ai-skill-manager.service";
import {
  executeSkill,
  registerBuiltInSkills,
  registerSkillFromTemplate,
} from "@/services/ai-skill-executor.service";

function revalidateSkillPages(skillId?: string) {
  revalidatePath(AI_SKILLS_ROUTES.dashboard());
  revalidatePath(AI_SKILLS_ROUTES.registry());
  revalidatePath(AI_SKILLS_ROUTES.categories());
  revalidatePath(AI_SKILLS_ROUTES.executions());
  revalidatePath(AI_SKILLS_ROUTES.search());
  revalidatePath(AI_SKILLS_ROUTES.settings());
  if (skillId) revalidatePath(AI_SKILLS_ROUTES.skill(skillId));
}

export async function registerSkillAction(input: SkillInput) {
  const context = await requireAiSkillsActionContext(PERMISSION_CODES.AI_SKILL_CREATE);
  const skill = await registerSkill(context.user.id, input);
  revalidateSkillPages(skill.id);
  return skill;
}

export async function updateSkillAction(skillId: string, input: SkillUpdateInput) {
  const context = await requireAiSkillsActionContext(PERMISSION_CODES.AI_SKILL_UPDATE);
  const skill = await updateSkill(context.user.id, skillId, input);
  revalidateSkillPages(skillId);
  return skill;
}

export async function deleteSkillAction(skillId: string) {
  const context = await requireAiSkillsActionContext(PERMISSION_CODES.AI_SKILL_DELETE);
  await deleteSkill(context.user.id, skillId);
  revalidateSkillPages(skillId);
  return { success: true };
}

export async function enableSkillAction(skillId: string) {
  const context = await requireAiSkillsActionContext(PERMISSION_CODES.AI_SKILL_UPDATE);
  const skill = await enableSkill(context.user.id, skillId);
  revalidateSkillPages(skillId);
  return skill;
}

export async function disableSkillAction(skillId: string) {
  const context = await requireAiSkillsActionContext(PERMISSION_CODES.AI_SKILL_UPDATE);
  const skill = await disableSkill(context.user.id, skillId);
  revalidateSkillPages(skillId);
  return skill;
}

export async function versionSkillAction(skillId: string, version: string) {
  const context = await requireAiSkillsActionContext(PERMISSION_CODES.AI_SKILL_UPDATE);
  const skill = await versionSkill(context.user.id, skillId, version);
  revalidateSkillPages(skillId);
  return skill;
}

export async function executeSkillAction(payload: SkillExecutionInput) {
  const context = await requireAiSkillsActionContext(PERMISSION_CODES.AI_SKILL_EXECUTE);
  const execution = await executeSkill(context.user.id, payload);
  revalidateSkillPages(payload.skillId);
  return execution;
}

export async function registerBuiltInSkillsAction() {
  const context = await requireAiSkillsActionContext(PERMISSION_CODES.AI_SKILL_CREATE);
  const created = await registerBuiltInSkills(context.user.id);
  revalidateSkillPages();
  return { created };
}

export async function registerSkillTemplateAction(slug: string) {
  const context = await requireAiSkillsActionContext(PERMISSION_CODES.AI_SKILL_CREATE);
  const skill = await registerSkillFromTemplate(context.user.id, slug);
  revalidateSkillPages(skill.id);
  return skill;
}

export async function updateSkillConfigurationAction(
  skillId: string,
  configuration: Record<string, unknown>,
) {
  const context = await requireAiSkillsActionContext(PERMISSION_CODES.AI_SKILL_UPDATE);
  const skill = await updateSkillConfiguration(context.user.id, skillId, configuration);
  revalidateSkillPages(skillId);
  return skill;
}
