import "server-only";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { hasPermission } from "@/modules/authorization/services/authorization.service";
import {
  ANALYTICS_SECTIONS,
  CONTROL_CENTER_ANALYTICS_PAGE_SIZE,
} from "@/modules/control-center/analytics/constants/control-center-analytics";
import {
  aggregatePlatformMetrics,
  buildAnalyticsDateWindow,
  computeGrowthPct,
  loadAiUsageTrend,
  loadApiUsageTrend,
  loadBusinessGrowthTrend,
  loadIntegrationActivity,
  loadMarketplaceInstallTrend,
  loadOpenAlertsCount,
  loadOrderTrend,
  loadPlanDistribution,
  loadRecentSecurityEvents,
  loadRevenueTrend,
  loadSupportVolumeTrend,
  loadTopBusinesses,
} from "@/modules/control-center/analytics/repository/control-center-analytics.repository";
import type {
  ControlCenterAnalyticsKpi,
  ControlCenterAnalyticsQuery,
  ControlCenterAnalyticsRange,
  ControlCenterAnalyticsSection,
  ControlCenterAnalyticsTable,
  ControlCenterPlatformAnalyticsBundle,
  ControlCenterAnalyticsPermissions,
} from "@/modules/control-center/analytics/types/control-center-analytics-types";
import type { ControlCenterOperatorContext } from "@/modules/control-center/types/control-center-types";

function buildPermissions(operator: ControlCenterOperatorContext): ControlCenterAnalyticsPermissions {
  const permissions = new Set(operator.permissions);
  const hasAdmin = permissions.has(PERMISSION_CODES.CONTROL_CENTER_ADMIN);
  const canView =
    hasAdmin ||
    hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_ANALYTICS) ||
    hasPermission(permissions, PERMISSION_CODES.CONTROL_CENTER_VIEW);

  return {
    canView,
    canExport: canView,
  };
}

function makeKpi(
  id: string,
  label: string,
  value: number,
  previousValue: number | null,
  format: ControlCenterAnalyticsKpi["format"] = "number",
): ControlCenterAnalyticsKpi {
  return {
    id,
    label,
    value,
    previousValue,
    growthPct: previousValue === null ? null : computeGrowthPct(value, previousValue),
    format,
  };
}

function paginateRows<T>(
  rows: T[],
  page: number,
  pageSize: number,
): { rows: T[]; total: number; totalPages: number } {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    rows: rows.slice(start, start + pageSize),
    total,
    totalPages,
  };
}

