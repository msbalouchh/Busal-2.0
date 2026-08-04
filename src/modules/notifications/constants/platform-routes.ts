/** Architecture route markers for the Notification Center platform. */
export const NOTIFICATION_PLATFORM_ROUTES = {
  overview: "/app/notifications",
  inbox: "/app/notifications/inbox",
  templates: "/app/notifications/templates",
  preferences: "/app/notifications/preferences",
  rules: "/app/notifications/rules",
  queue: "/app/notifications/queue",
  history: "/app/notifications/history",
  analytics: "/app/notifications/analytics",
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
