import type {
  BackupPlatformAuditLog,
  BackupPolicy,
  BackupRecord,
  BackupRetentionPolicy,
  DisasterRecoveryPlan,
  RecoveryJob,
} from "@prisma/client";

import type {
  BackupAuditLogView,
  BackupPlatformDashboardMetrics,
  BackupPolicyView,
  BackupRecordView,
  DisasterRecoveryPlanView,
  RecoveryJobView,
  RetentionPolicyView,
} from "@/modules/backup-platform/types/backup-platform-types";

export function serializeBackupRecord(record: BackupRecord): BackupRecordView {
  return {
    id: record.id,
    backupKey: record.backupKey,
    triggerType: record.triggerType,
    scope: record.scope,
    status: record.status,
    sizeBytes: record.sizeBytes.toString(),
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
  };
}

export function serializeRecoveryJob(job: RecoveryJob): RecoveryJobView {
  return {
    id: job.id,
    jobType: job.jobType,
    status: job.status,
    progressPct: job.progressPct,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  };
}

export function serializeBackupPolicy(policy: BackupPolicy): BackupPolicyView {
  return {
    id: policy.id,
    policyKey: policy.policyKey,
    name: policy.name,
    module: policy.module,
    scope: policy.scope,
    retentionDays: policy.retentionDays,
    isActive: policy.isActive,
  };
}

export function serializeDisasterRecoveryPlan(
  plan: DisasterRecoveryPlan,
): DisasterRecoveryPlanView {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    rtoMinutes: plan.rtoMinutes,
    rpoMinutes: plan.rpoMinutes,
    isActive: plan.isActive,
  };
}

export function serializeRetentionPolicy(policy: BackupRetentionPolicy): RetentionPolicyView {
  return {
    id: policy.id,
    name: policy.name,
    retentionDays: policy.retentionDays,
    archiveEnabled: policy.archiveEnabled,
  };
}

export function serializeBackupAuditLog(log: BackupPlatformAuditLog): BackupAuditLogView {
  return {
    id: log.id,
    eventType: log.eventType,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeBackupPlatformDashboard(
  metrics: BackupPlatformDashboardMetrics,
): BackupPlatformDashboardMetrics {
  return metrics;
}

export type BackupPlatformDashboardView = BackupPlatformDashboardMetrics;
