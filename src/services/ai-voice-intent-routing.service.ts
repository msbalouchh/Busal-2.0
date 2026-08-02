import "server-only";

import type { VoiceIntentDefinition } from "@/modules/ai-voice-agent-management/types/ai-voice-agent-types";

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

const INTENT_PATTERNS: Array<{
  intent: string;
  patterns: RegExp[];
  action: string;
  routePath: string | null;
  responseTemplate: string | ((params: Record<string, string>) => string);
}> = [
  {
    intent: "show_today_sales",
    patterns: [/today'?s?\s+sales/i, /show\s+sales/i, /sales\s+today/i],
    action: "navigate:sales_analytics",
    routePath: "/app/restaurant/analytics/sales",
    responseTemplate: "Opening today's sales analytics.",
  },
  {
    intent: "open_reservations",
    patterns: [/open\s+reservations?/i, /show\s+reservations?/i, /view\s+bookings?/i],
    action: "navigate:reservations",
    routePath: "/app/restaurant/reservations",
    responseTemplate: "Opening reservations.",
  },
  {
    intent: "create_order",
    patterns: [/create\s+(a\s+)?new\s+order/i, /new\s+order/i, /start\s+an?\s+order/i],
    action: "navigate:new_order",
    routePath: "/app/restaurant/orders/new",
    responseTemplate: "Opening new order screen.",
  },
  {
    intent: "find_customer",
    patterns: [
      /find\s+customer\s+(.+)/i,
      /search\s+customer\s+(.+)/i,
      /look\s+up\s+customer\s+(.+)/i,
    ],
    action: "navigate:customer_search",
    routePath: "/app/restaurant/customers",
    responseTemplate: (params) =>
      params.customerName
        ? `Searching for customer ${params.customerName}.`
        : "Opening customer search.",
  },
  {
    intent: "check_inventory",
    patterns: [/check\s+inventory/i, /show\s+inventory/i, /inventory\s+status/i],
    action: "navigate:inventory",
    routePath: "/app/restaurant/inventory",
    responseTemplate: "Opening inventory overview.",
  },
  {
    intent: "generate_daily_report",
    patterns: [/generate\s+daily\s+report/i, /daily\s+report/i, /create\s+today'?s?\s+report/i],
    action: "navigate:reports",
    routePath: "/app/restaurant/analytics/reports",
    responseTemplate: "Opening reports to generate your daily summary.",
  },
  {
    intent: "show_low_stock",
    patterns: [/low\s+stock/i, /running\s+low/i, /show\s+low\s+stock/i],
    action: "navigate:low_stock",
    routePath: "/app/restaurant/inventory",
    responseTemplate: "Opening inventory to show low stock items.",
  },
  {
    intent: "summarize_business",
    patterns: [/summarize\s+today'?s?\s+business/i, /business\s+summary/i, /how\s+is\s+business/i],
    action: "navigate:executive_dashboard",
    routePath: "/app/restaurant/analytics",
    responseTemplate: "Opening business analytics summary.",
  },
];

export function listVoiceIntents(): VoiceIntentDefinition[] {
  return VOICE_INTENTS;
}

export function detectVoiceIntent(commandText: string): IntentDetectionResult {
  const normalized = commandText.trim();

  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = normalized.match(regex);
      if (match) {
        const parameters: Record<string, string> = {};
        if (pattern.intent === "find_customer" && match[1]) {
          parameters.customerName = match[1].trim();
        }

        const responseText =
          typeof pattern.responseTemplate === "function"
            ? pattern.responseTemplate(parameters)
            : pattern.responseTemplate;

        return {
          intent: pattern.intent,
          confidence: 0.92,
          action: pattern.action,
          routePath: pattern.routePath,
          responseText,
          parameters,
        };
      }
    }
  }

  return {
    intent: "unknown",
    confidence: 0.2,
    action: "fallback:unknown_intent",
    routePath: null,
    responseText:
      "I didn't recognize that command. Try phrases like 'Show today's sales' or 'Open reservations'.",
    parameters: {},
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
