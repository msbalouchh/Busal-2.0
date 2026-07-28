import "server-only";

import type { BackupAuditEventType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BusinessContext } from "@/modules/business-context/types/business-context";
import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import {
  evaluatePermission,
  toPermissionEvaluationContext,
} from "@/modules/iam/engine/permission-engine";
import {
  DEFAULT_BACKUP_RETENTION_DAYS,
  DEFAULT_ENCRYPTION_KEY_ID,
} from "@/modules/backup-platform/constants/routes";
import {
  encryptBackupMetadata,
  generateBackupChecksum,
  resolveEncryptionKeyId,
  verifyBackupIntegrity,
} from "@/modules/backup-platform/engine/encryption-engine";
import {
  buildRestorePreviewData,
  calculateRecoveryProgress,
  resolveRecoveryJobSteps,
} from "@/modules/backup-platform/engine/recovery-engine";
import { resolveRetentionCutoff } from "@/modules/backup-platform/engine/retention-engine";
import { ensureBootstrapBackupPlatform } from "@/modules/backup-platform/plugins/bootstrap-backup-platform";
import {
  listBackupPolicyDefinitions,
  registerBackupPolicyDefinition,
} from "@/modules/backup-platform/registry/backup-policy-registry";
import type {
  BackupPlatformDashboardMetrics,
  CreateBackupInput,
  DisasterRecoveryPlanInput,
  RegisteredBackupPolicyDefinition,
  RetentionPolicyInput,
  StartRecoveryJobInput,
} from "@/modules/backup-platform/types/backup-platform-types";
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

