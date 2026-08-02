import "server-only";

import { BUILT_IN_SKILL_TEMPLATES } from "@/modules/ai-skills-management/lib/ai-skills-validation";
import type { BuiltInSkillTemplate } from "@/modules/ai-skills-management/types/ai-skills-types";

const pluginSkills: BuiltInSkillTemplate[] = [];

export function getBuiltInSkillTemplates(): BuiltInSkillTemplate[] {
  return [...BUILT_IN_SKILL_TEMPLATES, ...pluginSkills];
}

export function registerSkillTemplate(template: BuiltInSkillTemplate): void {
  if (pluginSkills.some((entry) => entry.slug === template.slug)) {
    throw new Error(`Skill template already registered: ${template.slug}`);
  }
  pluginSkills.push(template);
}

export function getSkillTemplateBySlug(slug: string): BuiltInSkillTemplate | undefined {
  return getBuiltInSkillTemplates().find((template) => template.slug === slug);
}

export function listSkillTemplatesByCategory(category?: string): BuiltInSkillTemplate[] {
  const templates = getBuiltInSkillTemplates();
  if (!category || category === "ALL") return templates;
  return templates.filter((template) => template.category === category);
}
