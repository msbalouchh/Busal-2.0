import type {
  AiComposedPrompt,
  AiPromptContext,
  AiPromptTemplate,
} from "@/modules/ai/types/prompt";

const DEFAULT_TEMPLATES: AiPromptTemplate[] = [
  {
    id: "tpl-agent-system",
    slug: "agent-system",
    name: "Agent System Prompt",
    template:
      "You are {{agentName}} for Busal OS.\n\nRole: {{agentDescription}}\n\nBusiness: {{businessName}}\nWorkspace: {{workspaceName}}\nUser: {{userName}}\n\nRelevant memory:\n{{memorySummary}}\n\nAvailable tools:\n{{toolSummary}}",
    variables: [
      "agentName",
      "agentDescription",
      "businessName",
      "workspaceName",
      "userName",
      "memorySummary",
      "toolSummary",
    ],
  },
  {
    id: "tpl-user-query",
    slug: "user-query",
    name: "User Query Wrapper",
    template: "User request:\n{{userMessage}}",
    variables: ["userMessage"],
  },
];

function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? "");
}

/** Composes prompts from templates and runtime context. No external API calls. */
export class PromptEngine {
  private readonly templates = new Map<string, AiPromptTemplate>();

  constructor() {
    for (const template of DEFAULT_TEMPLATES) {
      this.templates.set(template.slug, template);
    }
  }

  register(template: AiPromptTemplate): void {
    this.templates.set(template.slug, template);
  }

  getTemplate(slug: string): AiPromptTemplate | undefined {
    return this.templates.get(slug);
  }

  composeAgentSystemPrompt(context: AiPromptContext): AiComposedPrompt {
    const template = this.templates.get("agent-system");

    if (!template) {
      throw new Error("Agent system prompt template is missing.");
    }

    const variables: Record<string, string> = {
      agentName: context.agentName,
      agentDescription: context.agentDescription,
      businessName: context.businessName ?? "Unknown Business",
      workspaceName: context.workspaceName ?? "Unknown Workspace",
      userName: context.userName ?? "User",
      memorySummary: context.memorySummary ?? "No memory loaded.",
      toolSummary: context.toolSummary ?? "No tools available.",
      ...context.customVariables,
    };

    return {
      systemPrompt: interpolate(template.template, variables),
      templateSlug: template.slug,
    };
  }

  composeUserPrompt(userMessage: string): AiComposedPrompt {
    const template = this.templates.get("user-query");

    if (!template) {
      return { systemPrompt: userMessage, templateSlug: "direct" };
    }

    return {
      userPrompt: interpolate(template.template, { userMessage }),
      systemPrompt: "",
      templateSlug: template.slug,
    };
  }
}

export const promptEngine = new PromptEngine();
