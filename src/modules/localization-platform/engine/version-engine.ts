export function buildNextTranslationVersion(currentVersion: number): number {
  return currentVersion + 1;
}

export function canRollbackTranslation(version: number): boolean {
  return version > 1;
}

export function resolveVersionLabel(version: number): string {
  return `v${version}`;
}
