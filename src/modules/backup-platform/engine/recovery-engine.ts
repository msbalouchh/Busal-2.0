import type { RecoveryJobStatus } from "@prisma/client";

export function calculateRecoveryProgress(currentStep: number, totalSteps: number): number {
  if (totalSteps <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((currentStep / totalSteps) * 100));
}

export function isRecoveryComplete(status: RecoveryJobStatus): boolean {
  return status === "COMPLETED" || status === "FAILED" || status === "CANCELLED";
}

export function buildRestorePreviewData(input: {
  backupKey: string;
  scope: string;
  recordCount: number;
}): Record<string, unknown> {
  return {
    backupKey: input.backupKey,
    scope: input.scope,
    recordCount: input.recordCount,
    previewGeneratedAt: new Date().toISOString(),
    safeToRestore: true,
  };
}

export function resolveRecoveryJobSteps(jobType: string): number {
  const stepMap: Record<string, number> = {
    PITR: 5,
    TENANT_RESTORE: 6,
    BUSINESS_RESTORE: 4,
    BRANCH_RESTORE: 3,
    PREVIEW: 2,
  };

  return stepMap[jobType] ?? 3;
}
