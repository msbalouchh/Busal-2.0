"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { BACKUP_PLATFORM_ROUTES } from "@/modules/backup-platform/constants/routes";
import type {
  CreateBackupInput,
  DisasterRecoveryPlanInput,
  RegisteredBackupPolicyDefinition,
  RetentionPolicyInput,
  StartRecoveryJobInput,
} from "@/modules/backup-platform/types/backup-platform-types";
import {
  createBackup,
  registerModuleBackupPolicy,
  startRecoveryJob,
  upsertBackupRetentionPolicy,
  upsertDisasterRecoveryPlan,
  verifyBackupRecord,
} from "@/services/backup-platform.service";

export async function registerModuleBackupPolicyAction(
  definition: RegisteredBackupPolicyDefinition,
) {
  return protectedAction(PERMISSION_CODES.BACKUP_PLATFORM_MANAGE, async ({ platform }) => {
    await registerModuleBackupPolicy(platform.business.id, definition);
    revalidatePath(BACKUP_PLATFORM_ROUTES.registry);
    revalidatePath(BACKUP_PLATFORM_ROUTES.audit);
  });
}

export async function createBackupAction(input: CreateBackupInput) {
  return protectedAction(PERMISSION_CODES.BACKUP_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await createBackup(platform, input);
    revalidatePath(BACKUP_PLATFORM_ROUTES.backups);
    revalidatePath(BACKUP_PLATFORM_ROUTES.monitoring);
    revalidatePath(BACKUP_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function verifyBackupRecordAction(backupId: string) {
  return protectedAction(PERMISSION_CODES.BACKUP_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await verifyBackupRecord(platform, backupId);
    revalidatePath(BACKUP_PLATFORM_ROUTES.backups);
    revalidatePath(BACKUP_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function startRecoveryJobAction(input: StartRecoveryJobInput) {
  return protectedAction(PERMISSION_CODES.BACKUP_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await startRecoveryJob(platform, input);
    revalidatePath(BACKUP_PLATFORM_ROUTES.recovery);
    revalidatePath(BACKUP_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function upsertDisasterRecoveryPlanAction(input: DisasterRecoveryPlanInput) {
  return protectedAction(PERMISSION_CODES.BACKUP_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await upsertDisasterRecoveryPlan(platform, input);
    revalidatePath(BACKUP_PLATFORM_ROUTES.plans);
    revalidatePath(BACKUP_PLATFORM_ROUTES.audit);
    return result;
  });
}

export async function upsertBackupRetentionPolicyAction(input: RetentionPolicyInput) {
  return protectedAction(PERMISSION_CODES.BACKUP_PLATFORM_MANAGE, async ({ platform }) => {
    const result = await upsertBackupRetentionPolicy(platform, input);
    revalidatePath(BACKUP_PLATFORM_ROUTES.retention);
    return result;
  });
}
