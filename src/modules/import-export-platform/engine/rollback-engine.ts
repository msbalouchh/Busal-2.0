export function canRollbackImport(status: string, successCount: number): boolean {
  return status === "COMPLETED" && successCount > 0;
}

export function buildRollbackRecordStatus(currentStatus: string): string {
  if (currentStatus === "SUCCESS") {
    return "ROLLED_BACK";
  }
  return currentStatus;
}

export function resolveRollbackProgress(totalRecords: number, rolledBack: number): number {
  if (totalRecords === 0) {
    return 100;
  }
  return Math.min(100, Math.round((rolledBack / totalRecords) * 100));
}
