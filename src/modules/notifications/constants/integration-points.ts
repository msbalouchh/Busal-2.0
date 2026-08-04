/**
 * Future integration points for the Enterprise Notification Center.
 * Architecture markers only — no runtime wiring.
 */
export const NOTIFICATION_INTEGRATION_POINTS = {
  prisma: "prisma",
  supabase: "supabase",
  aiCore: "ai-core",
  aiToolsPlatform: "ai-tools-platform",
  rbac: "rbac",
  authentication: "authentication",
  tenantFoundation: "tenant-foundation",
  workspace: "workspace",
  businessProvisioning: "business-provisioning",
  crm: "crm",
  orders: "orders",
  reservations: "reservations",
  kitchen: "kitchen",
  pos: "pos",
  inventory: "inventory",
  staff: "staff",
  billing: "billing",
  analytics: "analytics",
  developerApis: "developer-apis",
  sendgrid: "sendgrid",
  twilio: "twilio",
  firebase: "firebase",
  slack: "slack",
} as const;

export type NotificationIntegrationPoint =
  (typeof NOTIFICATION_INTEGRATION_POINTS)[keyof typeof NOTIFICATION_INTEGRATION_POINTS];
