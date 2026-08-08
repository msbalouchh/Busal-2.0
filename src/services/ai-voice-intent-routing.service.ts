import "server-only";

import type { VoiceIntentDefinition } from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";
import { runCentralAiInsightForOwner } from "@/services/ai-engine-bridge.service";

export interface IntentDetectionResult {
  intent: string;
  confidence: number;
  action: string;
  routePath: string | null;
  responseText: string;
  parameters: Record<string, string>;
}

const VOICE_INTENTS: VoiceIntentDefinition[] = [
  {
    intent: "show_today_sales",
    label: "Show today's sales",
    description: "Navigate to sales analytics for today",
    exampleCommands: ["Show today's sales", "What are today's sales?", "Sales today"],
    routePath: "/app/restaurant/analytics/sales",
  },
  {
    intent: "open_reservations",
    label: "Open reservations",
    description: "Navigate to reservations management",
    exampleCommands: ["Open reservations", "Show reservations", "View bookings"],
    routePath: "/app/restaurant/reservations",
  },
  {
    intent: "create_order",
    label: "Create a new order",
    description: "Navigate to new order creation",
    exampleCommands: ["Create a new order", "New order", "Start an order"],
    routePath: "/app/restaurant/orders/new",
  },
  {
    intent: "find_customer",
    label: "Find customer",
    description: "Search for a customer by name",
    exampleCommands: ["Find customer Ahmed", "Search customer John", "Look up customer Sarah"],
    routePath: "/app/restaurant/customers",
  },
  {
    intent: "check_inventory",
    label: "Check inventory",
    description: "Navigate to inventory overview",
    exampleCommands: ["Check inventory", "Show inventory", "Inventory status"],
    routePath: "/app/restaurant/inventory",
  },
  {
    intent: "generate_daily_report",
    label: "Generate daily report",
    description: "Navigate to reports for daily summary",
    exampleCommands: ["Generate daily report", "Daily report", "Create today's report"],
    routePath: "/app/restaurant/analytics/reports",
  },
  {
    intent: "show_low_stock",
    label: "Show low stock items",
    description: "Navigate to inventory for low-stock alerts",
    exampleCommands: ["Show low stock items", "Low stock", "What's running low?"],
    routePath: "/app/restaurant/inventory",
  },
  {
    intent: "summarize_business",
    label: "Summarize today's business",
    description: "Navigate to executive analytics dashboard",
    exampleCommands: ["Summarize today's business", "Business summary", "How is business today?"],
    routePath: "/app/restaurant/analytics",
  },
];

const INTENT_ROUTE_MAP: Record<
  string,
  { action: string; routePath: string | null; responseTemplate: string }
> = {
  show_today_sales: {
    action: "navigate:sales_analytics",
    routePath: "/app/restaurant/analytics/sales",
    responseTemplate: "Opening today's sales analytics.",
  },
  open_reservations: {
    action: "navigate:reservations",
    routePath: "/app/restaurant/reservations",
    responseTemplate: "Opening reservations.",
  },
  create_order: {
    action: "navigate:new_order",
    routePath: "/app/restaurant/orders/new",
    responseTemplate: "Opening new order screen.",
  },
  find_customer: {
    action: "navigate:customer_search",
    routePath: "/app/restaurant/customers",
    responseTemplate: "Opening customer search.",
  },
  check_inventory: {
    action: "navigate:inventory",
    routePath: "/app/restaurant/inventory",
    responseTemplate: "Opening inventory overview.",
  },
  generate_daily_report: {
    action: "navigate:reports",
    routePath: "/app/restaurant/analytics/reports",
    responseTemplate: "Opening reports to generate your daily summary.",
  },
  show_low_stock: {
    action: "navigate:low_stock",
    routePath: "/app/restaurant/inventory",
    responseTemplate: "Opening inventory to show low stock items.",
  },
  summarize_business: {
    action: "navigate:executive_dashboard",
    routePath: "/app/restaurant/analytics",
    responseTemplate: "Opening business analytics summary.",
  },
};

export function listVoiceIntents(): VoiceIntentDefinition[] {
  return VOICE_INTENTS;
}

/** Routes voice intent detection through the centralized AI engine. */
export async function detectVoiceIntent(
  ownerId: string,
  commandText: string,
): Promise<IntentDetectionResult> {
  const normalized = commandText.trim();

  const engineResult = await runCentralAiInsightForOwner(ownerId, {
    currentModule: "voice",
    prompt: `Detect voice command intent for: "${normalized}"`,
    contextData: {
      commandText: normalized,
      availableIntents: VOICE_INTENTS,
    },
    responseFormat: "json",
  });

  const parsed = engineResult.parsed as
    | {
        intent?: string;
        confidence?: number;
        parameters?: Record<string, string>;
        responseText?: string;
      }
    | undefined;

  const intent = parsed?.intent ?? "unknown";
  const route = INTENT_ROUTE_MAP[intent];

  if (route) {
    return {
      intent,
      confidence: parsed?.confidence ?? 0.9,
      action: route.action,
      routePath: route.routePath,
      responseText:
        parsed?.responseText ??
        (parsed?.parameters?.customerName
          ? `Searching for customer ${parsed.parameters.customerName}.`
          : route.responseTemplate),
      parameters: parsed?.parameters ?? {},
    };
  }

  return {
    intent: "unknown",
    confidence: parsed?.confidence ?? 0.2,
    action: "fallback:unknown_intent",
    routePath: null,
    responseText:
      parsed?.responseText ??
      "I didn't recognize that command. Try phrases like 'Show today's sales' or 'Open reservations'.",
    parameters: parsed?.parameters ?? {},
  };
}

export function routeVoiceIntent(result: IntentDetectionResult): {
  action: string;
  routePath: string | null;
  parameters: Record<string, string>;
} {
  return {
    action: result.action,
    routePath: result.routePath,
    parameters: result.parameters,
  };
}
