/** Architecture route markers for the Notification Center platform. */
export const NOTIFICATION_PLATFORM_ROUTES = {
  overview: "/dashboard/notifications",
  inbox: "/dashboard/notifications/inbox",
  templates: "/dashboard/notifications/templates",
  preferences: "/dashboard/notifications/preferences",
  rules: "/dashboard/notifications/rules",
  queue: "/dashboard/notifications/deliveries",
  history: "/dashboard/notifications/audit",
  analytics: "/dashboard/notifications",
} as const;

export const NOTIFICATION_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: NOTIFICATION_PLATFORM_ROUTES.overview },
  { label: "Inbox", href: NOTIFICATION_PLATFORM_ROUTES.inbox },
  { label: "Templates", href: NOTIFICATION_PLATFORM_ROUTES.templates },
  { label: "Preferences", href: NOTIFICATION_PLATFORM_ROUTES.preferences },
  { label: "Rules", href: NOTIFICATION_PLATFORM_ROUTES.rules },
  { label: "Queue", href: NOTIFICATION_PLATFORM_ROUTES.queue },
  { label: "History", href: NOTIFICATION_PLATFORM_ROUTES.history },
  { label: "Analytics", href: NOTIFICATION_PLATFORM_ROUTES.analytics },
] as const;
