import "server-only";

import type { ImportExportAuditEventType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  evaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import { PREVIEW_ROW_LIMIT } from "@/modules/import-export-platform/constants/routes";
import {
  accumulateBatchResult,
  splitIntoBatches,
} from "@/modules/import-export-platform/engine/batch-engine";
import { detectDuplicates } from "@/modules/import-export-platform/engine/duplicate-engine";
import {
  parseImportContent,
  serializeExportContent,
} from "@/modules/import-export-platform/engine/format-engine";
import {
  applyFieldMappings,
  buildDefaultFieldMappings,
} from "@/modules/import-export-platform/engine/mapping-engine";
import {
  buildCronExpression,
  calculateJobProgress,
  resolveNextScheduleRun,
} from "@/modules/import-export-platform/engine/progress-engine";
import {
  buildRollbackRecordStatus,
  canRollbackImport,
  resolveRollbackProgress,
} from "@/modules/import-export-platform/engine/rollback-engine";
import {
  filterValidRows,
  validateImportRows,
} from "@/modules/import-export-platform/engine/validation-engine";
import { ensureBootstrapImportExportPlatform } from "@/modules/import-export-platform/plugins/bootstrap-import-export-platform";
import {
  listImportExportSchemaDefinitions,
  registerImportExportSchemaDefinition,
} from "@/modules/import-export-platform/registry/schema-registry";
import type {
  ExportJobInput,
  ExportPayloadResult,
  ImportExportPlatformDashboardMetrics,
  ImportJobInput,
  ImportPreviewResult,
  RegisteredImportExportSchemaDefinition,
  ScheduleInput,
  SchemaFieldDefinition,
  TemplateInput,
} from "@/modules/import-export-platform/types/import-export-platform-types";
import { recordStructuredLog } from "@/services/monitoring-platform.service";

function assertPermission(platform: BusinessContext, permission: string): void {
  const context = toPermissionEvaluationContext({
    permissions: platform.permissions,
    roleSlug: platform.roleSlug ?? null,
    isOwner: platform.isOwner,
    businessId: platform.business.id,
    branchId: platform.branchId,
  });

  if (!evaluatePermission(context, permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

async function logImportExportAudit(input: {
  businessId?: string | null;
  userId?: string | null;
  eventType: ImportExportAuditEventType;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.importExportPlatformAuditLog.create({
    data: {
      businessId: input.businessId ?? null,
      userId: input.userId ?? null,
      eventType: input.eventType,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

function parseSchemaFields(fields: Prisma.JsonValue): SchemaFieldDefinition[] {
  if (!Array.isArray(fields)) {
    return [];
  }
  return fields as unknown as SchemaFieldDefinition[];
}

async function syncSchemaToDatabase(
  businessId: string,
  definition: RegisteredImportExportSchemaDefinition,
): Promise<string> {
  const record = await prisma.importExportSchema.upsert({
    where: {
      businessId_schemaKey: {
        businessId,
        schemaKey: definition.schemaKey,
      },
    },
    create: {
      businessId,
      schemaKey: definition.schemaKey,
      module: definition.module,
      name: definition.name,
      fields: definition.fields as unknown as Prisma.InputJsonValue,
      importFormats: definition.importFormats as unknown as Prisma.InputJsonValue,
      exportFormats: definition.exportFormats as unknown as Prisma.InputJsonValue,
      isActive: definition.isActive,
    },
    update: {
      module: definition.module,
      name: definition.name,
      fields: definition.fields as unknown as Prisma.InputJsonValue,
      importFormats: definition.importFormats as unknown as Prisma.InputJsonValue,
      exportFormats: definition.exportFormats as unknown as Prisma.InputJsonValue,
      isActive: definition.isActive,
    },
  });

  return record.id;
}

async function getSchemaRecord(businessId: string, schemaKey: string) {
  const schema = await prisma.importExportSchema.findFirst({
    where: { businessId, schemaKey },
  });
  if (!schema) {
    throw new Error(`Schema not found: ${schemaKey}`);
  }
  return schema;
}

export async function ensureImportExportPlatformDefaults(businessId: string): Promise<void> {
  ensureBootstrapImportExportPlatform();

  for (const definition of listImportExportSchemaDefinitions()) {
    await syncSchemaToDatabase(businessId, definition);
  }
}

export async function registerModuleImportExportSchema(
  businessId: string,
  definition: RegisteredImportExportSchemaDefinition,
): Promise<void> {
  ensureBootstrapImportExportPlatform();
  registerImportExportSchemaDefinition(definition);
  await syncSchemaToDatabase(businessId, definition);

  await logImportExportAudit({
    businessId,
    eventType: "SCHEMA_REGISTERED",
    metadata: { schemaKey: definition.schemaKey, module: definition.module },
  });
}

export async function createImportTemplate(
  platform: BusinessContext,
  input: TemplateInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE);

  const schema = await getSchemaRecord(platform.business.id, input.schemaKey);

  const template = await prisma.importExportTemplate.create({
    data: {
      businessId: platform.business.id,
      schemaId: schema.id,
      name: input.name,
      format: input.format,
      fieldMappings: input.fieldMappings as unknown as Prisma.InputJsonValue,
      isDefault: input.isDefault ?? false,
    },
  });

  await logImportExportAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "TEMPLATE_CREATED",
    metadata: { templateId: template.id, schemaKey: input.schemaKey },
  });

  return { id: template.id };
}

export async function previewImportJob(
  platform: BusinessContext,
  input: ImportJobInput,
): Promise<ImportPreviewResult> {
  assertPermission(platform, PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE);

  const schema = await getSchemaRecord(platform.business.id, input.schemaKey);
  const fields = parseSchemaFields(schema.fields);
  const parsedRows = parseImportContent(input.format, input.content);
  const mappings =
    input.fieldMappings ?? buildDefaultFieldMappings(Object.keys(parsedRows[0] ?? {}), fields);
  const mappedRows = applyFieldMappings(parsedRows, mappings);
  const validation = validateImportRows(mappedRows, fields);
  const previewRows = mappedRows.slice(0, PREVIEW_ROW_LIMIT);

  const job = await prisma.importExportJob.create({
    data: {
      businessId: platform.business.id,
      schemaId: schema.id,
      userId: platform.user.id,
      jobType: "IMPORT",
      format: input.format,
      status: "PREVIEW",
      module: schema.module,
      fileName: input.fileName ?? null,
      source: input.source ?? "DASHBOARD",
      totalRecords: mappedRows.length,
      previewData: previewRows as Prisma.InputJsonValue,
      validationErrors: validation.errors as Prisma.InputJsonValue,
      fieldMappings: mappings as unknown as Prisma.InputJsonValue,
    },
  });

  await logImportExportAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "IMPORT_PREVIEW",
    metadata: { jobId: job.id, schemaKey: input.schemaKey },
  });

  return {
    jobId: job.id,
    previewRows,
    totalRecords: mappedRows.length,
    validationErrors: validation.errors,
  };
}

export async function runImportJob(
  platform: BusinessContext,
  input: ImportJobInput,
): Promise<{ jobId: string; successCount: number; failureCount: number; duplicateCount: number }> {
  assertPermission(platform, PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE);

  const schema = await getSchemaRecord(platform.business.id, input.schemaKey);
  const fields = parseSchemaFields(schema.fields);
  const parsedRows = parseImportContent(input.format, input.content);
  const mappings =
    input.fieldMappings ?? buildDefaultFieldMappings(Object.keys(parsedRows[0] ?? {}), fields);
  const mappedRows = applyFieldMappings(parsedRows, mappings);
  const validation = validateImportRows(mappedRows, fields);
  const validRows = filterValidRows(mappedRows, validation);
  const duplicateResult = detectDuplicates(validRows, fields);

  const job = await prisma.importExportJob.create({
    data: {
      businessId: platform.business.id,
      schemaId: schema.id,
      userId: platform.user.id,
      jobType: "IMPORT",
      format: input.format,
      status: "PROCESSING",
      module: schema.module,
      fileName: input.fileName ?? null,
      source: input.source ?? "DASHBOARD",
      totalRecords: mappedRows.length,
      validationErrors: validation.errors as Prisma.InputJsonValue,
      fieldMappings: mappings as unknown as Prisma.InputJsonValue,
      startedAt: new Date(),
    },
  });

  await logImportExportAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "IMPORT_STARTED",
    metadata: { jobId: job.id, schemaKey: input.schemaKey, source: input.source ?? "DASHBOARD" },
  });

  if (input.source === "API") {
    await logImportExportAudit({
      businessId: platform.business.id,
      userId: platform.user.id,
      eventType: "API_IMPORT",
      metadata: { jobId: job.id },
    });
  }

  await logImportExportAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "IMPORT_VALIDATED",
    metadata: { jobId: job.id, errorCount: validation.errors.length },
  });

  let batchResult = {
    processed: 0,
    successCount: 0,
    failureCount: validation.errors.length > 0 ? mappedRows.length - validRows.length : 0,
    duplicateCount: 0,
    progressPct: 0,
  };

  const batches = splitIntoBatches(duplicateResult.uniqueRecords);
  for (const batch of batches) {
    for (let index = 0; index < batch.length; index += 1) {
      const row = batch[index];
      const rowIndex = batchResult.processed + index;
      await prisma.importExportJobRecord.create({
        data: {
          businessId: platform.business.id,
          jobId: job.id,
          rowIndex,
          status: "SUCCESS",
          inputData: row as Prisma.InputJsonValue,
          outputData: row as Prisma.InputJsonValue,
        },
      });
    }

    batchResult = accumulateBatchResult(
      batchResult,
      {
        success: batch.length,
        failed: 0,
        duplicates: 0,
      },
      mappedRows.length,
    );
  }

  batchResult.duplicateCount = duplicateResult.duplicates;
  if (duplicateResult.duplicates > 0) {
    await logImportExportAudit({
      businessId: platform.business.id,
      userId: platform.user.id,
      eventType: "DUPLICATE_DETECTED",
      metadata: { jobId: job.id, count: duplicateResult.duplicates },
    });
  }

  await logImportExportAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "BATCH_PROCESSED",
    metadata: { jobId: job.id, batches: batches.length },
  });

  const progressPct = calculateJobProgress(
    batchResult.successCount,
    batchResult.failureCount,
    batchResult.duplicateCount,
    mappedRows.length,
  );

  await prisma.importExportJob.update({
    where: { id: job.id },
    data: {
      status:
        batchResult.failureCount > 0 && batchResult.successCount === 0 ? "FAILED" : "COMPLETED",
      progressPct,
      successCount: batchResult.successCount,
      failureCount: batchResult.failureCount,
      duplicateCount: batchResult.duplicateCount,
      completedAt: new Date(),
    },
  });

  await logImportExportAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType:
      batchResult.failureCount > 0 && batchResult.successCount === 0
        ? "IMPORT_FAILED"
        : "IMPORT_COMPLETED",
    metadata: { jobId: job.id },
  });

  await logImportExportAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "NOTIFICATION_SENT",
    metadata: { jobId: job.id, type: "IMPORT" },
  });

  await recordStructuredLog(platform, {
    level: "INFO",
    message: `Import completed: ${input.schemaKey}`,
    source: "import-export-platform",
    correlationId: job.id,
  });

  return {
    jobId: job.id,
    successCount: batchResult.successCount,
    failureCount: batchResult.failureCount,
    duplicateCount: batchResult.duplicateCount,
  };
}

