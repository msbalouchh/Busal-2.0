export function resolveRetentionCutoff(retentionDays: number, now = new Date()): Date {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

export function shouldArchiveBackup(
  archiveEnabled: boolean,
  ageDays: number,
  retentionDays: number,
): boolean {
  return archiveEnabled && ageDays > retentionDays;
}

export function countExpiredBackups(
  backups: Array<{ createdAt: Date }>,
  retentionDays: number,
  now = new Date(),
): number {
  const cutoff = resolveRetentionCutoff(retentionDays, now);
  return backups.filter((backup) => backup.createdAt < cutoff).length;
}
