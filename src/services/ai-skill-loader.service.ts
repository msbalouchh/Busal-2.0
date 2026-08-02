import "server-only";

import type { SkillExecutionContext } from "@/modules/ai-skills-management/interfaces/skill-handler.interface";
import { getSkill, getSkillBySlug } from "@/services/ai-skill-manager.service";

export async function loadSkillForExecution(ownerId: string, skillId: string) {
  const skill = await getSkill(ownerId, skillId);
  if (skill.status !== "ACTIVE") {
    throw new Error(`Skill is not active: ${skill.name}`);
  }

  const context: SkillExecutionContext = {
    skillId: skill.id,
    skillSlug: skill.slug,
    skillName: skill.name,
    input: {},
    configuration: skill.configuration,
  };

  return { skill, context };
}

export async function loadSkillBySlugForExecution(ownerId: string, slug: string) {
  const skill = await getSkillBySlug(ownerId, slug);
  if (!skill) throw new Error(`Skill not found: ${slug}`);
  if (skill.status !== "ACTIVE") {
    throw new Error(`Skill is not active: ${skill.name}`);
  }

  return {
    skill,
    context: {
      skillId: skill.id,
      skillSlug: skill.slug,
      skillName: skill.name,
      input: {},
      configuration: skill.configuration,
    } satisfies SkillExecutionContext,
  };
}