function buildSections(
  metrics: Awaited<ReturnType<typeof aggregatePlatformMetrics>>,
  trends: {
    businessGrowth: Awaited<ReturnType<typeof loadBusinessGrowthTrend>>;
    revenue: Awaited<ReturnType<typeof loadRevenueTrend>>;
    aiUsage: Awaited<ReturnType<typeof loadAiUsageTrend>>;
    apiUsage: Awaited<ReturnType<typeof loadApiUsageTrend>>;
    orders: Awaited<ReturnType<typeof loadOrderTrend>>;
    support: Awaited<ReturnType<typeof loadSupportVolumeTrend>>;
    marketplace: Awaited<ReturnType<typeof loadMarketplaceInstallTrend>>;
  },
  tables: {
    topBusinesses: Awaited<ReturnType<typeof loadTopBusinesses>>;
    planDistribution: Awaited<ReturnType<typeof loadPlanDistribution>>;
    securityEvents: Awaited<ReturnType<typeof loadRecentSecurityEvents>>;
    integrationActivity: Awaited<ReturnType<typeof loadIntegrationActivity>>;
    openAlerts: number;
  },
  query: ControlCenterAnalyticsQuery,
  comparePrevious: boolean,
): ControlCenterAnalyticsSection[] {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? CONTROL_CENTER_ANALYTICS_PAGE_SIZE;
  const previous = comparePrevious;

  const businessTable = paginateRows(tables.topBusinesses, page, pageSize);
  const planTable = paginateRows(tables.planDistribution, 1, pageSize);
  const securityTable = paginateRows(tables.securityEvents, 1, pageSize);
  const integrationTable = paginateRows(tables.integrationActivity, 1, pageSize);

  const sectionMap: Record<string, ControlCenterAnalyticsSection> = {
    business: {
      id: "business",
      title: "Business Analytics",
      description: "Businesses, tenants, workspaces, and CRM activity.",
      kpis: [
        makeKpi("businesses", "Total Businesses", metrics.totalBusinesses, null),
        makeKpi("tenants", "Total Tenants", metrics.totalTenants, null),
        makeKpi("workspaces", "Workspaces", metrics.totalWorkspaces, null),
        makeKpi("active-tenants", "Active Tenants", metrics.activeTenants, null),
        makeKpi("users", "Platform Users", metrics.totalUsers, null),
        makeKpi("customers", "CRM Customers", metrics.totalCustomers, null),
        makeKpi(
          "new-businesses",
          "New Businesses",
          metrics.newBusinesses,
          previous ? metrics.previousNewBusinesses : null,
        ),
      ],
      trends: [
        { id: "business-growth", label: "Business signups", points: trends.businessGrowth },
        { id: "orders", label: "Orders", points: trends.orders },
      ],
      tables: [
        {
          id: "top-businesses",
          title: "Recent Businesses",
          rows: businessTable.rows.map((row) => ({
            id: row.id,
            primary: row.name,
            secondary: row.email,
            metric: `${row.plan} · ${row.health}`,
            metricLabel: "Plan · Health",
          })),
          total: businessTable.total,
          page,
          pageSize,
          totalPages: businessTable.totalPages,
        },
      ],
    },
    financial: {
      id: "financial",
      title: "Financial Analytics",
      description: "Revenue, invoices, payments, and subscriptions.",
      kpis: [
        makeKpi("mrr", "Monthly Recurring Revenue", metrics.mrrPence, null, "currency"),
        makeKpi("revenue", "Period Revenue", metrics.revenuePence, null, "currency"),
        makeKpi("invoices", "Invoices Issued", metrics.totalInvoices, null),
        makeKpi(
          "payments",
          "Payments",
          metrics.totalPayments,
          previous ? metrics.previousPayments : null,
        ),
      ],
      trends: [{ id: "revenue-trend", label: "Revenue", points: trends.revenue }],
      tables: [
        {
          id: "plan-revenue",
          title: "Plan Distribution",
          rows: planTable.rows.map((row) => ({
            id: row.plan,
            primary: row.plan,
            secondary: `${row.count} tenants`,
            metric: `£${(row.mrrPence / 100).toFixed(2)} MRR`,
            metricLabel: "MRR",
          })),
          total: planTable.total,
          page: 1,
          pageSize,
          totalPages: planTable.totalPages,
        },
      ],
    },
    ai: {
      id: "ai",
      title: "AI Analytics",
      description: "Token usage, tool executions, and agent activity.",
      kpis: [
        makeKpi(
          "ai-tokens",
          "AI Tokens (period)",
          metrics.aiTokens,
          previous ? metrics.previousAiTokens : null,
        ),
        makeKpi("monthly-ai-tokens", "Monthly AI Tokens", metrics.monthlyAiTokens, null),
      ],
      trends: [{ id: "ai-usage", label: "AI token usage", points: trends.aiUsage }],
      tables: [],
    },
    infrastructure: {
      id: "infrastructure",
      title: "Infrastructure Analytics",
      description: "API usage, storage, integrations, and performance.",
      kpis: [
        makeKpi(
          "api-requests",
          "API Requests",
          metrics.apiRequests,
          previous ? metrics.previousApiRequests : null,
        ),
        makeKpi("storage", "Storage Used", metrics.storageBytes, null, "bytes"),
        makeKpi("integrations", "Active Integrations", metrics.totalIntegrations, null),
        makeKpi("open-alerts", "Open Alerts", tables.openAlerts, null),
      ],
      trends: [{ id: "api-usage", label: "API requests", points: trends.apiUsage }],
      tables: [
        {
          id: "integration-activity",
          title: "Recent Integration Activity",
          rows: integrationTable.rows.map((row) => ({
            id: row.id,
            primary: row.connection?.displayName ?? "Unknown connection",
            secondary: row.message,
            metric: row.level,
            metricLabel: "Level",
          })),
          total: integrationTable.total,
          page: 1,
          pageSize,
          totalPages: integrationTable.totalPages,
        },
      ],
    },
    security: {
      id: "security",
      title: "Security Analytics",
      description: "Sessions, audit events, and security alerts.",
      kpis: [
        makeKpi("security-events", "Security Events", metrics.securityEvents, null),
        makeKpi("active-sessions", "Active Sessions", metrics.activeSessions, null),
      ],
      trends: [],
      tables: [
        {
          id: "security-events",
          title: "Recent Security Events",
          rows: securityTable.rows.map((row) => ({
            id: row.id,
            primary: row.eventType,
            secondary: row.user?.email ?? "System",
            metric: row.createdAt.toISOString().slice(0, 16).replace("T", " "),
            metricLabel: "When",
          })),
          total: securityTable.total,
          page: 1,
          pageSize,
          totalPages: securityTable.totalPages,
        },
      ],
    },
    support: {
      id: "support",
      title: "Support Analytics",
      description: "Support conversations, incidents, and notifications.",
      kpis: [
        makeKpi("open-tickets", "Open Support Tickets", metrics.openSupportTickets, null),
        makeKpi("notifications", "Notifications Sent", metrics.totalNotifications, null),
      ],
      trends: [{ id: "support-volume", label: "Support volume", points: trends.support }],
      tables: [],
    },
    growth: {
      id: "growth",
      title: "Growth Analytics",
      description: "Signups, expansion, and marketplace growth.",
      kpis: [
        makeKpi(
          "new-tenants",
          "New Tenants",
          metrics.newTenants,
          previous ? metrics.previousNewTenants : null,
        ),
        makeKpi(
          "new-businesses",
          "New Businesses",
          metrics.newBusinesses,
          previous ? metrics.previousNewBusinesses : null,
        ),
      ],
      trends: [
        { id: "business-growth", label: "Business signups", points: trends.businessGrowth },
        { id: "marketplace", label: "Marketplace installs", points: trends.marketplace },
      ],
      tables: [],
    },
    commercial: {
      id: "commercial",
      title: "Commercial Analytics",
      description: "Plan distribution, MRR, and commercial performance.",
      kpis: [
        makeKpi("mrr", "MRR", metrics.mrrPence, null, "currency"),
        makeKpi("revenue", "Period Revenue", metrics.revenuePence, null, "currency"),
        makeKpi("orders", "Orders", metrics.totalOrders, previous ? metrics.previousOrders : null),
      ],
      trends: [{ id: "revenue-trend", label: "Revenue", points: trends.revenue }],
      tables: [
        {
          id: "plan-distribution",
          title: "Subscription Plans",
          rows: planTable.rows.map((row) => ({
            id: row.plan,
            primary: row.plan,
            secondary: `${row.count} tenants`,
            metric: `£${(row.mrrPence / 100).toFixed(2)}`,
            metricLabel: "MRR",
          })),
          total: planTable.total,
          page: 1,
          pageSize,
          totalPages: planTable.totalPages,
        },
      ],
    },
    health: {
      id: "health",
      title: "Platform Health",
      description: "Tenant health, SLA performance, and system status.",
      kpis: [
        makeKpi("healthy", "Healthy Tenants", metrics.healthyTenants, null),
        makeKpi("degraded", "Degraded Tenants", metrics.degradedTenants, null),
        makeKpi("critical", "Critical Tenants", metrics.criticalTenants, null),
        makeKpi("open-alerts", "Open Alerts", tables.openAlerts, null),
      ],
      trends: [{ id: "api-usage", label: "API performance proxy", points: trends.apiUsage }],
      tables: [],
    },
  };

  const selectedSection = query.section?.trim();
  if (selectedSection && sectionMap[selectedSection]) {
    return [sectionMap[selectedSection]];
  }

  return ANALYTICS_SECTIONS.map((section) => sectionMap[section.id]!);
}

