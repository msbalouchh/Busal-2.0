/**
 * Feature access keys — controls Busal OS module and limit enforcement.
 * Architecture markers for cross-platform access control.
 */
export const BILLING_MODULE_KEYS = {
  DASHBOARD: "dashboard",
  MENU: "menu",
  ORDERS: "orders",
  POS: "pos",
  KITCHEN: "kitchen",
  RESERVATIONS: "reservations",
  TABLE_MANAGEMENT: "table_management",
  INVENTORY: "inventory",
  STAFF: "staff",
  CRM: "crm",
  FINANCE: "finance",
  ANALYTICS: "analytics",
  MARKETING: "marketing",
  AI_ASSISTANT: "ai_assistant",
  DEVELOPER_APIS: "developer_apis",
} as const;

export type BillingModuleKey = (typeof BILLING_MODULE_KEYS)[keyof typeof BILLING_MODULE_KEYS];

export const BILLING_AI_FEATURE_KEYS = {
  CHAT: "ai.chat",
  RECOMMENDATIONS: "ai.recommendations",
  FORECASTING: "ai.forecasting",
  AUTOMATION: "ai.automation",
  ANALYTICS_INSIGHTS: "ai.analytics_insights",
  CUSTOM_AGENTS: "ai.custom_agents",
} as const;

export type BillingAiFeatureKey =
  (typeof BILLING_AI_FEATURE_KEYS)[keyof typeof BILLING_AI_FEATURE_KEYS];

/** Standard usage limit keys on every plan. */
export const FEATURE_LIMIT_KEYS = {
  MAX_STAFF: "max_staff",
  MAX_BRANCHES: "max_branches",
  MAX_MENU_ITEMS: "max_menu_items",
  MAX_TABLES: "max_tables",
  MAX_RESERVATIONS: "max_reservations",
  MAX_ORDERS: "max_orders",
  MAX_STORAGE_MB: "max_storage_mb",
  MAX_AI_CREDITS: "max_ai_credits",
  MAX_API_CALLS: "max_api_calls",
  MAX_INTEGRATIONS: "max_integrations",
} as const;

export type FeatureLimitKey = (typeof FEATURE_LIMIT_KEYS)[keyof typeof FEATURE_LIMIT_KEYS];

export const FEATURE_LIMIT_LABELS: Record<FeatureLimitKey, string> = {
  max_staff: "Maximum Staff",
  max_branches: "Maximum Branches",
  max_menu_items: "Maximum Menu Items",
  max_tables: "Maximum Tables",
  max_reservations: "Maximum Reservations",
  max_orders: "Maximum Orders",
  max_storage_mb: "Maximum Storage (MB)",
  max_ai_credits: "Maximum AI Credits",
  max_api_calls: "Maximum API Calls",
  max_integrations: "Maximum Integrations",
};

/** Unlimited sentinel value for enterprise plans. */
export const UNLIMITED_LIMIT = -1;
