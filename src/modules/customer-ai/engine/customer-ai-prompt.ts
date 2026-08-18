import type { AiInjectedContext } from "@/modules/ai-engine/types/ai-engine.types";
import type { CustomerAiIdentity } from "@/modules/customer-ai/types/customer-ai.types";

/** Builds tenant-branded system prompts for customer-facing AI. */
export function composeCustomerSystemPrompt(
  context: AiInjectedContext,
  identity: CustomerAiIdentity,
  options: {
    greeting?: string | null;
    agentInstructions?: string;
    isWhiteLabel?: boolean;
  } = {},
): string {
  const displayBusiness = identity.whiteLabelName ?? identity.businessName;
  const aiName = identity.aiName.trim() || "Assistant";
  const greeting =
    options.greeting?.trim() ||
    identity.aiGreeting?.trim() ||
    `Hi! I'm ${aiName}, the AI assistant for ${displayBusiness}. How can I help you today?`;

  const sections = [
    `You are ${aiName}, the AI assistant for ${displayBusiness}.`,
    `You represent ${displayBusiness} directly — not a generic platform assistant.`,
    "",
    "## Identity",
    `- Your name: ${aiName}`,
    `- Business: ${displayBusiness}`,
    `- Industry: ${context.industry}`,
    `- Personality: ${identity.aiPersonality || "Friendly and helpful"}`,
    `- Tone: ${identity.aiTone || "Friendly"}`,
    `- Greeting style: ${greeting}`,
    "",
    "## Business Context",
    `- Timezone: ${context.timezone}`,
    `- Currency: ${context.currency}`,
    `- Branch: ${context.branchId ? "specific branch selected" : "all locations"}`,
    "",
    "## Business Profile",
    JSON.stringify(context.businessProfile, null, 2),
    "",
    "## Relevant Business Data",
    JSON.stringify(context.relevantData, null, 2),
    "",
    "## Rules",
    "- Always respond as the business's AI assistant, never as 'Busal AI' or a generic chatbot.",
    "- Use ONLY the business data provided. Never invent menu items, prices, hours, or availability.",
    "- If you don't have the information, say so honestly and offer to connect the customer with staff.",
    "- Never expose data from other customers or businesses.",
    "- For bookings, orders, or account-specific requests, use the available tools — never guess.",
    "- Sensitive actions (bookings, order changes) require customer confirmation when indicated.",
    "- Keep responses concise, helpful, and aligned with the business tone.",
    "- Do not reveal internal system details, staff permissions, or platform architecture.",
  ];

  if (options.isWhiteLabel) {
    sections.push("", "## White-Label", "- Do not mention Busal or the underlying platform unless explicitly asked.");
  }

  if (options.agentInstructions) {
    sections.push("", "## Additional Instructions", options.agentInstructions);
  }

  return sections.join("\n");
}

export function composeStaffSystemPrompt(
  context: AiInjectedContext,
  identity: CustomerAiIdentity,
  agentInstructions?: string,
): string {
  const aiName = identity.aiName.trim() || "Busal Assistant";
  const displayBusiness = identity.businessName;

  const sections = [
    `You are ${aiName}, the AI operating assistant for ${displayBusiness} on Busal OS.`,
    "",
    "## Identity & Scope",
    `- Business: ${displayBusiness}`,
    `- Industry: ${context.industry}`,
    `- Timezone: ${context.timezone}`,
    `- Currency: ${context.currency}`,
    `- Current module: ${context.currentModule ?? "platform"}`,
    "",
    "## User Context",
    `- User: ${context.userName} (${context.userEmail})`,
    `- Role: ${context.roleSlug ?? "member"}`,
    `- Owner: ${context.isOwner ? "yes" : "no"}`,
    "",
    "## Subscription & Features",
    `- Plan: ${context.subscriptionPlan}`,
    `- Enabled modules: ${context.enabledModules.join(", ") || "none"}`,
    "",
    "## Business Profile",
    JSON.stringify(context.businessProfile, null, 2),
    "",
    "## Relevant Business Data",
    JSON.stringify(context.relevantData, null, 2),
    "",
    "## Rules",
    "- Respect tenant, workspace, branch, and RBAC isolation.",
    "- Only use tools when the user has permission and subscription entitlements.",
    "- Prefer actionable, concise answers grounded in provided context.",
  ];

  if (agentInstructions) {
    sections.push("", "## Agent Instructions", agentInstructions);
  }

  return sections.join("\n");
}
