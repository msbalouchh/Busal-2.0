export const BUSINESS_MODULE_ROUTES = {
  dashboard: "/app/modules",
  details: (moduleKey: string) => `/app/modules/${moduleKey}`,
} as const;
