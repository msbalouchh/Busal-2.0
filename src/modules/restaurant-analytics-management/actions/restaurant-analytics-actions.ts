"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { RESTAURANT_ANALYTICS_ROUTES } from "@/modules/restaurant-analytics-management/constants/routes";
import { requireRestaurantAnalyticsActionContext } from "@/modules/restaurant-analytics-management/lib/get-restaurant-analytics-context";
import {
  validateExportRequest,
  validateSavedReportInput,
} from "@/modules/restaurant-analytics-management/lib/restaurant-analytics-validation";
import type {
  DashboardWidgetInput,
  ExportReportRequest,
  SavedReportInput,
} from "@/modules/restaurant-analytics-management/types/restaurant-analytics-types";
import { generateReportPdf } from "@/modules/reporting/utils/export/report-export";
import { rowsToCsv, rowsToExcel } from "@/modules/reporting/utils/reporting-utils";
import { runCustomReport } from "@/services/restaurant-analytics.service";
import {
  createSavedReport,
  deleteDashboardWidget,
  deleteSavedReport,
  updateSavedReport,
  upsertDashboardWidget,
} from "@/services/restaurant-saved-report.service";

function revalidateAnalyticsPages() {
  revalidatePath(RESTAURANT_ANALYTICS_ROUTES.dashboard());
  revalidatePath(RESTAURANT_ANALYTICS_ROUTES.reports());
}

function toBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}

export async function createSavedReportAction(input: SavedReportInput) {
  const context = await requireRestaurantAnalyticsActionContext(
    PERMISSION_CODES.ANALYTICS_CREATE_REPORT,
  );
  validateSavedReportInput(input);
  const report = await createSavedReport(context.user.id, input);
  revalidateAnalyticsPages();
  return report;
}

export async function updateSavedReportAction(reportId: string, input: Partial<SavedReportInput>) {
  const context = await requireRestaurantAnalyticsActionContext(
    PERMISSION_CODES.ANALYTICS_EDIT_REPORT,
  );
  const report = await updateSavedReport(context.user.id, reportId, input);
  revalidateAnalyticsPages();
  revalidatePath(RESTAURANT_ANALYTICS_ROUTES.savedReport(reportId));
  return report;
}

export async function deleteSavedReportAction(reportId: string) {
  const context = await requireRestaurantAnalyticsActionContext(
    PERMISSION_CODES.ANALYTICS_DELETE_REPORT,
  );
  await deleteSavedReport(context.user.id, reportId);
  revalidateAnalyticsPages();
  return { success: true };
}

export async function upsertDashboardWidgetAction(input: DashboardWidgetInput, widgetId?: string) {
  const context = await requireRestaurantAnalyticsActionContext(PERMISSION_CODES.DASHBOARD_MANAGE);
  const widget = await upsertDashboardWidget(context.user.id, input, widgetId);
  revalidateAnalyticsPages();
  return widget;
}

export async function deleteDashboardWidgetAction(widgetId: string) {
  const context = await requireRestaurantAnalyticsActionContext(PERMISSION_CODES.DASHBOARD_MANAGE);
  await deleteDashboardWidget(context.user.id, widgetId);
  revalidateAnalyticsPages();
  return { success: true };
}

export async function exportAnalyticsReportAction(input: ExportReportRequest) {
  const context = await requireRestaurantAnalyticsActionContext(PERMISSION_CODES.ANALYTICS_EXPORT);
  validateExportRequest(input);

  const result = await runCustomReport(context.user.id, input.reportType, input.filters);
  const title = input.title ?? `${input.reportType} Report`;
  const timestamp = new Date().toISOString().slice(0, 10);
  const headers = result.tableHeaders;
  const rows = result.tableRows.map((row) => row.cells);

  if (input.format === "pdf") {
    const kpiSection = {
      title: "Summary",
      rows: result.kpis.map((kpi) => ({ label: kpi.label, value: kpi.value })),
    };
    const tableSection = {
      title: "Data",
      rows: rows.map((row) => ({
        label: row[0] ?? "",
        value: row.slice(1).join(" · "),
      })),
    };

    const buffer = await generateReportPdf(title, [kpiSection, tableSection]);

    return {
      success: true as const,
      data: {
        filename: `${input.reportType.toLowerCase()}-${timestamp}.pdf`,
        mimeType: "application/pdf",
        contentBase64: toBase64(buffer),
      },
    };
  }

  if (input.format === "excel") {
    const buffer = rowsToExcel(headers, rows);
    return {
      success: true as const,
      data: {
        filename: `${input.reportType.toLowerCase()}-${timestamp}.xls`,
        mimeType: "application/vnd.ms-excel",
        contentBase64: toBase64(buffer),
      },
    };
  }

  const csv = rowsToCsv(headers, rows);
  return {
    success: true as const,
    data: {
      filename: `${input.reportType.toLowerCase()}-${timestamp}.csv`,
      mimeType: "text/csv",
      contentBase64: toBase64(Buffer.from(csv, "utf8")),
    },
  };
}
