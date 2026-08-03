import { BUILTIN_AGENTS } from "@/modules/ai/agents/builtin-agents";
import type { AiAgentDefinition } from "@/modules/ai/types/agent";

const agents = new Map<string, AiAgentDefinition>();

function seedBuiltinAgents(): void {
  for (const agent of BUILTIN_AGENTS) {
    agents.set(agent.slug, agent);
  }
}

seedBuiltinAgents();

/** Central registry for AI agents. Every agent is replaceable via `registerAgent`. */
export class AIAgentRegistry {
  register(definition: AiAgentDefinition): void {
    agents.set(definition.slug, definition);
  }

  replace(slug: string, definition: AiAgentDefinition): void {
    if (!agents.has(slug)) {
      throw new Error(`Agent "${slug}" is not registered.`);
    }

    agents.set(slug, { ...definition, slug, isReplaceable: true });
  }

  get(slug: string): AiAgentDefinition | undefined {
    return agents.get(slug);
  }

  getOrThrow(slug: string): AiAgentDefinition {
    const agent = agents.get(slug);

    if (!agent) {
      throw new Error(`Agent "${slug}" is not registered.`);
    }

    return agent;
  }

  list(): AiAgentDefinition[] {
    return Array.from(agents.values()).sort((left, right) => right.priority - left.priority);
  }

  listBuiltin(): AiAgentDefinition[] {
    return this.list().filter((agent) => agent.isBuiltin);
  }

  unregister(slug: string): boolean {
    const agent = agents.get(slug);

    if (agent?.isBuiltin) {
      return false;
    }

    return agents.delete(slug);
  }

  resolveToolSlugs(agentSlug: string): string[] {
    return this.getOrThrow(agentSlug).toolSlugs;
  }
}

export const aiAgentRegistry = new AIAgentRegistry();

export function registerAgent(definition: AiAgentDefinition): void {
  aiAgentRegistry.register(definition);
}

export function getAgent(slug: string): AiAgentDefinition | undefined {
  return aiAgentRegistry.get(slug);
}

export function listAgents(): AiAgentDefinition[] {
  return aiAgentRegistry.list();
}
