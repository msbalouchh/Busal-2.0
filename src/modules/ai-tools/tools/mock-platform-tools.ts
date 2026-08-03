import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import {
  DEFAULT_PLATFORM_TOOL_VERSION,
  PLATFORM_MODULES,
  PLATFORM_TOOL_IDS,
  PLATFORM_TOOL_PERMISSIONS,
} from "@/modules/ai-tools/constants/platform-tools";
import type {
  PlatformJsonSchema,
  PlatformToolDefinition,
  PlatformToolHandler,
  RegisteredPlatformTool,
} from "@/modules/ai-tools/types/platform-tool";

const emptyInput: PlatformJsonSchema = { type: "object", properties: {} };

function mockHandler(message: string): PlatformToolHandler {
  return async (input) => ({
    success: true,
    message,
    input,
    source: "mock",
    timestamp: new Date().toISOString(),
  });
}

function defineTool(
  definition: Omit<PlatformToolDefinition, "version" | "isEnabled" | "metadata"> & {
    metadata?: Partial<PlatformToolDefinition["metadata"]>;
  },
  handler: PlatformToolHandler,
): RegisteredPlatformTool {
  return {
    ...definition,
    version: DEFAULT_PLATFORM_TOOL_VERSION,
    isEnabled: true,
    metadata: {
      category: definition.capabilityId,
      tags: [],
      readOnly: false,
      confirmationRequired: false,
      dryRunSupported: true,
      riskLevel: "low",
      ...definition.metadata,
    },
    handler,
  };
}

