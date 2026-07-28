import type {
  BackupAuditEventType,
  BackupScope,
  BackupStatus,
  BackupTriggerType,
  RecoveryJobStatus,
  RecoveryJobType,
} from "@prisma/client";

export interface RegisteredBackupPolicyDefinition {
  policyKey: string;
  name: string;
  module: string;
  scope: BackupScope;
  scheduleCron?: string | null;
  retentionDays?: number;
  encryptionKeyId?: string | null;
  metadata?: Record<string, unknown>;
  isActive: boolean;
}

export interface CreateBackupInput {
  policyKey?: string;
  triggerType: BackupTriggerType;
  scope: BackupScope;
  branchId?: string | null;
  pitrTimestamp?: Date | null;
  sizeBytes?: number;
  storagePath?: string;
  metadata?: Record<string, unknown>;
}

export interface StartRecoveryJobInput {
  backupId: string;
  jobType: RecoveryJobType;
  branchId?: string | null;
  pitrTimestamp?: Date | null;
}

export interface DisasterRecoveryPlanInput {
  name: string;
  description?: string;
  rtoMinutes?: number;
  rpoMinutes?: number;
  steps?: Array<{ order: number; action: string }>;
}

export interface RetentionPolicyInput {
  name: string;
  retentionDays?: number;
  archiveEnabled?: boolean;
}

export interface BackupPlatformDashboardMetrics {
  totalBackups: number;
  verifiedBackups: number;
  failedBackups: number;
  activeRecoveryJobs: number;
  completedRecoveries: number;
  registeredPolicies: number;
  drPlans: number;
  recentBackups: number;
}

export interface BackupRecordView {
  id: string;
  backupKey: string;
  triggerType: BackupTriggerType;
  scope: BackupScope;
  status: BackupStatus;
  sizeBytes: string;
  verifiedAt: string | null;
  createdAt: string;
}

export interface RecoveryJobView {
  id: string;
  jobType: RecoveryJobType;
  status: RecoveryJobStatus;
  progressPct: number;
  createdAt: string;
  completedAt: string | null;
}

export interface BackupPolicyView {
  id: string;
  policyKey: string;
  name: string;
  module: string;
  scope: BackupScope;
  retentionDays: number;
  isActive: boolean;
}

export interface DisasterRecoveryPlanView {
  id: string;
  name: string;
  description: string;
  rtoMinutes: number;
  rpoMinutes: number;
  isActive: boolean;
}

export interface RetentionPolicyView {
  id: string;
  name: string;
  retentionDays: number;
  archiveEnabled: boolean;
}

export interface BackupAuditLogView {
  id: string;
  eventType: BackupAuditEventType;
  createdAt: string;
}

export interface RestorePreviewResult {
  jobId: string;
  previewData: Record<string, unknown>;
  status: RecoveryJobStatus;
}
