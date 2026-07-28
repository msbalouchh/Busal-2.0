import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  serializeImportExportAuditLog,
  serializeImportExportPlatformDashboard,
  serializeJob,
  serializeSchedule,
  serializeSchema,
  serializeTemplate,
} from "@/modules/import-export-platform/utils/import-export-platform-utils";
import {
  ensureImportExportPlatformDefaults,
  getImportExportPlatformDashboard,
  listImportExportJobs,
  listImportExportPlatformAuditLogs,
  listImportExportSchedules,
  listImportExportSchemas,
  listImportExportTemplates,
  listRegisteredImportExportSchemas,
  logImportExportDashboardAccess,
} from "@/services/import-export-platform.service";

export const getImportExportPlatformOverviewContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_VIEW });
  await ensureImportExportPlatformDefaults(context.business.id);
  await logImportExportDashboardAccess(context, "overview");
  const dashboard = await getImportExportPlatformDashboard(context.business.id);

  return {
    context,
    dashboard: serializeImportExportPlatformDashboard(dashboard),
  };
});

export const getImportExportPlatformImportsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_VIEW });
  const importJobs = await listImportExportJobs(context.business.id, "IMPORT");

  return {
    context,
    importJobs: importJobs.map(serializeJob),
  };
});

export const getImportExportPlatformExportsContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_VIEW });
  const exportJobs = await listImportExportJobs(context.business.id, "EXPORT");

  return {
    context,
    exportJobs: exportJobs.map(serializeJob),
  };
});

export const getImportExportPlatformTemplatesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_VIEW });
  const templates = await listImportExportTemplates(context.business.id);

  return {
    context,
    templates: templates.map(serializeTemplate),
  };
});

export const getImportExportPlatformSchedulesContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_VIEW });
  const schedules = await listImportExportSchedules(context.business.id);

  return {
    context,
    schedules: schedules.map(serializeSchedule),
  };
});

export const getImportExportPlatformHistoryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_VIEW });
  const history = await listImportExportJobs(context.business.id);

  return {
    context,
    history: history.map(serializeJob),
  };
});

export const getImportExportPlatformRegistryContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_VIEW });
  const [schemas, registrations] = await Promise.all([
    listImportExportSchemas(context.business.id),
    listRegisteredImportExportSchemas(),
  ]);

  return {
    context,
    schemas: schemas.map(serializeSchema),
    registrations,
  };
});

export const getImportExportPlatformAuditContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_VIEW });
  const auditLogs = await listImportExportPlatformAuditLogs(context.business.id);

  return {
    context,
    auditLogs: auditLogs.map(serializeImportExportAuditLog),
  };
});