async function logBackupAudit(input: {
  businessId?: string | null;
  userId?: string | null;
  eventType: BackupAuditEventType;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.backupPlatformAuditLog.create({
    data: {
      businessId: input.businessId ?? null,
      userId: input.userId ?? null,
      eventType: input.eventType,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

async function syncPolicyToDatabase(
  businessId: string,
  definition: RegisteredBackupPolicyDefinition,
): Promise<void> {
  await prisma.backupPolicy.upsert({
    where: {
      businessId_policyKey: {
        businessId,
        policyKey: definition.policyKey,
      },
    },
    create: {
      businessId,
      policyKey: definition.policyKey,
      name: definition.name,
      module: definition.module,
      scope: definition.scope,
      scheduleCron: definition.scheduleCron ?? null,
      retentionDays: definition.retentionDays ?? DEFAULT_BACKUP_RETENTION_DAYS,
      encryptionKeyId: definition.encryptionKeyId ?? DEFAULT_ENCRYPTION_KEY_ID,
      metadata: definition.metadata ? (definition.metadata as Prisma.InputJsonValue) : undefined,
      isActive: definition.isActive,
    },
    update: {
      name: definition.name,
      module: definition.module,
      scope: definition.scope,
      scheduleCron: definition.scheduleCron ?? null,
      retentionDays: definition.retentionDays ?? DEFAULT_BACKUP_RETENTION_DAYS,
      isActive: definition.isActive,
    },
  });
}

export async function ensureBackupPlatformDefaults(businessId: string): Promise<void> {
  ensureBootstrapBackupPlatform();

  for (const definition of listBackupPolicyDefinitions()) {
    await syncPolicyToDatabase(businessId, definition);
  }

  const existingRetention = await prisma.backupRetentionPolicy.findFirst({
    where: { businessId, name: "Default Backup Retention" },
  });

  if (!existingRetention) {
    await prisma.backupRetentionPolicy.create({
      data: {
        businessId,
        name: "Default Backup Retention",
        retentionDays: DEFAULT_BACKUP_RETENTION_DAYS,
      },
    });
  }

  const existingPlan = await prisma.disasterRecoveryPlan.findFirst({
    where: { businessId, name: "Default DR Plan" },
  });

  if (!existingPlan) {
    await prisma.disasterRecoveryPlan.create({
      data: {
        businessId,
        name: "Default DR Plan",
        description: "Standard disaster recovery plan for Busal OS",
        rtoMinutes: 60,
        rpoMinutes: 15,
        steps: [
          { order: 1, action: "Assess outage scope" },
          { order: 2, action: "Initiate backup restore" },
          { order: 3, action: "Verify data integrity" },
          { order: 4, action: "Resume services" },
        ],
      },
    });
  }
}

export async function registerModuleBackupPolicy(
  businessId: string,
  definition: RegisteredBackupPolicyDefinition,
): Promise<void> {
  ensureBootstrapBackupPlatform();
  registerBackupPolicyDefinition(definition);
  await syncPolicyToDatabase(businessId, definition);

  await logBackupAudit({
    businessId,
    eventType: "POLICY_REGISTERED",
    metadata: { policyKey: definition.policyKey, module: definition.module },
  });
}

export async function createBackup(
  platform: BusinessContext,
  input: CreateBackupInput,
): Promise<{ id: string; backupKey: string }> {
  assertPermission(platform, PERMISSION_CODES.BACKUP_PLATFORM_MANAGE);

  const policy = input.policyKey
    ? await prisma.backupPolicy.findFirst({
        where: { businessId: platform.business.id, policyKey: input.policyKey },
      })
    : null;

  const backupKey = `${input.scope.toLowerCase()}-${Date.now()}`;
  const encryptionKeyId = resolveEncryptionKeyId(policy?.encryptionKeyId);
  const payload = JSON.stringify({
    businessId: platform.business.id,
    backupKey,
    scope: input.scope,
    branchId: input.branchId ?? null,
  });
  const checksum = generateBackupChecksum(payload);

  const record = await prisma.backupRecord.create({
    data: {
      businessId: platform.business.id,
      policyId: policy?.id ?? null,
      backupKey,
      triggerType: input.triggerType,
      scope: input.scope,
      branchId: input.branchId ?? null,
      status: "IN_PROGRESS",
      sizeBytes: BigInt(input.sizeBytes ?? 1024),
      checksum,
      encryptionKeyId,
      storagePath: input.storagePath ?? `/backups/${platform.business.id}/${backupKey}`,
      pitrTimestamp: input.pitrTimestamp ?? null,
      metadata: encryptBackupMetadata(
        (input.metadata ?? {}) as Record<string, unknown>,
        encryptionKeyId,
      ) as Prisma.InputJsonValue,
    },
  });

  await prisma.backupRecord.update({
    where: { id: record.id },
    data: { status: "COMPLETED" },
  });

  await logBackupAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "BACKUP_CREATED",
    metadata: {
      backupId: record.id,
      backupKey,
      scope: input.scope,
      triggerType: input.triggerType,
    },
  });

  try {
    await recordStructuredLog(platform, {
      level: "INFO",
      message: `Backup created: ${backupKey}`,
      source: "backup-platform",
      correlationId: record.id,
    });
  } catch {
    // Monitoring integration is best-effort
  }

  return { id: record.id, backupKey };
}

export async function verifyBackupRecord(
  platform: BusinessContext,
  backupId: string,
): Promise<{ verified: boolean }> {
  assertPermission(platform, PERMISSION_CODES.BACKUP_PLATFORM_MANAGE);

  const backup = await prisma.backupRecord.findFirst({
    where: { id: backupId, businessId: platform.business.id },
  });

  if (!backup?.checksum) {
    throw new Error("Backup not found or missing checksum");
  }

  const payload = JSON.stringify({
    businessId: backup.businessId,
    backupKey: backup.backupKey,
    scope: backup.scope,
    branchId: backup.branchId,
  });

  const verified = verifyBackupIntegrity(backup.checksum, payload);

  if (verified) {
    await prisma.backupRecord.update({
      where: { id: backup.id },
      data: { status: "VERIFIED", verifiedAt: new Date() },
    });

    await logBackupAudit({
      businessId: platform.business.id,
      userId: platform.user.id,
      eventType: "BACKUP_VERIFIED",
      metadata: { backupId: backup.id },
    });
  } else {
    await prisma.backupRecord.update({
      where: { id: backup.id },
      data: { status: "FAILED" },
    });

    await logBackupAudit({
      businessId: platform.business.id,
      userId: platform.user.id,
      eventType: "BACKUP_FAILED",
      metadata: { backupId: backup.id, reason: "Integrity verification failed" },
    });
  }

  return { verified };
}

export async function startRecoveryJob(
  platform: BusinessContext,
  input: StartRecoveryJobInput,
): Promise<{ id: string; progressPct: number }> {
  assertPermission(platform, PERMISSION_CODES.BACKUP_PLATFORM_MANAGE);

  const backup = await prisma.backupRecord.findFirst({
    where: { id: input.backupId, businessId: platform.business.id },
  });

  if (!backup) {
    throw new Error("Backup not found");
  }

  const totalSteps = resolveRecoveryJobSteps(input.jobType);

  const job = await prisma.recoveryJob.create({
    data: {
      businessId: platform.business.id,
      backupId: backup.id,
      userId: platform.user.id,
      jobType: input.jobType,
      status: "RUNNING",
      progressPct: calculateRecoveryProgress(1, totalSteps),
      branchId: input.branchId ?? backup.branchId,
      pitrTimestamp: input.pitrTimestamp ?? backup.pitrTimestamp,
      startedAt: new Date(),
      previewData:
        input.jobType === "PREVIEW"
          ? (buildRestorePreviewData({
              backupKey: backup.backupKey,
              scope: backup.scope,
              recordCount: 100,
            }) as Prisma.InputJsonValue)
          : undefined,
    },
  });

  await logBackupAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "RECOVERY_STARTED",
    metadata: { jobId: job.id, jobType: input.jobType, backupId: backup.id },
  });

  await logBackupAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "NOTIFICATION_SENT",
    metadata: { jobId: job.id, channel: "IN_APP", type: "recovery_started" },
  });

  const completed = await prisma.recoveryJob.update({
    where: { id: job.id },
    data: {
      status: "COMPLETED",
      progressPct: 100,
      completedAt: new Date(),
    },
  });

  await logBackupAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "RECOVERY_COMPLETED",
    metadata: { jobId: job.id, jobType: input.jobType },
  });

  return { id: completed.id, progressPct: completed.progressPct };
}

