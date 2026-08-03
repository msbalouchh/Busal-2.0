export const BUILTIN_AGENT_SLUGS = {
  BUSINESS_ASSISTANT: "business-assistant",
  SALES: "sales-agent",
  MARKETING: "marketing-agent",
  CUSTOMER_SUPPORT: "customer-support-agent",
  RESERVATION: "reservation-agent",
  INVENTORY: "inventory-agent",
  FINANCE: "finance-agent",
  ANALYTICS: "analytics-agent",
  STAFF: "staff-agent",
  OPERATIONS: "operations-agent",
} as const;

export type BuiltinAgentSlug = (typeof BUILTIN_AGENT_SLUGS)[keyof typeof BUILTIN_AGENT_SLUGS];

export const BUILTIN_AGENT_LABELS: Record<BuiltinAgentSlug, string> = {
  "business-assistant": "Business Assistant",
  "sales-agent": "Sales Agent",
  "marketing-agent": "Marketing Agent",
  "customer-support-agent": "Customer Support Agent",
  "reservation-agent": "Reservation Agent",
  "inventory-agent": "Inventory Agent",
  "finance-agent": "Finance Agent",
  "analytics-agent": "Analytics Agent",
  "staff-agent": "Staff Agent",
  "operations-agent": "Operations Agent",
};

export const ALL_BUILTIN_AGENT_SLUGS = Object.values(BUILTIN_AGENT_SLUGS);
