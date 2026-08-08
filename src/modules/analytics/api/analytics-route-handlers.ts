import "server-only";

import { NextResponse } from "next/server";

import { ANALYTICS_MODULE_PERMISSIONS } from "@/modules/analytics/constants/permissions";
import { resolveAnalyticsScope, toAnalyticsPlatformContext } from "@/modules/analytics/lib/analytics-scope";
import { analyticsService } from "@/modules/analytics/services/analytics.service";
import { buildAnalyticsPlatformSnapshot } from "@/modules/analytics/services/analytics-platform.service";
import {
  acknowledgeAlertSchema,
  analyticsSearchSchema,
  createAlertSchema,
  createBenchmarkSchema,
  createDashboardLayoutSchema,
  createDashboardSchema,
  createDataSourceSchema,
  createReportSchema,
  createReportTemplateSchema,
  createSavedViewSchema,
  createScheduledReportSchema,
  createWidgetSchema,
  exportReportSchema,
  updateDashboardSchema,
  updateReportSchema,
  updateWidgetSchema,
} from "@/modules/analytics/validation/analytics-schemas";
import {
  handlePlatformRouteError,
  protectedRoute,
} from "@/modules/platform-guards/guards/route.guards";

function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export async function handleListAnalytics(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_READ });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const url = new URL(request.url);
    const parsed = analyticsSearchSchema.parse(Object.fromEntries(url.searchParams.entries()));
    const snapshot = url.searchParams.get("snapshot") === "true";

    if (snapshot) {
      const data = await buildAnalyticsPlatformSnapshot(context);
      return jsonSuccess(data);
    }

    const [dashboards, reports, record] = await Promise.all([
      analyticsService.searchDashboards(context, parsed),
      analyticsService.searchReports(context, parsed),
      analyticsService.getRecord(context),
    ]);

    return jsonSuccess({ dashboards, reports, kpis: record.kpis, alerts: record.alerts });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateDashboard(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_CREATE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const body = createDashboardSchema.parse(await request.json());
    const dashboard = await analyticsService.createDashboard(context, body);
    return jsonSuccess(dashboard, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdateDashboard(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const body = updateDashboardSchema.parse(await request.json());
    const dashboard = await analyticsService.updateDashboard(context, body);
    if (!dashboard) {
      return NextResponse.json({ success: false, error: "Dashboard not found" }, { status: 404 });
    }
    return jsonSuccess(dashboard);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleDeleteDashboard(_request: Request, dashboardId: string) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const deleted = await analyticsService.deleteDashboard(context, dashboardId);
    return jsonSuccess({ deleted });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleRestoreDashboard(_request: Request, dashboardId: string) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const restored = await analyticsService.restoreDashboard(context, dashboardId);
    return jsonSuccess({ restored });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateWidget(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_CREATE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const body = createWidgetSchema.parse(await request.json());
    const widget = await analyticsService.createWidget(context, body);
    return jsonSuccess(widget, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdateWidget(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const body = updateWidgetSchema.parse(await request.json());
    const widget = await analyticsService.updateWidget(context, body);
    if (!widget) {
      return NextResponse.json({ success: false, error: "Widget not found" }, { status: 404 });
    }
    return jsonSuccess(widget);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateReport(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_CREATE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const body = createReportSchema.parse(await request.json());
    const report = await analyticsService.createReport(context, body);
    return jsonSuccess(report, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleUpdateReport(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const body = updateReportSchema.parse(await request.json());
    const report = await analyticsService.updateReport(context, body);
    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }
    return jsonSuccess(report);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleDeleteReport(_request: Request, reportId: string) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const deleted = await analyticsService.deleteReport(context, reportId);
    return jsonSuccess({ deleted });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleExportReport(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_EXPORT });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const body = exportReportSchema.parse(await request.json());
    const exported = await analyticsService.exportReport(context, body);
    if (!exported) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }
    return jsonSuccess(exported);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateReportTemplate(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_CREATE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const body = createReportTemplateSchema.parse(await request.json());
    const template = await analyticsService.createReportTemplate(context, body);
    return jsonSuccess(template, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateScheduledReport(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const body = createScheduledReportSchema.parse(await request.json());
    const scheduled = await analyticsService.createScheduledReport(context, body);
    return jsonSuccess(scheduled, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateAlert(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const body = createAlertSchema.parse(await request.json());
    const alert = await analyticsService.createAlert(context, body);
    return jsonSuccess(alert, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleAcknowledgeAlert(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const body = acknowledgeAlertSchema.parse(await request.json());
    const alert = await analyticsService.acknowledgeAlert(context, body.alertId);
    if (!alert) {
      return NextResponse.json({ success: false, error: "Alert not found" }, { status: 404 });
    }
    return jsonSuccess(alert);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateBenchmark(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const body = createBenchmarkSchema.parse(await request.json());
    const benchmark = await analyticsService.createBenchmark(context, body);
    return jsonSuccess(benchmark, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateDataSource(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_CREATE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const body = createDataSourceSchema.parse(await request.json());
    const dataSource = await analyticsService.createDataSource(context, body);
    return jsonSuccess(dataSource, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateDashboardLayout(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const body = createDashboardLayoutSchema.parse(await request.json());
    const layout = await analyticsService.createDashboardLayout(context, body);
    return jsonSuccess(layout, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleCreateSavedView(request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_CREATE });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const body = createSavedViewSchema.parse(await request.json());
    const view = await analyticsService.createSavedView(context, body);
    return jsonSuccess(view, 201);
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleAnalyticsReports(_request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_READ });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const record = await analyticsService.getRecord(context);
    return jsonSuccess({
      reports: record.reports,
      reportTemplates: record.reportTemplates,
      scheduledReports: record.scheduledReports,
      savedReports: record.savedReports,
    });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}

export async function handleAnalyticsAlerts(_request: Request) {
  try {
    const platform = await protectedRoute({ permission: ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_READ });
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const [alerts, benchmarks, forecasts] = await Promise.all([
      analyticsService.getUnacknowledgedAlerts(context),
      analyticsService.getRecord(context).then((record) => record.benchmarks),
      analyticsService.getRecord(context).then((record) => record.forecasts),
    ]);
    return jsonSuccess({ alerts, benchmarks, forecasts });
  } catch (error) {
    return handlePlatformRouteError(error);
  }
}
