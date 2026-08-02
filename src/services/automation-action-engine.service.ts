import "server-only";

import { prisma } from "@/lib/prisma";
import { publishNotificationEvent } from "@/services/notifications.service";
import { sendCommunicationMessage } from "@/services/communication-message.service";
import { getOwnedBusinessId } from "@/services/automation-context.service";

export const AUTOMATION_ACTION_LIBRARY = [
  { id: "send.email", label: "Send Email", category: "Notifications" },
  { id: "send.sms", label: "Send SMS", category: "Notifications" },
  { id: "send.whatsapp", label: "Send WhatsApp", category: "Notifications" },
  { id: "create.task", label: "Create Task", category: "Productivity" },
  { id: "generate.report", label: "Generate Report", category: "Reporting" },
  { id: "notify.staff", label: "Notify Staff", category: "Notifications" },
  { id: "notify.customer", label: "Notify Customer", category: "Notifications" },
  { id: "run.ai.agent", label: "Run AI Agent", category: "AI Platform" },
  { id: "run.ai.skill", label: "Run AI Skill", category: "AI Platform" },
  { id: "call.integration", label: "Call Integration", category: "Integration Platform" },
  { id: "update.record", label: "Update Record", category: "Data" },
] as const;

export type AutomationActionDefinition = (typeof AUTOMATION_ACTION_LIBRARY)[number];

export function listActionLibrary(): AutomationActionDefinition[] {
  return [...AUTOMATION_ACTION_LIBRARY];
}

export interface ActionExecutionResult {
  actionType: string;
  order: number;
  success: boolean;
  simulated: boolean;
  message: string;
  output: Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

async function resolveOwnerId(context: Record<string, unknown>): Promise<string | null> {
  const direct = readString(context.ownerId) ?? readString(context.userId);
  if (direct) return direct;

  const businessId = readString(context.businessId);
  if (!businessId) return null;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { ownerId: true },
  });
  return business?.ownerId ?? null;
}

export async function executeAction(
  action: { type: string; order: number; configuration: Record<string, unknown> },
  context: Record<string, unknown>,
): Promise<ActionExecutionResult> {
  const businessId =
    readString(context.businessId) ??
    (await resolveOwnerId(context).then(async (ownerId) =>
      ownerId ? getOwnedBusinessId(ownerId) : null,
    ));

  try {
    switch (action.type) {
      case "send.email": {
        const ownerId = await resolveOwnerId(context);
        const recipient =
          readString(action.configuration.recipient) ?? readString(context.recipientEmail);
        const content =
          readString(action.configuration.content) ?? readString(context.message) ?? "Notification";
        const subject =
          readString(action.configuration.subject) ?? readString(context.subject) ?? "Busal OS";

        if (!ownerId || !recipient) {
          throw new Error("Missing owner or recipient for send.email");
        }

        await sendCommunicationMessage(ownerId, {
          channel: "EMAIL",
          recipient,
          subject,
          content,
          metadata: { source: "automation", actionType: action.type },
        });

        return {
          actionType: action.type,
          order: action.order,
          success: true,
          simulated: false,
          message: `Email queued for ${recipient}`,
          output: { recipient, subject },
        };
      }
      case "notify.staff":
      case "notify.customer": {
        if (!businessId) {
          throw new Error("Missing business context for notification action");
        }

        const recipientUserId =
          readString(action.configuration.userId) ?? readString(context.userId);
        const title =
          readString(action.configuration.title) ??
          readString(context.title) ??
          "Automation notification";
        const body = readString(action.configuration.body) ?? readString(context.message) ?? title;

        await publishNotificationEvent({
          businessId,
          category: "SYSTEM",
          title,
          body,
          triggeredByModule: "automation",
          recipientUserIds: recipientUserId ? [recipientUserId] : undefined,
          triggeredByUserId: recipientUserId ?? undefined,
        });

        return {
          actionType: action.type,
          order: action.order,
          success: true,
          simulated: false,
          message: "In-app notification published",
          output: { businessId, title },
        };
      }
      default:
        return {
          actionType: action.type,
          order: action.order,
          success: true,
          simulated: true,
          message: `Action "${action.type}" logged — configure a dedicated handler to execute side effects.`,
          output: { actionType: action.type },
        };
    }
  } catch (error) {
    return {
      actionType: action.type,
      order: action.order,
      success: false,
      simulated: false,
      message: error instanceof Error ? error.message : "Action failed",
      output: {},
    };
  }
}

export async function executeActions(
  actions: Array<{ type: string; order: number; configuration: Record<string, unknown> }>,
  context: Record<string, unknown>,
): Promise<ActionExecutionResult[]> {
  const sorted = [...actions].sort((a, b) => a.order - b.order);
  const results: ActionExecutionResult[] = [];
  for (const action of sorted) {
    results.push(await executeAction(action, context));
  }
  return results;
}
