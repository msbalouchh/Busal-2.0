"use server";

import { revalidatePath } from "next/cache";

import { ANALYTICS_MODULE_PERMISSIONS } from "@/modules/analytics/constants/permissions";
import { ANALYTICS_PLATFORM_ROUTES } from "@/modules/analytics/constants/platform-routes";
import { resolveAnalyticsScope, toAnalyticsPlatformContext } from "@/modules/analytics/lib/analytics-scope";
import { analyticsService } from "@/modules/analytics/services/analytics.service";
import {
  acknowledgeAlertSchema,
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
import { protectedAction, type PlatformProtectedActionContext } from "@/modules/platform-guards/guards/action.guards";

function revalidateAnalyticsPaths() {
  Object.values(ANALYTICS_PLATFORM_ROUTES).forEach((path) => revalidatePath(path));
}

export async function createAnalyticsDashboardAction(input: unknown) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_CREATE, async ({ platform }: PlatformProtectedActionContext) => {
    const body = createDashboardSchema.parse(input);
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const dashboard = await analyticsService.createDashboard(context, body);
    revalidateAnalyticsPaths();
    return dashboard;
  });
}

export async function updateAnalyticsDashboardAction(input: unknown) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE, async ({ platform }) => {
    const body = updateDashboardSchema.parse(input);
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const dashboard = await analyticsService.updateDashboard(context, body);
    revalidateAnalyticsPaths();
    return dashboard;
  });
}

export async function deleteAnalyticsDashboardAction(dashboardId: string) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE, async ({ platform }) => {
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const deleted = await analyticsService.deleteDashboard(context, dashboardId);
    revalidateAnalyticsPaths();
    return { deleted };
  });
}

export async function createAnalyticsWidgetAction(input: unknown) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_CREATE, async ({ platform }) => {
    const body = createWidgetSchema.parse(input);
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const widget = await analyticsService.createWidget(context, body);
    revalidateAnalyticsPaths();
    return widget;
  });
}

export async function updateAnalyticsWidgetAction(input: unknown) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE, async ({ platform }) => {
    const body = updateWidgetSchema.parse(input);
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const widget = await analyticsService.updateWidget(context, body);
    revalidateAnalyticsPaths();
    return widget;
  });
}

export async function createAnalyticsReportAction(input: unknown) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_CREATE, async ({ platform }) => {
    const body = createReportSchema.parse(input);
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const report = await analyticsService.createReport(context, body);
    revalidateAnalyticsPaths();
    return report;
  });
}

export async function updateAnalyticsReportAction(input: unknown) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE, async ({ platform }) => {
    const body = updateReportSchema.parse(input);
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const report = await analyticsService.updateReport(context, body);
    revalidateAnalyticsPaths();
    return report;
  });
}

export async function exportAnalyticsReportAction(input: unknown) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_EXPORT, async ({ platform }) => {
    const body = exportReportSchema.parse(input);
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    return analyticsService.exportReport(context, body);
  });
}

export async function createAnalyticsReportTemplateAction(input: unknown) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_CREATE, async ({ platform }) => {
    const body = createReportTemplateSchema.parse(input);
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const template = await analyticsService.createReportTemplate(context, body);
    revalidateAnalyticsPaths();
    return template;
  });
}

export async function createScheduledAnalyticsReportAction(input: unknown) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE, async ({ platform }) => {
    const body = createScheduledReportSchema.parse(input);
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const scheduled = await analyticsService.createScheduledReport(context, body);
    revalidateAnalyticsPaths();
    return scheduled;
  });
}

export async function acknowledgeAnalyticsAlertAction(input: unknown) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE, async ({ platform }) => {
    const body = acknowledgeAlertSchema.parse(input);
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const alert = await analyticsService.acknowledgeAlert(context, body.alertId);
    revalidateAnalyticsPaths();
    return alert;
  });
}

export async function createAnalyticsAlertAction(input: unknown) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE, async ({ platform }) => {
    const body = createAlertSchema.parse(input);
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const alert = await analyticsService.createAlert(context, body);
    revalidateAnalyticsPaths();
    return alert;
  });
}

export async function createAnalyticsBenchmarkAction(input: unknown) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE, async ({ platform }) => {
    const body = createBenchmarkSchema.parse(input);
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const benchmark = await analyticsService.createBenchmark(context, body);
    revalidateAnalyticsPaths();
    return benchmark;
  });
}

export async function createAnalyticsDataSourceAction(input: unknown) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_CREATE, async ({ platform }) => {
    const body = createDataSourceSchema.parse(input);
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const dataSource = await analyticsService.createDataSource(context, body);
    revalidateAnalyticsPaths();
    return dataSource;
  });
}

export async function createAnalyticsDashboardLayoutAction(input: unknown) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_MANAGE, async ({ platform }) => {
    const body = createDashboardLayoutSchema.parse(input);
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const layout = await analyticsService.createDashboardLayout(context, body);
    revalidateAnalyticsPaths();
    return layout;
  });
}

export async function createAnalyticsSavedViewAction(input: unknown) {
  return protectedAction(ANALYTICS_MODULE_PERMISSIONS.ANALYTICS_CREATE, async ({ platform }) => {
    const body = createSavedViewSchema.parse(input);
    const context = toAnalyticsPlatformContext(resolveAnalyticsScope(platform));
    const view = await analyticsService.createSavedView(context, body);
    revalidateAnalyticsPaths();
    return view;
  });
}