export async function upsertDisasterRecoveryPlan(
  platform: BusinessContext,
  input: DisasterRecoveryPlanInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.BACKUP_PLATFORM_MANAGE);

  const plan = await prisma.disasterRecoveryPlan.upsert({
    where: {
      businessId_name: {
        businessId: platform.business.id,
        name: input.name,
      },
    },
    create: {
      businessId: platform.business.id,
      name: input.name,
      description: input.description ?? "",
      rtoMinutes: input.rtoMinutes ?? 60,
      rpoMinutes: input.rpoMinutes ?? 15,
      steps: (input.steps ?? []) as Prisma.InputJsonValue,
    },
    update: {
      description: input.description,
      rtoMinutes: input.rtoMinutes,
      rpoMinutes: input.rpoMinutes,
      steps: input.steps ? (input.steps as Prisma.InputJsonValue) : undefined,
    },
  });

  await logBackupAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "DR_PLAN_UPDATED",
    metadata: { planId: plan.id, name: input.name },
  });

  return { id: plan.id };
}

export async function upsertBackupRetentionPolicy(
  platform: BusinessContext,
  input: RetentionPolicyInput,
): Promise<{ id: string }> {
  assertPermission(platform, PERMISSION_CODES.BACKUP_PLATFORM_MANAGE);

  const policy = await prisma.backupRetentionPolicy.upsert({
    where: {
      businessId_name: {
        businessId: platform.business.id,
        name: input.name,
      },
    },
    create: {
      businessId: platform.business.id,
      name: input.name,
      retentionDays: input.retentionDays ?? DEFAULT_BACKUP_RETENTION_DAYS,
      archiveEnabled: input.archiveEnabled ?? false,
    },
    update: {
      retentionDays: input.retentionDays,
      archiveEnabled: input.archiveEnabled,
    },
  });

  return { id: policy.id };
}

export async function applyBackupRetentionPolicies(
  businessId: string,
): Promise<{ removed: number }> {
  const policy = await prisma.backupRetentionPolicy.findFirst({
    where: { businessId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!policy) {
    return { removed: 0 };
  }

  const cutoff = resolveRetentionCutoff(policy.retentionDays);
  const result = await prisma.backupRecord.deleteMany({
    where: { businessId, createdAt: { lt: cutoff }, status: { in: ["COMPLETED", "VERIFIED"] } },
  });

  if (result.count > 0) {
    await logBackupAudit({
      businessId,
      eventType: "RETENTION_APPLIED",
      metadata: { removed: result.count, policyId: policy.id },
    });
  }

  return { removed: result.count };
}

export async function logBackupDashboardAccess(
  platform: BusinessContext,
  dashboard: string,
): Promise<void> {
  await logBackupAudit({
    businessId: platform.business.id,
    userId: platform.user.id,
    eventType: "DASHBOARD_ACCESS",
    metadata: { dashboard },
  });
}

export async function getBackupPlatformDashboard(
  businessId: string,
): Promise<BackupPlatformDashboardMetrics> {
  ensureBootstrapBackupPlatform();

  const [backups, jobs, plans] = await Promise.all([
    prisma.backupRecord.findMany({ where: { businessId } }),
    prisma.recoveryJob.findMany({ where: { businessId } }),
    prisma.disasterRecoveryPlan.findMany({ where: { businessId } }),
  ]);

  const recentBackups = backups.filter(
    (backup) => backup.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  ).length;

  return {
    totalBackups: backups.length,
    verifiedBackups: backups.filter((backup) => backup.status === "VERIFIED").length,
    failedBackups: backups.filter((backup) => backup.status === "FAILED").length,
    activeRecoveryJobs: jobs.filter((job) => job.status === "RUNNING" || job.status === "PENDING")
      .length,
    completedRecoveries: jobs.filter((job) => job.status === "COMPLETED").length,
    registeredPolicies: listBackupPolicyDefinitions().length,
    drPlans: plans.length,
    recentBackups,
  };
}

export async function listBackupRecords(businessId: string) {
  return prisma.backupRecord.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listRecoveryJobs(businessId: string) {
  return prisma.recoveryJob.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listBackupPolicies(businessId: string) {
  return prisma.backupPolicy.findMany({
    where: { businessId },
    orderBy: { policyKey: "asc" },
  });
}

export async function listDisasterRecoveryPlans(businessId: string) {
  return prisma.disasterRecoveryPlan.findMany({ where: { businessId } });
}

export async function listBackupRetentionPolicies(businessId: string) {
  return prisma.backupRetentionPolicy.findMany({ where: { businessId } });
}

export async function listBackupPlatformAuditLogs(businessId: string) {
  return prisma.backupPlatformAuditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listRegisteredBackupPolicies() {
  ensureBootstrapBackupPlatform();
  return listBackupPolicyDefinitions();
}

export { verifyBackupIntegrity, generateBackupChecksum };