export async function runExportJob(
  platform: BusinessContext,
  input: ExportJobInput,
): Promise<ExportPayloadResult> {
  assertPermission(platform, PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE);

  const schema = await getSchemaRecord(platform.business.id, input.schemaKey);
  const fields = parseSchemaFields(schema.fields);
  const records =
    input.records ??
    fields.map((field) => ({
      [field.key]: field.label,
    }));

  const serialized = serializeExportContent(input.format, records, fields);
  const fileName = input.fileName ?? `${input.schemaKey}-export.${serialized.fileExtension}`;

  const job = await prisma.importExportJob.create({
    data: {
      businessId: platform.business.id,
      schemaId: schema.id,
      userId: platform.user.id,
      jobType: "EXPORT",
      format: input.format,
      status: "PROCESSING",
      module: schema.module,
      fileName,
      source: input.source ?? "DASHBOARD",
      totalRecords: records.length,
      fieldMappings: (input.fieldMappings ?? []) as unknown as Prisma.InputJsonValue,
      outputPayload: {
        content: serialized.content,
        mimeType: serialized.mimeType,
      } as Prisma.InputJsonValue,
      startedAt: new Date(),
    },
  });

  await logImportExportAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "EXPORT_STARTED",
    metadata: { jobId: job.id, schemaKey: input.schemaKey },
  });

  if (input.source === "API") {
    await logImportExportAudit({
      businessId: platform.business.id,
      userId: platform.user.id,
      eventType: "API_EXPORT",
      metadata: { jobId: job.id },
    });
  }

  await prisma.importExportJob.update({
    where: { id: job.id },
    data: {
      status: "COMPLETED",
      progressPct: 100,
      successCount: records.length,
      completedAt: new Date(),
    },
  });

  await logImportExportAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "EXPORT_COMPLETED",
    metadata: { jobId: job.id },
  });

  await logImportExportAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "NOTIFICATION_SENT",
    metadata: { jobId: job.id, type: "EXPORT" },
  });

  await recordStructuredLog(platform, {
    level: "INFO",
    message: `Export completed: ${input.schemaKey}`,
    source: "import-export-platform",
    correlationId: job.id,
  });

  return {
    jobId: job.id,
    content: serialized.content,
    mimeType: serialized.mimeType,
    fileName,
  };
}

