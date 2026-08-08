import {
  handleAcknowledgeAlert,
  handleCreateAlert,
  handleCreateBenchmark,
  handleCreateDashboard,
  handleCreateDashboardLayout,
  handleCreateDataSource,
  handleCreateReport,
  handleCreateReportTemplate,
  handleCreateSavedView,
  handleCreateScheduledReport,
  handleCreateWidget,
  handleExportReport,
  handleListAnalytics,
  handleUpdateDashboard,
  handleUpdateReport,
  handleUpdateWidget,
} from "@/modules/analytics/api/analytics-route-handlers";

export async function GET(request: Request) {
  return handleListAnalytics(request);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource");

  switch (resource) {
    case "dashboard":
      return handleCreateDashboard(request);
    case "widget":
      return handleCreateWidget(request);
    case "report-template":
      return handleCreateReportTemplate(request);
    case "scheduled-report":
      return handleCreateScheduledReport(request);
    case "alert":
      return handleCreateAlert(request);
    case "benchmark":
      return handleCreateBenchmark(request);
    case "data-source":
      return handleCreateDataSource(request);
    case "dashboard-layout":
      return handleCreateDashboardLayout(request);
    case "saved-view":
      return handleCreateSavedView(request);
    case "export":
      return handleExportReport(request);
    case "ack-alert":
      return handleAcknowledgeAlert(request);
    default:
      return handleCreateReport(request);
  }
}

export async function PUT(request: Request) {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource");

  switch (resource) {
    case "dashboard":
      return handleUpdateDashboard(request);
    case "widget":
      return handleUpdateWidget(request);
    case "report":
      return handleUpdateReport(request);
    default:
      return handleUpdateReport(request);
  }
}
