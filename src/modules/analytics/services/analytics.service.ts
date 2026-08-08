import "server-only";

import { analyticsRepository } from "@/modules/analytics/repository/analytics-repository";
import {
  resolveAnalyticsScope,
  toAnalyticsPlatformContext,
  type AnalyticsTenantScope,
} from "@/modules/analytics/lib/analytics-scope";
import type {
  Alert,
  AnalyticsPlatformContext,
  AnalyticsRecord,
  AnalyticsSearchQuery,
  AnalyticsSearchResult,
  Dashboard,
  DashboardLayout,
  DashboardWidget,
  DataSource,
  GenerateReportInput,
  KPI,
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

function resolveScope(context: AnalyticsPlatformContext): AnalyticsTenantScope {
  return {
    tenantId: context.tenantId,
    workspaceId: context.workspaceId,
    businessId: context.businessId,
    branchId: context.branchId,
    userId: context.userId,
    baseCurrency: context.baseCurrency,
  };
}

/** Domain service for analytics operations. */
export class AnalyticsService {
  async getRecord(context: AnalyticsPlatformContext): Promise<AnalyticsRecord> {
    return analyticsRepository.getRecord(resolveScope(context));
  }

  async getDashboardById(context: AnalyticsPlatformContext, dashboardId: string): Promise<Dashboard | null> {
    return analyticsRepository.findDashboardById(resolveScope(context), dashboardId);
  }

  async getDefaultDashboard(context: AnalyticsPlatformContext): Promise<Dashboard | null> {
    const record = await this.getRecord(context);
    return record.dashboards.find((dashboard) => dashboard.isDefault) ?? record.dashboards[0] ?? null;
  }

  async searchDashboards(
    context: AnalyticsPlatformContext,
    query: AnalyticsSearchQuery | AnalyticsSearchSchemaInput = {},
  ): Promise<AnalyticsSearchResult<Dashboard>> {
    return analyticsRepository.searchDashboards(resolveScope(context), query);
  }

  async searchReports(
    context: AnalyticsPlatformContext,
    query: AnalyticsSearchQuery | AnalyticsSearchSchemaInput = {},
  ): Promise<AnalyticsSearchResult<Report>> {
    return analyticsRepository.searchReports(resolveScope(context), query);
  }

  async getKpisByModule(context: AnalyticsPlatformContext, moduleSource: AnalyticsSearchQuery["moduleSource"]): Promise<KPI[]> {
    const record = await this.getRecord(context);
    if (!moduleSource) {
      return record.kpis;
    }
    return record.kpis.filter((kpi) => kpi.moduleSource === moduleSource);
  }

  async getUnacknowledgedAlerts(context: AnalyticsPlatformContext): Promise<Alert[]> {
    const record = await this.getRecord(context);
    return record.alerts.filter((alert) => !alert.isAcknowledged);
  }

  async getCriticalAlerts(context: AnalyticsPlatformContext): Promise<Alert[]> {
    const record = await this.getRecord(context);
    return record.alerts.filter((alert) => alert.severity === "critical" && !alert.isAcknowledged);
  }

  async generateReport(context: AnalyticsPlatformContext, input: GenerateReportInput): Promise<Report> {
    const record = await this.getRecord(context);
    const matchingKpis = record.kpis.filter((kpi) => input.moduleSources.includes(kpi.moduleSource));
    const matchingCharts = record.charts.filter((chart) => input.moduleSources.includes(chart.moduleSource));

    return analyticsRepository.createReport(resolveScope(context), {
      name: input.name,
      description: `Generated report covering ${input.moduleSources.join(", ")}`,
      moduleSources: input.moduleSources,
      branchIds: input.branchIds,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      chartIds: matchingCharts.map((chart) => chart.id),
      kpiIds: matchingKpis.map((kpi) => kpi.id),
    });
  }

  async acknowledgeAlert(context: AnalyticsPlatformContext, alertId: string): Promise<Alert | null> {
    return analyticsRepository.acknowledgeAlert(resolveScope(context), alertId);
  }

  async createDashboard(context: AnalyticsPlatformContext, input: CreateDashboardSchemaInput): Promise<Dashboard> {
    return analyticsRepository.createDashboard(resolveScope(context), input);
  }

  async updateDashboard(context: AnalyticsPlatformContext, input: UpdateDashboardSchemaInput): Promise<Dashboard | null> {
    return analyticsRepository.updateDashboard(resolveScope(context), input);
  }

  async deleteDashboard(context: AnalyticsPlatformContext, dashboardId: string): Promise<boolean> {
    return analyticsRepository.deleteDashboard(resolveScope(context), dashboardId);
  }

  async restoreDashboard(context: AnalyticsPlatformContext, dashboardId: string): Promise<boolean> {
    return analyticsRepository.restoreDashboard(resolveScope(context), dashboardId);
  }

  async createWidget(context: AnalyticsPlatformContext, input: CreateWidgetSchemaInput): Promise<DashboardWidget> {
    return analyticsRepository.createWidget(resolveScope(context), input);
  }

  async updateWidget(context: AnalyticsPlatformContext, input: UpdateWidgetSchemaInput): Promise<DashboardWidget | null> {
    return analyticsRepository.updateWidget(resolveScope(context), input);
  }

  async deleteWidget(context: AnalyticsPlatformContext, widgetId: string): Promise<boolean> {
    return analyticsRepository.deleteWidget(resolveScope(context), widgetId);
  }

  async createReport(context: AnalyticsPlatformContext, input: CreateReportSchemaInput): Promise<Report> {
    return analyticsRepository.createReport(resolveScope(context), input);
  }

  async updateReport(context: AnalyticsPlatformContext, input: UpdateReportSchemaInput): Promise<Report | null> {
    return analyticsRepository.updateReport(resolveScope(context), input);
  }

  async deleteReport(context: AnalyticsPlatformContext, reportId: string): Promise<boolean> {
    return analyticsRepository.deleteReport(resolveScope(context), reportId);
  }

  async restoreReport(context: AnalyticsPlatformContext, reportId: string): Promise<boolean> {
    return analyticsRepository.restoreReport(resolveScope(context), reportId);
  }

  async createReportTemplate(context: AnalyticsPlatformContext, input: CreateReportTemplateSchemaInput): Promise<ReportTemplate> {
    return analyticsRepository.createReportTemplate(resolveScope(context), input);
  }

  async createScheduledReport(context: AnalyticsPlatformContext, input: CreateScheduledReportSchemaInput): Promise<ScheduledReport> {
    return analyticsRepository.createScheduledReport(resolveScope(context), input);
  }

  async createAlert(context: AnalyticsPlatformContext, input: CreateAlertSchemaInput): Promise<Alert> {
    return analyticsRepository.createAlert(resolveScope(context), input);
  }

  async createBenchmark(context: AnalyticsPlatformContext, input: CreateBenchmarkSchemaInput) {
    return analyticsRepository.createBenchmark(resolveScope(context), input);
  }

  async createDataSource(context: AnalyticsPlatformContext, input: CreateDataSourceSchemaInput): Promise<DataSource> {
    return analyticsRepository.createDataSource(resolveScope(context), input);
  }

  async createDashboardLayout(context: AnalyticsPlatformContext, input: CreateDashboardLayoutSchemaInput): Promise<DashboardLayout> {
    return analyticsRepository.createDashboardLayout(resolveScope(context), input);
  }

  async createSavedView(context: AnalyticsPlatformContext, input: CreateSavedViewSchemaInput): Promise<SavedView> {
    return analyticsRepository.createSavedView(resolveScope(context), input);
  }

  async exportReport(context: AnalyticsPlatformContext, input: ExportReportSchemaInput) {
    return analyticsRepository.exportReport(resolveScope(context), input);
  }
}

export const analyticsService = new AnalyticsService();

export { resolveAnalyticsScope, toAnalyticsPlatformContext };
