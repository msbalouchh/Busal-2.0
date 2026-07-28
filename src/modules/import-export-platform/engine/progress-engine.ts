export function calculateJobProgress(
  successCount: number,
  failureCount: number,
  duplicateCount: number,
  totalRecords: number,
): number {
  if (totalRecords === 0) {
    return 0;
  }
  const processed = successCount + failureCount + duplicateCount;
  return Math.min(100, Math.round((processed / totalRecords) * 100));
}

export function isJobComplete(status: string): boolean {
  return ["COMPLETED", "FAILED", "ROLLED_BACK", "CANCELLED"].includes(status);
}

export function resolveNextScheduleRun(frequency: string, from = new Date()): Date {
  const next = new Date(from);
  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }
  return next;
}

export function buildCronExpression(frequency: string): string {
  switch (frequency) {
    case "DAILY":
      return "0 2 * * *";
    case "WEEKLY":
      return "0 2 * * 0";
    case "MONTHLY":
      return "0 2 1 * *";
    default:
      return "0 2 * * *";
  }
}
