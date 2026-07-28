"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { IMPORT_EXPORT_PLATFORM_ROUTES } from "@/modules/import-export-platform/constants/routes";
import type {
  ExportJobInput,
  ImportJobInput,
  RegisteredImportExportSchemaDefinition,
  ScheduleInput,
  TemplateInput,
} from "@/modules/import-export-platform/types/import-export-platform-types";
import {
  createImportExportSchedule,
  createImportTemplate,
  previewImportJob,
  registerModuleImportExportSchema,
  rollbackImportJob,
  runExportJob,
  runImportJob,
  triggerScheduledJob,
} from "@/services/import-export-platform.service";

export async function registerModuleImportExportSchemaAction(
  definition: RegisteredImportExportSchemaDefinition,
) {
  return protectedAction(PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE, async ({ platform }) => {
    await registerModuleImportExportSchema(platform.business.id, definition);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.registry);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.audit);
  });
}

export async function createImportTemplateAction(input: TemplateInput) {
  return protectedAction(PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await createImportTemplate(platform, input);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.templates);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function previewImportJobAction(input: ImportJobInput) {
  return protectedAction(PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await previewImportJob(platform, input);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.imports);
    return result;
  });
}

export async function runImportJobAction(input: ImportJobInput) {
  return protectedAction(PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await runImportJob(platform, input);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.imports);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.history);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function runExportJobAction(input: ExportJobInput) {
  return protectedAction(PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await runExportJob(platform, input);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.exports);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.history);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function rollbackImportJobAction(jobId: string) {
  return protectedAction(PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await rollbackImportJob(platform, jobId);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.imports);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.history);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function createImportExportScheduleAction(input: ScheduleInput) {
  return protectedAction(PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await createImportExportSchedule(platform, input);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.schedules);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function triggerScheduledJobAction(scheduleId: string) {
  return protectedAction(PERMISSION_CODES.IMPORT_EXPORT_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await triggerScheduledJob(platform, scheduleId);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.schedules);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.history);
    revalidatePath(IMPORT_EXPORT_PLATFORM_ROUTES.audit);
    return result;
  });
}