export async function getControlCenterPlatformAnalyticsBundle(
  operator: ControlCenterOperatorContext,
  query: ControlCenterAnalyticsQuery = {},
): Promise<ControlCenterPlatformAnalyticsBundle> {
  const permissions = buildPermissions(operator);
  const rangeDays = (query.rangeDays ?? 30) as ControlCenterAnalyticsRange;
  const comparePrevious = query.comparePrevious ?? true;
  const window = buildAnalyticsDateWindow(rangeDays);

  const [
    metrics,
    businessGrowth,
    revenue,
    aiUsage,
    apiUsage,
    orders,
    support,
    marketplace,
    topBusinesses,
    planDistribution,
    securityEvents,
    integrationActivity,
    openAlerts,
  ] = await Promise.all([
    aggregatePlatformMetrics(window),
    loadBusinessGrowthTrend(rangeDays),
    loadRevenueTrend(rangeDays),
    loadAiUsageTrend(rangeDays),
    loadApiUsageTrend(rangeDays),
    loadOrderTrend(rangeDays),
    loadSupportVolumeTrend(rangeDays),
    loadMarketplaceInstallTrend(rangeDays),
    loadTopBusinesses(CONTROL_CENTER_ANALYTICS_PAGE_SIZE * 3, query.search),
    loadPlanDistribution(),
    loadRecentSecurityEvents(20),
    loadIntegrationActivity(20),
    loadOpenAlertsCount(),
  ]);

  const healthScore =
    metrics.totalTenants === 0
      ? 100
      : Math.round((metrics.healthyTenants / metrics.totalTenants) * 100);

  const executiveKpis: ControlCenterAnalyticsKpi[] = [
    makeKpi("businesses", "Businesses", metrics.totalBusinesses, null),
    makeKpi("active-tenants", "Active Tenants", metrics.activeTenants, null),
    makeKpi("mrr", "MRR", metrics.mrrPence, null, "currency"),
    makeKpi("revenue", "Period Revenue", metrics.revenuePence, null, "currency"),
    makeKpi(
      "ai-tokens",
      "AI Tokens",
      metrics.aiTokens,
      comparePrevious ? metrics.previousAiTokens : null,
    ),
    makeKpi(
      "api-requests",
      "API Requests",
      metrics.apiRequests,
      comparePrevious ? metrics.previousApiRequests : null,
    ),
    makeKpi("support", "Open Tickets", metrics.openSupportTickets, null),
    makeKpi("health-score", "Health Score", healthScore, null, "percent"),
  ];

  const sections = buildSections(
    metrics,
    { businessGrowth, revenue, aiUsage, apiUsage, orders, support, marketplace },
    { topBusinesses, planDistribution, securityEvents, integrationActivity, openAlerts },
    query,
    comparePrevious,
  );

  return {
    executiveKpis,
    sections,
    permissions,
    rangeDays,
    comparePrevious,
    refreshedAt: new Date().toISOString(),
  };
}

