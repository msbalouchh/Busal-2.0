export function calculateUsagePercentage(used: number, limit: number): number {
  if (limit <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((used / limit) * 100));
}

export function isLimitExceeded(used: number, limit: number): boolean {
  return used >= limit;
}

export function countUsageBreaches(usages: Array<{ used: number; limit: number }>): number {
  return usages.filter((entry) => isLimitExceeded(entry.used, entry.limit)).length;
}

export function formatBytes(bytes: bigint | number): string {
  const value = typeof bytes === "bigint" ? Number(bytes) : bytes;
  if (value >= 1073741824) {
    return `${(value / 1073741824).toFixed(2)} GB`;
  }
  if (value >= 1048576) {
    return `${(value / 1048576).toFixed(2)} MB`;
  }
  return `${value} bytes`;
}
