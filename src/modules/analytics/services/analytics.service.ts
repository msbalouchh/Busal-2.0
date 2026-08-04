import { analyticsRepository } from "@/modules/analytics/repository/analytics-repository";
import type {
  Alert,
  AnalyticsRecord,
  AnalyticsSearchQuery,
  Dashboard,
  GenerateReportInput,
  KPI,
  Report,
} from "@/modules/analytics/types/analytics-platform";

/** Domain service for analytics operations. */
export class AnalyticsService {
  getRecord(): AnalyticsRecord {
    return analyticsRepository.getRecord();
  }

  getDashboardById(dashboardId: string): Dashboard | null {
    return analyticsRepository.findDashboardById(dashboardId) ?? null;
  }

  getDefaultDashboard(): Dashboard | null {
    return analyticsRepository.getDefaultDashboard() ?? null;
  }

  searchDashboards(query: AnalyticsSearchQuery = {}): Dashboard[] {
    return analyticsRepository.searchDashboards(query);
  }

  getKpisByModule(moduleSource: AnalyticsSearchQuery["moduleSource"]): KPI[] {
    return analyticsRepository.getKpisByModule(moduleSource);
  }

  getUnacknowledgedAlerts(): Alert[] {
    return analyticsRepository.getUnacknowledgedAlerts();
  }

  getCriticalAlerts(): Alert[] {
    return analyticsRepository.getCriticalAlerts();
  }

  generateReport(input: GenerateReportInput): Report {
    return analyticsRepository.generateReport(input);
  }

  acknowledgeAlert(alertId: string): Alert | null {
    return analyticsRepository.acknowledgeAlert(alertId);
  }

  searchReports(query: AnalyticsSearchQuery = {}): Report[] {
    return analyticsRepository.searchReports(query);
  }
}

export const analyticsService = new AnalyticsService();
