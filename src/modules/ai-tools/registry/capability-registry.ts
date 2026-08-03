import { PLATFORM_MODULES, PLATFORM_TOOL_IDS } from "@/modules/ai-tools/constants/platform-tools";
import { PLATFORM_SKILL_SLUGS } from "@/modules/ai-tools/constants/skills";
import { BUILTIN_AGENT_SLUGS } from "@/modules/ai/constants/agent-slugs";
import type { PlatformCapabilityDefinition } from "@/modules/ai-tools/types/capability";

export const BUILTIN_CAPABILITIES: PlatformCapabilityDefinition[] = [
  {
    id: "capability.crm",
    slug: "crm",
    name: "CRM Capability",
    description: "Customer relationship management tools and skills.",
    module: PLATFORM_MODULES.CRM,
    toolIds: [PLATFORM_TOOL_IDS.CUSTOMER],
    skillIds: [PLATFORM_SKILL_SLUGS.CUSTOMER_LOOKUP],
    requiredPermissions: ["customers.read"],
    supportedAgents: [BUILTIN_AGENT_SLUGS.SALES, BUILTIN_AGENT_SLUGS.CUSTOMER_SUPPORT],
  },
  {
    id: "capability.reservations",
    slug: "reservations",
    name: "Reservations Capability",
    description: "Booking and table management.",
    module: PLATFORM_MODULES.RESERVATIONS,
    toolIds: [PLATFORM_TOOL_IDS.RESERVATION],
    skillIds: [PLATFORM_SKILL_SLUGS.RESERVATION_BOOK],
    requiredPermissions: ["reservations.read"],
    supportedAgents: [BUILTIN_AGENT_SLUGS.RESERVATION],
  },
  {
    id: "capability.menu",
    slug: "menu",
    name: "Menu Capability",
    description: "Menu catalog and pricing.",
    module: PLATFORM_MODULES.MENU,
    toolIds: [PLATFORM_TOOL_IDS.MENU],
    skillIds: [PLATFORM_SKILL_SLUGS.MENU_BROWSE],
    requiredPermissions: ["menu.read"],
    supportedAgents: ["waiter"],
  },
  {
    id: "capability.orders",
    slug: "orders",
    name: "Orders Capability",
    description: "Order lifecycle management.",
    module: PLATFORM_MODULES.ORDERS,
    toolIds: [PLATFORM_TOOL_IDS.ORDER],
    skillIds: [PLATFORM_SKILL_SLUGS.ORDER_TRACK],
    requiredPermissions: ["orders.read"],
    supportedAgents: [BUILTIN_AGENT_SLUGS.OPERATIONS, "waiter"],
  },
  {
    id: "capability.kitchen",
    slug: "kitchen",
    name: "Kitchen Capability",
    description: "Kitchen display and ticket flow.",
    module: PLATFORM_MODULES.KITCHEN,
    toolIds: [PLATFORM_TOOL_IDS.KITCHEN],
    skillIds: [PLATFORM_SKILL_SLUGS.KITCHEN_MONITOR],
    requiredPermissions: ["kitchen.read"],
    supportedAgents: ["kitchen-staff"],
  },
  {
    id: "capability.pos",
    slug: "pos",
    name: "POS Capability",
    description: "Point-of-sale operations.",
    module: PLATFORM_MODULES.POS,
    toolIds: [PLATFORM_TOOL_IDS.POS],
    skillIds: [PLATFORM_SKILL_SLUGS.POS_CHECKOUT],
    requiredPermissions: ["pos.read"],
    supportedAgents: ["cashier"],
  },
  {
    id: "capability.inventory",
    slug: "inventory",
    name: "Inventory Capability",
    description: "Stock and supplier management.",
    module: PLATFORM_MODULES.INVENTORY,
    toolIds: [PLATFORM_TOOL_IDS.INVENTORY],
    skillIds: [PLATFORM_SKILL_SLUGS.INVENTORY_CHECK],
    requiredPermissions: ["inventory.read"],
    supportedAgents: [BUILTIN_AGENT_SLUGS.INVENTORY],
  },
  {
    id: "capability.finance",
    slug: "finance",
    name: "Finance Capability",
    description: "Financial operations and reporting.",
    module: PLATFORM_MODULES.FINANCE,
    toolIds: [PLATFORM_TOOL_IDS.FINANCE],
    skillIds: [PLATFORM_SKILL_SLUGS.FINANCE_SUMMARY],
    requiredPermissions: ["finance.read"],
    supportedAgents: [BUILTIN_AGENT_SLUGS.FINANCE],
  },
  {
    id: "capability.marketing",
    slug: "marketing",
    name: "Marketing Capability",
    description: "Campaign and audience management.",
    module: PLATFORM_MODULES.MARKETING,
    toolIds: [PLATFORM_TOOL_IDS.MARKETING],
    skillIds: [PLATFORM_SKILL_SLUGS.MARKETING_CAMPAIGN],
    requiredPermissions: ["marketing.read"],
    supportedAgents: [BUILTIN_AGENT_SLUGS.MARKETING],
  },
  {
    id: "capability.analytics",
    slug: "analytics",
    name: "Analytics Capability",
    description: "Business intelligence and KPIs.",
    module: PLATFORM_MODULES.ANALYTICS,
    toolIds: [PLATFORM_TOOL_IDS.ANALYTICS],
    skillIds: [PLATFORM_SKILL_SLUGS.ANALYTICS_INSIGHT],
    requiredPermissions: ["analytics.read"],
    supportedAgents: [BUILTIN_AGENT_SLUGS.ANALYTICS],
  },
  {
    id: "capability.notifications",
    slug: "notifications",
    name: "Notifications Capability",
    description: "Staff and customer notifications.",
    module: PLATFORM_MODULES.NOTIFICATIONS,
    toolIds: [PLATFORM_TOOL_IDS.NOTIFICATION],
    skillIds: [PLATFORM_SKILL_SLUGS.NOTIFY_STAFF],
    requiredPermissions: ["notifications.send"],
    supportedAgents: [BUILTIN_AGENT_SLUGS.STAFF, BUILTIN_AGENT_SLUGS.OPERATIONS],
  },
];

const capabilities = new Map<string, PlatformCapabilityDefinition>();

function seedCapabilities(): void {
  for (const capability of BUILTIN_CAPABILITIES) {
    capabilities.set(capability.id, capability);
  }
}

seedCapabilities();

/** Maps business modules to tools and skills available to AI agents. */
export class CapabilityRegistry {
  register(capability: PlatformCapabilityDefinition): void {
    capabilities.set(capability.id, capability);
  }

  get(id: string): PlatformCapabilityDefinition | undefined {
    return capabilities.get(id);
  }

  list(): PlatformCapabilityDefinition[] {
    return Array.from(capabilities.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }

  listForModule(module: string): PlatformCapabilityDefinition[] {
    return this.list().filter((capability) => capability.module === module);
  }

  listForAgent(agentSlug: string): PlatformCapabilityDefinition[] {
    return this.list().filter((capability) => capability.supportedAgents.includes(agentSlug));
  }
}

export const capabilityRegistry = new CapabilityRegistry();

export function listCapabilities(): PlatformCapabilityDefinition[] {
  return capabilityRegistry.list();
}
