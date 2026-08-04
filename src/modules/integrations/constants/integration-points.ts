/**
 * Future integration points for the Enterprise API & Integration Platform.
 * Architecture markers only — no runtime wiring.
 */
export const INTEGRATION_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  aiCore: "ai-core",
  aiToolsPlatform: "ai-tools-platform",
  rbac: "rbac",
  tenantFoundation: "tenant-foundation",
  workspace: "workspace",
  businessProvisioning: "business-provisioning",
  billing: "billing",
  finance: "finance",
  crm: "crm",
  orders: "orders",
  menu: "menu",
  reservations: "reservations",
  kitchen: "kitchen",
  pos: "pos",
  inventory: "inventory",
  staff: "staff",
  analytics: "analytics",
  notifications: "notifications",
  stripe: "stripe",
  google: "google",
  microsoft: "microsoft",
  meta: "meta",
  twilio: "twilio",
  whatsapp: "whatsapp",
  openai: "openai",
  anthropic: "anthropic",
  slack: "slack",
  zapier: "zapier",
  shopify: "shopify",
  quickbooks: "quickbooks",
  xero: "xero",
  uberEats: "uber-eats",
  deliveroo: "deliveroo",
  justEat: "just-eat",
  customApis: "custom-apis",
} as const;

export type IntegrationIntegrationPoint =
  (typeof INTEGRATION_INTEGRATION_POINTS)[keyof typeof INTEGRATION_INTEGRATION_POINTS];
