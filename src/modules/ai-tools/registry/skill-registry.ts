import { BUILTIN_PLATFORM_SKILLS } from "@/modules/ai-tools/skills/builtin-skills";
import type {
  PlatformSkillDefinition,
  RegisteredPlatformSkill,
} from "@/modules/ai-tools/types/skill";

const skills = new Map<string, RegisteredPlatformSkill>();

function seedSkills(): void {
  for (const skill of BUILTIN_PLATFORM_SKILLS) {
    skills.set(skill.slug, skill);
  }
}

seedSkills();

/** Registry for composable AI skills that orchestrate one or more tools. */
export class SkillRegistry {
  register(skill: RegisteredPlatformSkill): void {
    skills.set(skill.slug, skill);
  }

  replace(slug: string, skill: RegisteredPlatformSkill): void {
    if (!skills.has(slug)) {
      throw new Error(`Skill "${slug}" is not registered.`);
    }

    skills.set(slug, { ...skill, slug });
  }

  get(slug: string): RegisteredPlatformSkill | undefined {
    return skills.get(slug);
  }

  getOrThrow(slug: string): RegisteredPlatformSkill {
    const skill = skills.get(slug);

    if (!skill) {
      throw new Error(`Skill "${slug}" is not registered.`);
    }

    return skill;
  }

  list(): PlatformSkillDefinition[] {
    return Array.from(skills.values()).sort((left, right) => left.name.localeCompare(right.name));
  }

  listEnabled(): PlatformSkillDefinition[] {
    return this.list().filter((skill) => skill.isEnabled);
  }

  listForAgent(agentSlug: string): PlatformSkillDefinition[] {
    return this.listEnabled().filter((skill) => skill.supportedAgents.includes(agentSlug));
  }

  listForTool(toolId: string): PlatformSkillDefinition[] {
    return this.listEnabled().filter((skill) => skill.toolIds.includes(toolId));
  }

  unregister(slug: string): boolean {
    return skills.delete(slug);
  }
}

export const skillRegistry = new SkillRegistry();

export function registerPlatformSkill(skill: RegisteredPlatformSkill): void {
  skillRegistry.register(skill);
}

export function listPlatformSkills(): PlatformSkillDefinition[] {
  return skillRegistry.list();
}