export async function rollbackImportJob(
  platform: BusinessContext,
  jobId: string,
): Promise<{ rolledBack: number }> {
  assertPermission(platform, PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE);

  const job = await prisma.importExportJob.findFirst({
    where: { id: jobId, businessId: platform.business.id, jobType: "IMPORT" },
  });

  if (!job) {
    throw new Error("Import job not found");
  }

  if (!canRollbackImport(job.status, job.successCount)) {
    throw new Error("Job cannot be rolled back");
  }

  const records = await prisma.importExportJobRecord.findMany({
    where: { jobId, status: "SUCCESS" },
  });

  let rolledBack = 0;
  for (const record of records) {
    await prisma.importExportJobRecord.update({
      where: { id: record.id },
      data: { status: buildRollbackRecordStatus(record.status) },
    });
    rolledBack += 1;
  }

  await prisma.importExportJob.update({
    where: { id: jobId },
    data: {
      status: "ROLLED_BACK",
      progressPct: resolveRollbackProgress(records.length, rolledBack),
      completedAt: new Date(),
    },
  });

  await logImportExportAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "IMPORT_ROLLED_BACK",
    metadata: { jobId, rolledBack },
  });

  return { rolledBack };
}

export async function createImportExportSchedule(
  platform: BusinessContext,
  input: ScheduleInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE);

  const schema = await getSchemaRecord(platform.business.id, input.schemaKey);
  const cronExpression = buildCronExpression(input.frequency);
  const nextRunAt = resolveNextScheduleRun(input.frequency);

  const schedule = await prisma.importExportSchedule.create({
    data: {
      businessId: platform.business.id,
      schemaId: schema.id,
      name: input.name,
      jobType: input.jobType,
      format: input.format,
      module: schema.module,
      frequency: input.frequency,
      cronExpression,
      fieldMappings: (input.fieldMappings ?? []) as unknown as Prisma.InputJsonValue,
      nextRunAt,
    },
  });

  await logImportExportAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "SCHEDULE_CREATED",
    metadata: { scheduleId: schedule.id, schemaKey: input.schemaKey },
  });

  return { id: schedule.id };
}

