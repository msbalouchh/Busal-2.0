/** Architecture route markers for the Analytics platform. */
export const ANALYTICS_PLATFORM_ROUTES = {
  overview: "/dashboard/reporting",
  dashboards: "/dashboard/reporting",
  reports: "/app/restaurant/analytics/reports",
  kpis: "/dashboard/reporting/sales",
  forecasts: "/dashboard/reporting/financial",
  alerts: "/dashboard/reporting/orders",
  benchmarks: "/dashboard/reporting/products",
} as const;

export const ANALYTICS_PLATFORM_NAV_ITEMS = [
  { label: "Overview", href: ANALYTICS_PLATFORM_ROUTES.overview },
  { label: "Dashboards", href: ANALYTICS_PLATFORM_ROUTES.dashboards },
  { label: "Reports", href: ANALYTICS_PLATFORM_ROUTES.reports },
  { label: "KPIs", href: ANALYTICS_PLATFORM_ROUTES.kpis },
  { label: "Forecasts", href: ANALYTICS_PLATFORM_ROUTES.forecasts },
  { label: "Alerts", href: ANALYTICS_PLATFORM_ROUTES.alerts },
  { label: "Benchmarks", href: ANALYTICS_PLATFORM_ROUTES.benchmarks },
] as const;
