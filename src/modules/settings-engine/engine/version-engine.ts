export interface VersionSnapshot {
  version: number;
  previousValue: unknown;
  changedById?: string | null;
  changeReason?: string | null;
  createdAt: Date;
}

export function buildNextVersion(currentVersion: number): number {
  return currentVersion + 1;
}

export function selectRollbackVersion(
  versions: VersionSnapshot[],
  targetVersion: number,
): VersionSnapshot | undefined {
  return versions.find((entry) => entry.version === targetVersion);
}

export function sortVersionsDescending(versions: VersionSnapshot[]): VersionSnapshot[] {
  return [...versions].sort((a, b) => b.version - a.version);
}

export function canRollback(currentVersion: number): boolean {
  return currentVersion > 1;
}
