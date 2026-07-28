export const NOTIFICATIONS_ROUTES = {
  overview: "/dashboard/notifications",
  inbox: "/dashboard/notifications/inbox",
  templates: "/dashboard/notifications/templates",
  rules: "/dashboard/notifications/rules",
  channels: "/dashboard/notifications/channels",
  deliveries: "/dashboard/notifications/deliveries",
  preferences: "/dashboard/notifications/preferences",
  audit: "/dashboard/notifications/audit",
} as const;

export const NOTIFICATIONS_NAV_ITEMS = [
  { label: "Overview", href: NOTIFICATIONS_ROUTES.overview },
  { label: "Inbox", href: NOTIFICATIONS_ROUTES.inbox },
  { label: "Templates", href: NOTIFICATIONS_ROUTES.templates },
  { label: "Delivery Rules", href: NOTIFICATIONS_ROUTES.rules },
  { label: "Channels", href: NOTIFICATIONS_ROUTES.channels },
  { label: "Deliveries", href: NOTIFICATIONS_ROUTES.deliveries },
  { label: "Preferences", href: NOTIFICATIONS_ROUTES.preferences },
  { label: "Audit", href: NOTIFICATIONS_ROUTES.audit },
] as const;

export const NOTIFICATION_CHANNELS = [
  "IN_APP",
  "EMAIL",
  "SMS",
  "PUSH",
  "WHATSAPP",
  "WEBHOOK",
  "SLACK",
  "TEAMS",
  "DISCORD",
] as const;

export const NOTIFICATION_CATEGORIES = [
  "ORDERS",
  "RESERVATIONS",
  "INVENTORY",
  "COMMERCIAL",
  "REVENUE",
  "AI",
  "MARKETING",
  "CRM",
  "SUPPORT",
  "SECURITY",
  "SYSTEM",
  "MARKETPLACE",
] as const;

export const NOTIFICATION_DELIVERY_MODES = ["IMMEDIATE", "SCHEDULED", "DIGEST", "RETRY"] as const;

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  enabledChannels: ["IN_APP", "EMAIL"] as const,
  language: "en",
  digestFrequency: "DAILY" as const,
  disabledCategories: [] as string[],
} as const;

export const DEFAULT_DELIVERY_RULE = {
  mode: "IMMEDIATE" as const,
  priority: "NORMAL" as const,
  silent: false,
  businessHoursOnly: false,
  retryCount: 2,
  retryDelayMinutes: 5,
  digestFrequency: "NONE" as const,
} as const;
