import type {
  ImportExportJob,
  ImportExportPlatformAuditLog,
  ImportExportSchedule,
  ImportExportSchema,
  ImportExportTemplate,
  Prisma,
} from "@prisma/client";

import type {
  ImportExportAuditLogView,
  ImportExportPlatformDashboardMetrics,
  JobRecordView,
  JobView,
  ScheduleView,
  SchemaView,
  TemplateView,
} from "@/modules/import-export-platform/types/import-export-platform-types";

export function serializeSchema(schema: ImportExportSchema): SchemaView {
  const fields = Array.isArray(schema.fields) ? schema.fields : [];
  return {
    id: schema.id,
    schemaKey: schema.schemaKey,
    module: schema.module,
    name: schema.name,
    fieldCount: fields.length,
    isActive: schema.isActive,
  };
}

export function serializeTemplate(
  template: ImportExportTemplate & { schema?: ImportExportSchema | null },
): TemplateView {
  return {
    id: template.id,
    name: template.name,
    schemaKey: template.schema?.schemaKey ?? "",
    format: template.format,
    isDefault: template.isDefault,
  };
}

export function serializeJob(job: ImportExportJob): JobView {
  return {
    id: job.id,
    jobType: job.jobType,
    format: job.format,
    status: job.status,
    module: job.module,
    fileName: job.fileName,
    source: job.source,
    progressPct: job.progressPct,
    totalRecords: job.totalRecords,
    successCount: job.successCount,
    failureCount: job.failureCount,
    duplicateCount: job.duplicateCount,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

export function serializeSchedule(schedule: ImportExportSchedule): ScheduleView {
  return {
    id: schedule.id,
    name: schedule.name,
    jobType: schedule.jobType,
    format: schedule.format,
    module: schedule.module,
    frequency: schedule.frequency,
    isActive: schedule.isActive,
    nextRunAt: schedule.nextRunAt?.toISOString() ?? null,
  };
}

export function serializeJobRecord(record: {
  id: string;
  rowIndex: number;
  status: string;
  isDuplicate: boolean;
  errorMessage: string | null;
}): JobRecordView {
  return {
    id: record.id,
    rowIndex: record.rowIndex,
    status: record.status,
    isDuplicate: record.isDuplicate,
    errorMessage: record.errorMessage,
  };
}

export function serializeImportExportAuditLog(
  log: ImportExportPlatformAuditLog,
): ImportExportAuditLogView {
  return {
    id: log.id,
    eventType: log.eventType,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeImportExportPlatformDashboard(
  metrics: ImportExportPlatformDashboardMetrics,
): ImportExportPlatformDashboardMetrics {
  return metrics;
}

export type ImportExportPlatformDashboardView = ImportExportPlatformDashboardMetrics;

export function parseSchemaFields(schema: ImportExportSchema): Prisma.JsonArray {
  return schema.fields as Prisma.JsonArray;
}