export async function triggerScheduledJob(
  platform: BusinessContext,
  scheduleId: string,
): Promise<{ jobId: string }> {
  assertPermission(platform, PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE);

  const schedule = await prisma.importExportSchedule.findFirst({
    where: { id: scheduleId, businessId: platform.business.id },
    include: { schema: true },
  });

  if (!schedule?.schema) {
    throw new Error("Schedule not found");
  }

  await logImportExportAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "SCHEDULE_TRIGGERED",
    metadata: { scheduleId },
  });

  if (schedule.jobType === "EXPORT") {
    const result = await runExportJob(platform, {
      schemaKey: schedule.schema.schemaKey,
      format: schedule.format,
      source: "SCHEDULE",
    });

    await prisma.importExportSchedule.update({
      where: { id: scheduleId },
      data: {
        lastRunAt: new Date(),
        nextRunAt: resolveNextScheduleRun(schedule.frequency),
      },
    });

    return { jobId: result.jobId };
  }

  const result = await runImportJob(platform, {
    schemaKey: schedule.schema.schemaKey,
    format: schedule.format,
    content: "[]",
    source: "SCHEDULE",
  });

  await prisma.importExportSchedule.update({
    where: { id: scheduleId },
    data: {
      lastRunAt: new Date(),
      nextRunAt: resolveNextScheduleRun(schedule.frequency),
    },
  });

  return { jobId: result.jobId };
}