export const MOCK_PLATFORM_TOOLS: RegisteredPlatformTool[] = [
  defineTool(
    {
      id: PLATFORM_TOOL_IDS.CUSTOMER,
      name: "Customer Tool",
      description: "Look up and manage customer profiles.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.CUSTOMERS_READ],
      requiredModules: [PLATFORM_MODULES.CRM],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: {
          customerId: { type: "string", description: "Customer ID" },
          email: { type: "string", description: "Customer email" },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          customer: { type: "object" },
          recentOrders: { type: "array" },
        },
      },
      supportedAgents: [
        BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT,
        BUILTIN_AGENT_SLUGS.SALES,
        BUILTIN_AGENT_SLUGS.CUSTOMER_SUPPORT,
      ],
      capabilityId: "capability.crm",
      skillIds: ["skill.customer-lookup"],
      metadata: { category: "CRM", tags: ["customer", "crm"], readOnly: true, riskLevel: "low" },
    },
    mockHandler("Customer profile retrieved (mock)."),
  ),
  defineTool(
    {
      id: PLATFORM_TOOL_IDS.RESERVATION,
      name: "Reservation Tool",
      description: "Search and manage reservations.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.RESERVATIONS_READ],
      requiredModules: [PLATFORM_MODULES.RESERVATIONS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        properties: {
          date: { type: "string" },
          guestName: { type: "string" },
          partySize: { type: "number" },
        },
      },
      outputSchema: {
        type: "object",
        properties: { reservations: { type: "array" }, availability: { type: "object" } },
      },
      supportedAgents: [
        BUILTIN_AGENT_SLUGS.RESERVATION,
        BUILTIN_AGENT_SLUGS.OPERATIONS,
        BUILTIN_AGENT_SLUGS.CUSTOMER_SUPPORT,
      ],
      capabilityId: "capability.reservations",
      skillIds: ["skill.reservation-book"],
    },
    mockHandler("3 reservations found for today (mock)."),
  ),
  defineTool(
    {
      id: PLATFORM_TOOL_IDS.MENU,
      name: "Menu Tool",
      description: "Browse menu items, categories, and pricing.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.MENU_READ],
      requiredModules: [PLATFORM_MODULES.MENU],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: { menuId: { type: "string" }, categoryId: { type: "string" } },
      },
      outputSchema: {
        type: "object",
        properties: { items: { type: "array" }, categories: { type: "array" } },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.OPERATIONS, "waiter"],
      capabilityId: "capability.menu",
      skillIds: ["skill.menu-browse"],
      metadata: { readOnly: true },
    },
    mockHandler("Menu catalog loaded — 48 items (mock)."),
  ),
  defineTool(
    {
      id: PLATFORM_TOOL_IDS.ORDER,
      name: "Order Tool",
      description: "Create, update, and track orders.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.ORDERS_READ],
      requiredModules: [PLATFORM_MODULES.ORDERS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        properties: { orderId: { type: "string" }, status: { type: "string" } },
      },
      outputSchema: {
        type: "object",
        properties: { order: { type: "object" }, timeline: { type: "array" } },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.OPERATIONS, "cashier", "waiter", "delivery-driver"],
      capabilityId: "capability.orders",
      skillIds: ["skill.order-track"],
    },
    mockHandler("Order #1042 — in preparation (mock)."),
  ),
  defineTool(
    {
      id: PLATFORM_TOOL_IDS.KITCHEN,
      name: "Kitchen Tool",
      description: "Monitor kitchen display and ticket flow.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.KITCHEN_READ],
      requiredModules: [PLATFORM_MODULES.KITCHEN],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        properties: { stationId: { type: "string" } },
      },
      outputSchema: {
        type: "object",
        properties: { tickets: { type: "array" }, load: { type: "string" } },
      },
      supportedAgents: ["kitchen-staff", BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.kitchen",
      skillIds: ["skill.kitchen-monitor"],
      metadata: { readOnly: true },
    },
    mockHandler("Kitchen load: moderate — 12 active tickets (mock)."),
  ),
  defineTool(
    {
      id: PLATFORM_TOOL_IDS.POS,
      name: "POS Tool",
      description: "Point-of-sale operations and checkout.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.POS_READ],
      requiredModules: [PLATFORM_MODULES.POS],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: emptyInput,
      outputSchema: {
        type: "object",
        properties: { terminalStatus: { type: "string" }, openOrders: { type: "number" } },
      },
      supportedAgents: ["cashier", BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.pos",
      skillIds: ["skill.pos-checkout"],
    },
    mockHandler("POS terminal active — 4 open orders (mock)."),
  ),
  defineTool(
    {
      id: PLATFORM_TOOL_IDS.INVENTORY,
      name: "Inventory Tool",
      description: "Stock levels, reorder points, and supplier data.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.INVENTORY_READ],
      requiredModules: [PLATFORM_MODULES.INVENTORY],
      requiredTenantScope: "required",
      requiredBranchScope: "required",
      inputSchema: {
        type: "object",
        properties: { sku: { type: "string" }, branchId: { type: "string" } },
      },
      outputSchema: {
        type: "object",
        properties: { stock: { type: "number" }, reorderNeeded: { type: "boolean" } },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.INVENTORY, BUILTIN_AGENT_SLUGS.OPERATIONS],
      capabilityId: "capability.inventory",
      skillIds: ["skill.inventory-check"],
      metadata: { readOnly: true },
    },
    mockHandler("Stock level: 42 units — reorder not needed (mock)."),
  ),
  defineTool(
    {
      id: PLATFORM_TOOL_IDS.FINANCE,
      name: "Finance Tool",
      description: "Invoices, payments, and financial summaries.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.FINANCE_READ],
      requiredModules: [PLATFORM_MODULES.FINANCE],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: { period: { type: "string" }, invoiceId: { type: "string" } },
      },
      outputSchema: {
        type: "object",
        properties: { summary: { type: "object" }, outstanding: { type: "number" } },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.FINANCE, BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT],
      capabilityId: "capability.finance",
      skillIds: ["skill.finance-summary"],
      metadata: { readOnly: true },
    },
    mockHandler("£12,450 outstanding across 8 invoices (mock)."),
  ),
  defineTool(
    {
      id: PLATFORM_TOOL_IDS.MARKETING,
      name: "Marketing Tool",
      description: "Campaign status, segments, and performance.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.MARKETING_READ],
      requiredModules: [PLATFORM_MODULES.MARKETING],
      requiredTenantScope: "required",
      requiredBranchScope: "none",
      inputSchema: {
        type: "object",
        properties: { campaignId: { type: "string" } },
      },
      outputSchema: {
        type: "object",
        properties: { campaigns: { type: "array" }, performance: { type: "object" } },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.MARKETING, BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT],
      capabilityId: "capability.marketing",
      skillIds: ["skill.marketing-campaign"],
      metadata: { readOnly: true },
    },
    mockHandler("Campaign CTR 4.2% — above benchmark (mock)."),
  ),
  defineTool(
    {
      id: PLATFORM_TOOL_IDS.ANALYTICS,
      name: "Analytics Tool",
      description: "KPIs, trends, and business intelligence.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.ANALYTICS_READ],
      requiredModules: [PLATFORM_MODULES.ANALYTICS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        properties: { metric: { type: "string" }, period: { type: "string" } },
      },
      outputSchema: {
        type: "object",
        properties: { metrics: { type: "object" }, trends: { type: "array" } },
      },
      supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS, BUILTIN_AGENT_SLUGS.BUSINESS_ASSISTANT],
      capabilityId: "capability.analytics",
      skillIds: ["skill.analytics-insight"],
      metadata: { readOnly: true },
    },
    mockHandler("Revenue up 8% week-over-week (mock)."),
  ),
  defineTool(
    {
      id: PLATFORM_TOOL_IDS.NOTIFICATION,
      name: "Notification Tool",
      description: "Send notifications to staff and customers.",
      requiredPermissions: [PLATFORM_TOOL_PERMISSIONS.NOTIFICATIONS_SEND],
      requiredModules: [PLATFORM_MODULES.NOTIFICATIONS],
      requiredTenantScope: "required",
      requiredBranchScope: "optional",
      inputSchema: {
        type: "object",
        required: ["channel", "message"],
        properties: {
          channel: { type: "string" },
          message: { type: "string" },
          recipientId: { type: "string" },
        },
      },
      outputSchema: {
        type: "object",
        properties: { sent: { type: "boolean" }, notificationId: { type: "string" } },
      },
      supportedAgents: [
        BUILTIN_AGENT_SLUGS.OPERATIONS,
        BUILTIN_AGENT_SLUGS.STAFF,
        BUILTIN_AGENT_SLUGS.CUSTOMER_SUPPORT,
      ],
      capabilityId: "capability.notifications",
      skillIds: ["skill.notify-staff"],
      metadata: { confirmationRequired: true, riskLevel: "medium" },
    },
    mockHandler("Notification queued for delivery (mock)."),
  ),
];

export type { PlatformToolDefinition };
