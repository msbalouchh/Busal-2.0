import "server-only";

/** Non-inference service — no parallel AI execution. */

import type { SkillDiscoveryEntry } from "@/modules/ai-skills-management/types/ai-skills-types";
import { listSkills } from "@/services/ai-skill-manager.service";
import { getBuiltInSkillTemplates } from "@/services/ai-skill-registry.service";

export async function discoverSkills(
  ownerId: string,
  search?: string,
): Promise<SkillDiscoveryEntry[]> {
  const [registered, templates] = await Promise.all([
    listSkills(ownerId, { search, pageSize: 100 }),
    Promise.resolve(getBuiltInSkillTemplates()),
  ]);

  const registeredBySlug = new Map(registered.items.map((skill) => [skill.slug, skill]));

  const discovery = templates.map<SkillDiscoveryEntry>((template) => {
    const registeredSkill = registeredBySlug.get(template.slug);
    return {
      slug: template.slug,
      name: template.name,
      category: template.category,
      description: template.description,
      version: registeredSkill?.version ?? "1.0.0",
      isRegistered: Boolean(registeredSkill),
      skillId: registeredSkill?.id,
    };
  });

  const customSkills = registered.items
    .filter((skill) => !templates.some((template) => template.slug === skill.slug))
    .map<SkillDiscoveryEntry>((skill) => ({
      slug: skill.slug,
      name: skill.name,
      category: skill.category,
      description: skill.description ?? "",
      version: skill.version,
      isRegistered: true,
      skillId: skill.id,
    }));

  return [...discovery, ...customSkills];
}

export async function discoverActiveSkills(ownerId: string): Promise<SkillDiscoveryEntry[]> {
  const registered = await listSkills(ownerId, { status: "ACTIVE", pageSize: 100 });
  return registered.items.map((skill) => ({
    slug: skill.slug,
    name: skill.name,
    category: skill.category,
    description: skill.description ?? "",
    version: skill.version,
    isRegistered: true,
    skillId: skill.id,
  }));
}
