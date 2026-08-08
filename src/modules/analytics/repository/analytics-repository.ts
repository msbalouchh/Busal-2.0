import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { AnalyticsTenantScope } from "@/modules/analytics/lib/analytics-scope";
import {
  buildAnalyticsRecord,
  createDashboardRecord,
  createReportRecord,
  createWidgetRecord,
  defaultBranchAnalyticsMeta,
  exportReportToCsv,
  exportReportToExcelCompatibleCsv,
  exportReportToPdfPlaceholder,
  type OperationalAnalyticsData,
  type StoredAnalyticsBranchMeta,
} from "@/modules/analytics/lib/analytics-mappers";
import type {
  Alert,
  AnalyticsRecord,
  AnalyticsSearchQuery,
  AnalyticsSearchResult,
  Dashboard,
  DashboardLayout,
  DashboardWidget,
  DataSource,
  Report,
  ReportTemplate,
  SavedView,
  ScheduledReport,
} from "@/modules/analytics/types/analytics-platform";
import type {
  AnalyticsSearchSchemaInput,
  CreateAlertSchemaInput,
  CreateBenchmarkSchemaInput,
  CreateDashboardLayoutSchemaInput,
  CreateDashboardSchemaInput,
  CreateDataSourceSchemaInput,
  CreateReportSchemaInput,
  CreateReportTemplateSchemaInput,
  CreateSavedViewSchemaInput,
  CreateScheduledReportSchemaInput,
  CreateWidgetSchemaInput,
  ExportReportSchemaInput,
  UpdateDashboardSchemaInput,
  UpdateReportSchemaInput,
  UpdateWidgetSchemaInput,
} from "@/modules/analytics/validation/analytics-schemas";

const DEFAULT_PAGE_SIZE = 25;

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function paginate<T>(items: T[], page: number, pageSize: number): AnalyticsSearchResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

function sortByField<T>(items: T[], sortBy?: string, sortOrder: "asc" | "desc" = "asc"): T[] {
  if (!sortBy) {
    return items;
  }

  return [...items].sort((a, b) => {
    const recordA = a as Record<string, unknown>;
    const recordB = b as Record<string, unknown>;
    const aVal = recordA[sortBy];
    const bVal = recordB[sortBy];
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });
}

/** Prisma-backed analytics repository with tenant scoping. */
export class AnalyticsRepository {
  private async loadBranchMeta(scope: AnalyticsTenantScope): Promise<StoredAnalyticsBranchMeta> {
    const settings = await prisma.branchSettings.findUnique({
      where: { branchId: scope.branchId },
      select: { settings: true },
    });

    const raw = settings?.settings;
    if (raw && typeof raw === "object" && raw !== null && "analyticsOperations" in raw) {
      return (raw as unknown as { analyticsOperations: StoredAnalyticsBranchMeta }).analyticsOperations;
    }

    const defaults = defaultBranchAnalyticsMeta(scope);
    await this.saveBranchMeta(scope, defaults);
    return defaults;
  }

