import { z } from "zod";

import {
  ANALYTICS_MODULE_SOURCES,
  DASHBOARD_TYPES,
  REPORT_EXPORT_FORMATS,
  REPORT_TYPES,
  SCHEDULE_FREQUENCIES,
  WIDGET_TYPES,
} from "@/modules/analytics/constants/analytics-status";

export const analyticsSearchSchema = z.object({
  query: z.string().optional(),
  moduleSource: z.nativeEnum(ANALYTICS_MODULE_SOURCES).optional(),
  dashboardType: z.nativeEnum(DASHBOARD_TYPES).optional(),
  reportType: z.nativeEnum(REPORT_TYPES).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  includeDeleted: z.coerce.boolean().optional(),
});

export const createDashboardSchema = z.object({
  name: z.string().min(1),
  dashboardType: z.nativeEnum(DASHBOARD_TYPES),
  description: z.string().default(""),
  branchIds: z.array(z.string()).min(1),
  isDefault: z.boolean().optional(),
});

export const updateDashboardSchema = createDashboardSchema.partial().extend({
  dashboardId: z.string().min(1),
});

export const createWidgetSchema = z.object({
  dashboardId: z.string().min(1),
  widgetType: z.nativeEnum(WIDGET_TYPES),
  title: z.string().min(1),
  metricId: z.string().nullable().optional(),
  kpiId: z.string().nullable().optional(),
  chartId: z.string().nullable().optional(),
  reportId: z.string().nullable().optional(),
  positionX: z.number().int().default(0),
  positionY: z.number().int().default(0),
  width: z.number().int().min(1).default(4),
  height: z.number().int().min(1).default(2),
  refreshIntervalSec: z.number().int().min(30).default(300),
  moduleSource: z.nativeEnum(ANALYTICS_MODULE_SOURCES).nullable().optional(),
});

export const updateWidgetSchema = createWidgetSchema.partial().extend({
  widgetId: z.string().min(1),
});

export const createReportSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  moduleSources: z.array(z.nativeEnum(ANALYTICS_MODULE_SOURCES)).min(1),
  branchIds: z.array(z.string()).min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  chartIds: z.array(z.string()).default([]),
  kpiIds: z.array(z.string()).default([]),
});

export const updateReportSchema = createReportSchema.partial().extend({
  reportId: z.string().min(1),
});

export const createReportTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  reportType: z.nativeEnum(REPORT_TYPES),
  moduleSources: z.array(z.nativeEnum(ANALYTICS_MODULE_SOURCES)).min(1),
  defaultChartIds: z.array(z.string()).default([]),
  defaultKpiIds: z.array(z.string()).default([]),
});

export const createScheduledReportSchema = z.object({
  reportId: z.string().min(1),
  name: z.string().min(1),
  frequency: z.nativeEnum(SCHEDULE_FREQUENCIES),
  recipientEmails: z.array(z.string().email()).min(1),
  nextRunAt: z.string().min(1),
  isActive: z.boolean().default(true),
});

export const createAlertSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(["info", "warning", "critical"]),
  moduleSource: z.nativeEnum(ANALYTICS_MODULE_SOURCES),
  metricKey: z.string().min(1),
  thresholdValue: z.number(),
  actualValue: z.number(),
});

export const createBenchmarkSchema = z.object({
  metricKey: z.string().min(1),
  label: z.string().min(1),
  businessValue: z.number(),
  industryAverage: z.number(),
  topPerformerValue: z.number(),
  percentileRank: z.number().min(0).max(100),
  moduleSource: z.nativeEnum(ANALYTICS_MODULE_SOURCES),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
});

export const createDataSourceSchema = z.object({
  name: z.string().min(1),
  moduleSource: z.nativeEnum(ANALYTICS_MODULE_SOURCES),
  connectionType: z.enum(["prisma", "api", "manual"]).default("prisma"),
  isActive: z.boolean().default(true),
});

export const createDashboardLayoutSchema = z.object({
  dashboardId: z.string().min(1),
  name: z.string().min(1),
  columns: z.number().int().min(1).default(12),
  rowHeight: z.number().int().min(1).default(40),
  widgetPlacements: z.array(
    z.object({
      widgetId: z.string(),
      positionX: z.number().int(),
      positionY: z.number().int(),
      width: z.number().int(),
      height: z.number().int(),
    }),
  ),
  isDefault: z.boolean().default(false),
});

export const createSavedViewSchema = z.object({
  name: z.string().min(1),
  dashboardId: z.string().nullable().optional(),
  filters: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).default({}),
  sortBy: z.string().nullable().optional(),
});

export const exportReportSchema = z.object({
  reportId: z.string().min(1),
  format: z.nativeEnum(REPORT_EXPORT_FORMATS),
});

export const acknowledgeAlertSchema = z.object({
  alertId: z.string().min(1),
});

export type AnalyticsSearchSchemaInput = z.infer<typeof analyticsSearchSchema>;
export type CreateDashboardSchemaInput = z.infer<typeof createDashboardSchema>;
export type UpdateDashboardSchemaInput = z.infer<typeof updateDashboardSchema>;
export type CreateWidgetSchemaInput = z.infer<typeof createWidgetSchema>;
export type UpdateWidgetSchemaInput = z.infer<typeof updateWidgetSchema>;
export type CreateReportSchemaInput = z.infer<typeof createReportSchema>;
export type UpdateReportSchemaInput = z.infer<typeof updateReportSchema>;
export type CreateReportTemplateSchemaInput = z.infer<typeof createReportTemplateSchema>;
export type CreateScheduledReportSchemaInput = z.infer<typeof createScheduledReportSchema>;
export type CreateAlertSchemaInput = z.infer<typeof createAlertSchema>;
export type CreateBenchmarkSchemaInput = z.infer<typeof createBenchmarkSchema>;
export type CreateDataSourceSchemaInput = z.infer<typeof createDataSourceSchema>;
export type CreateDashboardLayoutSchemaInput = z.infer<typeof createDashboardLayoutSchema>;
export type CreateSavedViewSchemaInput = z.infer<typeof createSavedViewSchema>;
export type ExportReportSchemaInput = z.infer<typeof exportReportSchema>;