export async function exportControlCenterPlatformAnalytics(
  operator: ControlCenterOperatorContext,
  query: ControlCenterAnalyticsQuery = {},
  format: "csv" | "json" = "json",
): Promise<{ filename: string; content: string; mimeType: string }> {
  const bundle = await getControlCenterPlatformAnalyticsBundle(operator, query);

  if (format === "json") {
    return {
      filename: `platform-analytics-${bundle.rangeDays}d.json`,
      content: JSON.stringify(bundle, null, 2),
      mimeType: "application/json",
    };
  }

  const rows: string[] = [
    "Section,KPI,Value,Previous,Growth %",
    ...bundle.executiveKpis.map(
      (kpi) =>
        `Executive,${kpi.label},${kpi.value},${kpi.previousValue ?? ""},${kpi.growthPct ?? ""}`,
    ),
    ...bundle.sections.flatMap((section) =>
      section.kpis.map(
        (kpi) =>
          `${section.title},${kpi.label},${kpi.value},${kpi.previousValue ?? ""},${kpi.growthPct ?? ""}`,
      ),
    ),
  ];

  return {
    filename: `platform-analytics-${bundle.rangeDays}d.csv`,
    content: rows.join("\n"),
    mimeType: "text/csv",
  };
}

export type { ControlCenterAnalyticsTable };
