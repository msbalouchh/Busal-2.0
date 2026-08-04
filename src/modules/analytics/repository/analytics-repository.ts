import { REPORT_STATUSES } from "@/modules/analytics/constants/analytics-status";
import {
  DEFAULT_ANALYTICS_SCOPE,
  MOCK_ANALYTICS_RECORD,
} from "@/modules/analytics/constants/mock-data";
import type {
  Alert,
  AnalyticsRecord,
  AnalyticsSearchQuery,
  Dashboard,
  GenerateReportInput,
  KPI,
  Report,
} from "@/modules/analytics/types/analytics-platform";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** In-memory analytics repository (mock only, no backend). */
export class AnalyticsRepository {
  private record: AnalyticsRecord = structuredClone(MOCK_ANALYTICS_RECORD);

  getRecord(): AnalyticsRecord {
    return structuredClone(this.record);
  }

  findDashboardById(dashboardId: string): Dashboard | undefined {
    return this.record.dashboards.find((d) => d.id === dashboardId);
  }

  getDefaultDashboard(): Dashboard | undefined {
    return this.record.dashboards.find((d) => d.isDefault);
  }

  searchDashboards(query: AnalyticsSearchQuery = {}): Dashboard[] {
    let results = structuredClone(this.record.dashboards);

    if (query.dashboardType) {
      results = results.filter((d) => d.dashboardType === query.dashboardType);
    }

    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter(
        (d) => d.name.toLowerCase().includes(term) || d.description.toLowerCase().includes(term),
      );
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  getKpisByModule(moduleSource: AnalyticsSearchQuery["moduleSource"]): KPI[] {
    if (!moduleSource) {
      return structuredClone(this.record.kpis);
    }

    return this.record.kpis.filter((kpi) => kpi.moduleSource === moduleSource);
  }

  getUnacknowledgedAlerts(): Alert[] {
    return this.record.alerts.filter((alert) => !alert.isAcknowledged);
  }

  getCriticalAlerts(): Alert[] {
    return this.record.alerts.filter(
      (alert) => alert.severity === "critical" && !alert.isAcknowledged,
    );
  }

  generateReport(input: GenerateReportInput): Report {
    const now = new Date().toISOString();
    const reportId = createId("report");

    const matchingKpis = this.record.kpis.filter((kpi) =>
      input.moduleSources.includes(kpi.moduleSource),
    );
    const matchingCharts = this.record.charts.filter((chart) =>
      input.moduleSources.includes(chart.moduleSource),
    );

    const report: Report = {
      id: reportId,
      tenantId: DEFAULT_ANALYTICS_SCOPE.tenantId,
      businessId: DEFAULT_ANALYTICS_SCOPE.businessId,
      name: input.name,
      description: `Generated report covering ${input.moduleSources.join(", ")}`,
      status: REPORT_STATUSES.DRAFT,
      moduleSources: input.moduleSources,
      chartIds: matchingCharts.map((c) => c.id),
      kpiIds: matchingKpis.map((k) => k.id),
      branchIds: input.branchIds,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      createdByUserId: DEFAULT_ANALYTICS_SCOPE.userId,
      createdAt: now,
      updatedAt: now,
    };

    this.record.reports.push(report);
    return structuredClone(report);
  }

  acknowledgeAlert(alertId: string): Alert | null {
    const alert = this.record.alerts.find((a) => a.id === alertId);

    if (!alert) {
      return null;
    }

    alert.isAcknowledged = true;
    return structuredClone(alert);
  }

  searchReports(query: AnalyticsSearchQuery = {}): Report[] {
    let results = structuredClone(this.record.reports);

    if (query.query) {
      const term = query.query.toLowerCase();
      results = results.filter(
        (r) => r.name.toLowerCase().includes(term) || r.description.toLowerCase().includes(term),
      );
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }
}

export const analyticsRepository = new AnalyticsRepository();