  private async saveBranchMeta(scope: AnalyticsTenantScope, meta: StoredAnalyticsBranchMeta): Promise<void> {
    const existing = await prisma.branchSettings.findUnique({
      where: { branchId: scope.branchId },
      select: { settings: true },
    });

    const settingsObject =
      existing?.settings && typeof existing.settings === "object" && existing.settings !== null
        ? (existing.settings as Record<string, unknown>)
        : {};

    await prisma.branchSettings.upsert({
      where: { branchId: scope.branchId },
      create: {
        branchId: scope.branchId,
        settings: { ...settingsObject, analyticsOperations: meta } as unknown as Prisma.InputJsonValue,
      },
      update: {
        settings: { ...settingsObject, analyticsOperations: meta } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private getPeriodDateRange(): {
    currentStart: Date;
    currentEnd: Date;
    previousStart: Date;
    previousEnd: Date;
  } {
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(-1);
    const previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth(), 1);

    return { currentStart, currentEnd, previousStart, previousEnd };
  }

  private async loadOperationalData(scope: AnalyticsTenantScope): Promise<OperationalAnalyticsData> {
    const { currentStart, currentEnd, previousStart, previousEnd } = this.getPeriodDateRange();
    const branchFilter = { businessId: scope.businessId, branchId: scope.branchId };

    const [
      currentOrders,
      previousOrders,
      currentPayments,
      previousPayments,
      currentReservations,
      previousReservations,
      customerCount,
      newCustomers,
      returningCustomers,
      customerSpendAggregate,
      inventorySkuCount,
      inventoryItemsForLowStock,
      staffCount,
      menuItemCount,
    ] = await Promise.all([
      prisma.restaurantOrder.findMany({
        where: { ...branchFilter, placedAt: { gte: currentStart, lte: currentEnd } },
        orderBy: { placedAt: "desc" },
        take: 1000,
      }),
      prisma.restaurantOrder.findMany({
        where: { ...branchFilter, placedAt: { gte: previousStart, lte: previousEnd } },
        orderBy: { placedAt: "desc" },
        take: 1000,
      }),
      prisma.orderPayment.findMany({
        where: { ...branchFilter, status: "PAID", paidAt: { gte: currentStart, lte: currentEnd } },
        take: 1000,
      }),
      prisma.orderPayment.findMany({
        where: { ...branchFilter, status: "PAID", paidAt: { gte: previousStart, lte: previousEnd } },
        take: 1000,
      }),
      prisma.reservation.findMany({
        where: { ...branchFilter, reservationDate: { gte: currentStart, lte: currentEnd } },
        take: 1000,
      }),
      prisma.reservation.findMany({
        where: { ...branchFilter, reservationDate: { gte: previousStart, lte: previousEnd } },
        take: 1000,
      }),
      prisma.customer.count({ where: { businessId: scope.businessId, deletedAt: null } }),
      prisma.customer.count({
        where: { businessId: scope.businessId, deletedAt: null, createdAt: { gte: currentStart, lte: currentEnd } },
      }),
      prisma.customer.count({
        where: { businessId: scope.businessId, deletedAt: null, totalOrders: { gt: 1 } },
      }),
      prisma.customer.aggregate({
        where: { businessId: scope.businessId, deletedAt: null },
        _avg: { totalSpend: true },
      }),
      prisma.inventoryItem.count({ where: { ...branchFilter, deletedAt: null } }),
      prisma.inventoryItem.findMany({
        where: { ...branchFilter, deletedAt: null, trackStock: true },
        select: { currentStock: true, minimumStock: true },
      }),
      prisma.staff.count({
        where: {
          businessId: scope.businessId,
          branchId: scope.branchId,
          isActive: true,
          employmentStatus: "ACTIVE",
        },
      }),
      prisma.menuItem.count({ where: { businessId: scope.businessId, isAvailable: true } }),
    ]);

    const lowStockCount = inventoryItemsForLowStock.filter(
      (item) => Number(item.currentStock) <= Number(item.minimumStock),
    ).length;

    return {
      currentOrders,
      previousOrders,
      currentPayments,
      previousPayments,
      currentReservations,
      previousReservations,
      customerCount,
      newCustomers,
      returningCustomers,
      averageLifetimeValueCents: Math.round(Number(customerSpendAggregate._avg.totalSpend ?? 0) * 100),
      inventorySkuCount,
      lowStockCount,
      staffCount,
      menuItemCount,
    };
  }

  async getRecord(scope: AnalyticsTenantScope): Promise<AnalyticsRecord> {
    const [meta, operational] = await Promise.all([this.loadBranchMeta(scope), this.loadOperationalData(scope)]);
    return buildAnalyticsRecord(scope, meta, operational);
  }

  async searchDashboards(
    scope: AnalyticsTenantScope,
    query: AnalyticsSearchQuery | AnalyticsSearchSchemaInput,
  ): Promise<AnalyticsSearchResult<Dashboard>> {
    const record = await this.getRecord(scope);
    let results = query.includeDeleted ? [...(await this.loadBranchMeta(scope)).dashboards] : [...record.dashboards];

    if (query.dashboardType) {
      results = results.filter((dashboard) => dashboard.dashboardType === query.dashboardType);
    }
    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter(
        (dashboard) =>
          dashboard.name.toLowerCase().includes(term) || dashboard.description.toLowerCase().includes(term),
      );
    }

    results = sortByField(results, query.sortBy, query.sortOrder);
    const page = query.page ?? 1;
    const pageSize = query.limit ?? query.pageSize ?? DEFAULT_PAGE_SIZE;
    return paginate(results, page, pageSize);
  }

  async findDashboardById(scope: AnalyticsTenantScope, dashboardId: string): Promise<Dashboard | null> {
    const meta = await this.loadBranchMeta(scope);
    return meta.dashboards.find((dashboard) => dashboard.id === dashboardId && dashboard.deletedAt === null) ?? null;
  }

  async createDashboard(scope: AnalyticsTenantScope, input: CreateDashboardSchemaInput): Promise<Dashboard> {
    const meta = await this.loadBranchMeta(scope);
    const dashboard = createDashboardRecord(scope, input);
    if (dashboard.isDefault) {
      meta.dashboards = meta.dashboards.map((item) => ({ ...item, isDefault: false }));
    }
    meta.dashboards.push(dashboard);
    await this.saveBranchMeta(scope, meta);
    return dashboard;
  }

  async updateDashboard(scope: AnalyticsTenantScope, input: UpdateDashboardSchemaInput): Promise<Dashboard | null> {
    const meta = await this.loadBranchMeta(scope);
    const index = meta.dashboards.findIndex((dashboard) => dashboard.id === input.dashboardId);
    if (index === -1) {
      return null;
    }

    const existing = meta.dashboards[index];
    if (!existing) {
      return null;
    }

    const updated: Dashboard = {
      ...existing,
      name: input.name ?? existing.name,
      dashboardType: input.dashboardType ?? existing.dashboardType,
      description: input.description ?? existing.description,
      branchIds: input.branchIds ?? existing.branchIds,
      isDefault: input.isDefault ?? existing.isDefault,
      updatedAt: new Date().toISOString(),
    };

    if (updated.isDefault) {
      meta.dashboards = meta.dashboards.map((item) => ({ ...item, isDefault: item.id === updated.id }));
    }

    meta.dashboards[index] = updated;
    await this.saveBranchMeta(scope, meta);
    return updated;
  }

  async deleteDashboard(scope: AnalyticsTenantScope, dashboardId: string): Promise<boolean> {
    const meta = await this.loadBranchMeta(scope);
    const dashboard = meta.dashboards.find((item) => item.id === dashboardId);
    if (!dashboard) {
      return false;
    }
    dashboard.deletedAt = new Date().toISOString();
    dashboard.updatedAt = dashboard.deletedAt;
    await this.saveBranchMeta(scope, meta);
    return true;
  }

  async restoreDashboard(scope: AnalyticsTenantScope, dashboardId: string): Promise<boolean> {
    const meta = await this.loadBranchMeta(scope);
    const dashboard = meta.dashboards.find((item) => item.id === dashboardId);
    if (!dashboard) {
      return false;
    }
    dashboard.deletedAt = null;
    dashboard.updatedAt = new Date().toISOString();
    await this.saveBranchMeta(scope, meta);
    return true;
  }

  async createWidget(scope: AnalyticsTenantScope, input: CreateWidgetSchemaInput): Promise<DashboardWidget> {
    const meta = await this.loadBranchMeta(scope);
    const widget = createWidgetRecord(scope, {
      dashboardId: input.dashboardId,
      widgetType: input.widgetType,
      title: input.title,
      metricId: input.metricId ?? null,
      kpiId: input.kpiId ?? null,
      chartId: input.chartId ?? null,
      reportId: input.reportId ?? null,
      positionX: input.positionX,
      positionY: input.positionY,
      width: input.width,
      height: input.height,
      refreshIntervalSec: input.refreshIntervalSec,
      moduleSource: input.moduleSource ?? null,
    });

    meta.widgets.push(widget);
    const dashboard = meta.dashboards.find((item) => item.id === input.dashboardId);
    if (dashboard) {
      dashboard.widgetIds.push(widget.id);
      dashboard.updatedAt = new Date().toISOString();
    }

    await this.saveBranchMeta(scope, meta);
    return widget;
  }

  async updateWidget(scope: AnalyticsTenantScope, input: UpdateWidgetSchemaInput): Promise<DashboardWidget | null> {
    const meta = await this.loadBranchMeta(scope);
    const index = meta.widgets.findIndex((widget) => widget.id === input.widgetId);
    if (index === -1) {
      return null;
    }
    const existingWidget = meta.widgets[index];
    if (!existingWidget) {
      return null;
    }

    meta.widgets[index] = {
      ...existingWidget,
      dashboardId: input.dashboardId ?? existingWidget.dashboardId,
      widgetType: input.widgetType ?? existingWidget.widgetType,
      title: input.title ?? existingWidget.title,
      metricId: input.metricId ?? existingWidget.metricId,
      kpiId: input.kpiId ?? existingWidget.kpiId,
      chartId: input.chartId ?? existingWidget.chartId,
      reportId: input.reportId ?? existingWidget.reportId,
      positionX: input.positionX ?? existingWidget.positionX,
      positionY: input.positionY ?? existingWidget.positionY,
      width: input.width ?? existingWidget.width,
      height: input.height ?? existingWidget.height,
      refreshIntervalSec: input.refreshIntervalSec ?? existingWidget.refreshIntervalSec,
      moduleSource: input.moduleSource ?? existingWidget.moduleSource,
    };
    await this.saveBranchMeta(scope, meta);
    return meta.widgets[index];
  }

  async deleteWidget(scope: AnalyticsTenantScope, widgetId: string): Promise<boolean> {
    const meta = await this.loadBranchMeta(scope);
    const before = meta.widgets.length;
    meta.widgets = meta.widgets.filter((widget) => widget.id !== widgetId);
    meta.dashboards = meta.dashboards.map((dashboard) => ({
      ...dashboard,
      widgetIds: dashboard.widgetIds.filter((id) => id !== widgetId),
    }));
    await this.saveBranchMeta(scope, meta);
    return meta.widgets.length < before;
  }

  async searchReports(
    scope: AnalyticsTenantScope,
    query: AnalyticsSearchQuery | AnalyticsSearchSchemaInput,
  ): Promise<AnalyticsSearchResult<Report>> {
    const record = await this.getRecord(scope);
    let results = [...record.reports];
    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter(
        (report) => report.name.toLowerCase().includes(term) || report.description.toLowerCase().includes(term),
      );
    }
    if (query.moduleSource) {
      results = results.filter((report) => report.moduleSources.includes(query.moduleSource!));
    }
    results = sortByField(results, query.sortBy ?? "createdAt", query.sortOrder ?? "desc");
    return paginate(results, query.page ?? 1, query.limit ?? query.pageSize ?? DEFAULT_PAGE_SIZE);
  }

  async createReport(scope: AnalyticsTenantScope, input: CreateReportSchemaInput): Promise<Report> {
    const meta = await this.loadBranchMeta(scope);
    const report = createReportRecord(scope, input);
    meta.reports.push(report);
    await this.saveBranchMeta(scope, meta);
    return report;
  }

  async updateReport(scope: AnalyticsTenantScope, input: UpdateReportSchemaInput): Promise<Report | null> {
    const meta = await this.loadBranchMeta(scope);
    const index = meta.reports.findIndex((report) => report.id === input.reportId);
    if (index === -1) {
      return null;
    }
    const existingReport = meta.reports[index];
    if (!existingReport) {
      return null;
    }

    meta.reports[index] = {
      ...existingReport,
      name: input.name ?? existingReport.name,
      description: input.description ?? existingReport.description,
      moduleSources: input.moduleSources ?? existingReport.moduleSources,
      branchIds: input.branchIds ?? existingReport.branchIds,
      periodStart: input.periodStart ?? existingReport.periodStart,
      periodEnd: input.periodEnd ?? existingReport.periodEnd,
      chartIds: input.chartIds ?? existingReport.chartIds,
      kpiIds: input.kpiIds ?? existingReport.kpiIds,
      updatedAt: new Date().toISOString(),
    };
    await this.saveBranchMeta(scope, meta);
    return meta.reports[index];
  }

  async deleteReport(scope: AnalyticsTenantScope, reportId: string): Promise<boolean> {
    const meta = await this.loadBranchMeta(scope);
    const report = meta.reports.find((item) => item.id === reportId);
    if (!report) {
      return false;
    }
    report.deletedAt = new Date().toISOString();
    report.updatedAt = report.deletedAt;
    await this.saveBranchMeta(scope, meta);
    return true;
  }

  async restoreReport(scope: AnalyticsTenantScope, reportId: string): Promise<boolean> {
    const meta = await this.loadBranchMeta(scope);
    const report = meta.reports.find((item) => item.id === reportId);
    if (!report) {
      return false;
    }
    report.deletedAt = null;
    report.updatedAt = new Date().toISOString();
    await this.saveBranchMeta(scope, meta);
    return true;
  }

  async createReportTemplate(scope: AnalyticsTenantScope, input: CreateReportTemplateSchemaInput): Promise<ReportTemplate> {
    const meta = await this.loadBranchMeta(scope);
    const now = new Date().toISOString();
    const template: ReportTemplate = {
      id: createId("tmpl"),
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      name: input.name,
      description: input.description,
      reportType: input.reportType,
      moduleSources: input.moduleSources,
      defaultChartIds: input.defaultChartIds,
      defaultKpiIds: input.defaultKpiIds,
      isSystem: false,
      createdByUserId: scope.userId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    meta.reportTemplates.push(template);
    await this.saveBranchMeta(scope, meta);
    return template;
  }

  async createScheduledReport(scope: AnalyticsTenantScope, input: CreateScheduledReportSchemaInput): Promise<ScheduledReport> {
    const meta = await this.loadBranchMeta(scope);
    const scheduled: ScheduledReport = {
      id: createId("sched"),
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      reportId: input.reportId,
      name: input.name,
      frequency: input.frequency,
      recipientEmails: input.recipientEmails,
      nextRunAt: input.nextRunAt,
      lastRunAt: null,
      isActive: input.isActive,
      createdAt: new Date().toISOString(),
    };
    meta.scheduledReports.push(scheduled);
    await this.saveBranchMeta(scope, meta);
    return scheduled;
  }

  async createAlert(scope: AnalyticsTenantScope, input: CreateAlertSchemaInput): Promise<Alert> {
    const meta = await this.loadBranchMeta(scope);
    const alert: Alert = {
      id: createId("alert"),
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      title: input.title,
      message: input.message,
      severity: input.severity,
      moduleSource: input.moduleSource,
      metricKey: input.metricKey,
      thresholdValue: input.thresholdValue,
      actualValue: input.actualValue,
      isAcknowledged: false,
      triggeredAt: new Date().toISOString(),
    };
    meta.alerts.push(alert);
    await this.saveBranchMeta(scope, meta);
    return alert;
  }

  async acknowledgeAlert(scope: AnalyticsTenantScope, alertId: string): Promise<Alert | null> {
    const meta = await this.loadBranchMeta(scope);
    const alert = meta.alerts.find((item) => item.id === alertId);
    if (!alert) {
      return null;
    }
    alert.isAcknowledged = true;
    await this.saveBranchMeta(scope, meta);
    return alert;
  }

  async createBenchmark(scope: AnalyticsTenantScope, input: CreateBenchmarkSchemaInput) {
    const meta = await this.loadBranchMeta(scope);
    const benchmark = {
      id: createId("bench"),
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      ...input,
    };
    meta.benchmarks.push(benchmark);
    await this.saveBranchMeta(scope, meta);
    return benchmark;
  }

  async createDataSource(scope: AnalyticsTenantScope, input: CreateDataSourceSchemaInput): Promise<DataSource> {
    const meta = await this.loadBranchMeta(scope);
    const now = new Date().toISOString();
    const dataSource: DataSource = {
      id: createId("ds"),
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      name: input.name,
      moduleSource: input.moduleSource,
      connectionType: input.connectionType,
      isActive: input.isActive,
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    meta.dataSources.push(dataSource);
    await this.saveBranchMeta(scope, meta);
    return dataSource;
  }

  async createDashboardLayout(scope: AnalyticsTenantScope, input: CreateDashboardLayoutSchemaInput): Promise<DashboardLayout> {
    const meta = await this.loadBranchMeta(scope);
    const now = new Date().toISOString();
    const layout: DashboardLayout = {
      id: createId("layout"),
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      dashboardId: input.dashboardId,
      name: input.name,
      columns: input.columns,
      rowHeight: input.rowHeight,
      widgetPlacements: input.widgetPlacements,
      isDefault: input.isDefault,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    meta.dashboardLayouts.push(layout);
    await this.saveBranchMeta(scope, meta);
    return layout;
  }

  async createSavedView(scope: AnalyticsTenantScope, input: CreateSavedViewSchemaInput): Promise<SavedView> {
    const meta = await this.loadBranchMeta(scope);
    const now = new Date().toISOString();
    const view: SavedView = {
      id: createId("view"),
      tenantId: scope.tenantId,
      businessId: scope.businessId,
      branchId: scope.branchId,
      name: input.name,
      dashboardId: input.dashboardId ?? null,
      filters: input.filters,
      sortBy: input.sortBy ?? null,
      createdByUserId: scope.userId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    meta.savedViews.push(view);
    await this.saveBranchMeta(scope, meta);
    return view;
  }

  async exportReport(scope: AnalyticsTenantScope, input: ExportReportSchemaInput): Promise<{ content: string; mimeType: string; filename: string } | null> {
    const record = await this.getRecord(scope);
    const report = record.reports.find((item) => item.id === input.reportId);
    if (!report) {
      return null;
    }

    if (input.format === "csv") {
      return {
        content: exportReportToCsv(report, record),
        mimeType: "text/csv",
        filename: `${report.name}.csv`,
      };
    }

    if (input.format === "excel") {
      return {
        content: exportReportToExcelCompatibleCsv(report, record),
        mimeType: "application/vnd.ms-excel",
        filename: `${report.name}.xlsx`,
      };
    }

    return {
      content: exportReportToPdfPlaceholder(report, record),
      mimeType: "application/pdf",
      filename: `${report.name}.pdf`,
    };
  }
}

export const analyticsRepository = new AnalyticsRepository();
