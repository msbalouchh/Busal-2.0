import type {
  AgentSkillDefinition,
  AgentTemplateDefinition,
} from "@/modules/ai-agents/types/agent-types";

const skills = new Map<string, AgentSkillDefinition>();
const templates = new Map<string, AgentTemplateDefinition>();

export function registerAgentSkill(definition: AgentSkillDefinition): void {
  skills.set(definition.skillId, definition);
}

export function registerAgentTemplate(definition: AgentTemplateDefinition): void {
  templates.set(definition.templateId, definition);
}

export function getAgentSkill(skillId: string): AgentSkillDefinition | undefined {
  return skills.get(skillId);
}

export function getAgentTemplate(templateId: string): AgentTemplateDefinition | undefined {
  return templates.get(templateId);
}

export function listAgentSkills(): AgentSkillDefinition[] {
  return Array.from(skills.values());
}

export function listAgentTemplates(): AgentTemplateDefinition[] {
  return Array.from(templates.values());
}

export function resolveSkillTools(skillIds: string[]): string[] {
  const toolIds = new Set<string>();

  for (const skillId of skillIds) {
    const skill = skills.get(skillId);
    if (!skill) {
      continue;
    }

    for (const toolId of skill.allowedTools) {
      toolIds.add(toolId);
    }
  }

  return Array.from(toolIds);
}

export function resolveSkillWorkflows(skillIds: string[]): string[] {
  const workflowIds = new Set<string>();

  for (const skillId of skillIds) {
    const skill = skills.get(skillId);
    if (!skill) {
      continue;
    }

    for (const workflowId of skill.allowedWorkflows) {
      workflowIds.add(workflowId);
    }
  }

  return Array.from(workflowIds);
}
