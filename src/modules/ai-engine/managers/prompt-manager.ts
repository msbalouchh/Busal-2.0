import type { AiInjectedContext } from "@/modules/ai-engine/types/ai-engine.types";

export interface ComposedPrompt {
  systemPrompt: string;
  userPrompt: string;
}

/** Builds structured prompts from injected business context. */
export class AiPromptManager {
  composeSystemPrompt(context: AiInjectedContext, agentInstructions?: string): string {
    const sections = [
      "You are Busal AI — the intelligence layer for Busal OS, an AI-first business operating system.",
      "",
      "## Identity & Scope",
      `- Business: ${context.businessName}`,
      `- Industry: ${context.industry}`,
      `- Timezone: ${context.timezone}`,
      `- Currency: ${context.currency}`,
      `- Current module: ${context.currentModule ?? "platform"}`,
      "",
      "## Tenant Context",
      `- Tenant ID: ${context.tenantId}`,
      `- Workspace ID: ${context.workspaceId}`,
      `- Business ID: ${context.businessId}`,
      `- Branch ID: ${context.branchId ?? "all branches"}`,
      "",
      "## User Context",
      `- User: ${context.userName} (${context.userEmail})`,
      `- Role: ${context.roleSlug ?? "member"}`,
      `- Owner: ${context.isOwner ? "yes" : "no"}`,
      "",
      "## Subscription & Features",
      `- Plan: ${context.subscriptionPlan}`,
      `- Status: ${context.subscriptionStatus}`,
      `- Enabled modules: ${context.enabledModules.join(", ") || "none"}`,
      "",
      "## Permissions",
      context.permissions.length > 0
        ? context.permissions.slice(0, 40).join(", ")
        : "Standard member permissions",
      "",
      "## Business Profile",
      JSON.stringify(context.businessProfile, null, 2),
      "",
      "## Relevant Business Data",
      JSON.stringify(context.relevantData, null, 2),
      "",
      "## Rules",
      "- Respect tenant, workspace, branch, and RBAC isolation at all times.",
      "- Never expose data from other businesses.",
      "- Only use tools when the user has permission and subscription entitlements.",
      "- Prefer actionable, concise answers grounded in the provided context.",
      "- When uncertain, ask a clarifying question instead of inventing data.",
    ];

    if (agentInstructions) {
      sections.push("", "## Agent Instructions", agentInstructions);
    }

    return sections.join("\n");
  }

  composeInsightPrompt(context: AiInjectedContext, taskPrompt: string, format: "text" | "json"): ComposedPrompt {
    const systemPrompt = [
      this.composeSystemPrompt(context),
      "",
      "## Task",
      taskPrompt,
      format === "json" ? "Respond with valid JSON only. No markdown fences." : "",
    ]
      .filter(Boolean)
      .join("\n");

    return { systemPrompt, userPrompt: taskPrompt };
  }

  composeChatPrompt(context: AiInjectedContext, userMessage: string): ComposedPrompt {
    return {
      systemPrompt: this.composeSystemPrompt(context),
      userPrompt: userMessage,
    };
  }

  compressHistory(messages: Array<{ role: string; content: string }>, maxMessages = 20): Array<{ role: string; content: string }> {
    if (messages.length <= maxMessages) {
      return messages;
    }

    const head = messages.slice(0, 2);
    const tail = messages.slice(-(maxMessages - 3));
    const omitted = messages.length - head.length - tail.length;

    return [
      ...head,
      {
        role: "system",
        content: `[${omitted} earlier messages compressed for context window efficiency]`,
      },
      ...tail,
    ];
  }
}

export const aiPromptManager = new AiPromptManager();