export async function logImportExportDashboardAccess(
  platform: BusinessContext,
  dashboard: string,
): Promise<void> {
  await logImportExportAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "DASHBOARD_ACCESS",
    metadata: { dashboard },
  });
}

export async function getImportExportPlatformDashboard(
  businessId: string,
): Promise<ImportExportPlatformDashboardMetrics> {
  ensureBootstrapImportExportPlatform();

  const [schemas, templates, jobs, schedules] = await Promise.all([
    prisma.importExportSchema.findMany({ where: { businessId } }),
    prisma.importExportTemplate.findMany({ where: { businessId } }),
    prisma.importExportJob.findMany({ where: { businessId } }),
    prisma.importExportSchedule.findMany({ where: { businessId } }),
  ]);

  const importJobs = jobs.filter((job) => job.jobType === "IMPORT");
  const exportJobs = jobs.filter((job) => job.jobType === "EXPORT");

  return {
    totalSchemas: schemas.length,
    registeredSchemas: listImportExportSchemaDefinitions().length,
    totalTemplates: templates.length,
    totalImportJobs: importJobs.length,
    totalExportJobs: exportJobs.length,
    completedJobs: jobs.filter((job) => job.status === "COMPLETED").length,
    failedJobs: jobs.filter((job) => job.status === "FAILED").length,
    activeSchedules: schedules.filter((schedule) => schedule.isActive).length,
    totalRecordsProcessed: jobs.reduce((sum, job) => sum + job.successCount, 0),
  };
}

export async function listImportExportSchemas(businessId: string) {
  return prisma.importExportSchema.findMany({
    where: { businessId },
    orderBy: { module: "asc" },
  });
}

export async function listImportExportTemplates(businessId: string) {
  return prisma.importExportTemplate.findMany({
    where: { businessId },
    include: { schema: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listImportExportJobs(businessId: string, jobType?: "IMPORT" | "EXPORT") {
  return prisma.importExportJob.findMany({
    where: { businessId, ...(jobType ? { jobType } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listImportExportSchedules(businessId: string) {
  return prisma.importExportSchedule.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listImportExportJobRecords(jobId: string) {
  return prisma.importExportJobRecord.findMany({
    where: { jobId },
    orderBy: { rowIndex: "asc" },
    take: 100,
  });
}

export async function listImportExportPlatformAuditLogs(businessId: string) {
  return prisma.importExportPlatformAuditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listRegisteredImportExportSchemas() {
  ensureBootstrapImportExportPlatform();
  return listImportExportSchemaDefinitions();
}

export async function getImportExportApiPayload(businessId: string, schemaKey: string) {
  const schema = await getSchemaRecord(businessId, schemaKey);
  const fields = parseSchemaFields(schema.fields);

  return {
    schemaKey: schema.schemaKey,
    module: schema.module,
    name: schema.name,
    fields,
    importFormats: schema.importFormats,
    exportFormats: schema.exportFormats,
  };
}
