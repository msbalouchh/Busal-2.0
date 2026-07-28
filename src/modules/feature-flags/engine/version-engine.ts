export function buildNextFlagVersion(currentVersion: number): number {
  return currentVersion + 1;
}

export function canRollbackFlag(currentVersion: number): boolean {
  return currentVersion > 1;
}

export interface FlagVersionSnapshot {
  version: number;
  previousConfig: Record<string, unknown>;
  changeReason?: string | null;
  createdAt: Date;
}

export function serializeFlagConfig(flag: {
  name: string;
  description: string;
  flagType: string;
  status: string;
  defaultEnabled: boolean;
  rolloutPercentage: number;
  scheduledActivateAt: Date | null;
  scheduledDeactivateAt: Date | null;
  conditions: unknown;
  metadata: unknown;
}): Record<string, unknown> {
  return {
    name: flag.name,
    description: flag.description,
    flagType: flag.flagType,
    status: flag.status,
    defaultEnabled: flag.defaultEnabled,
    rolloutPercentage: flag.rolloutPercentage,
    scheduledActivateAt: flag.scheduledActivateAt?.toISOString() ?? null,
    scheduledDeactivateAt: flag.scheduledDeactivateAt?.toISOString() ?? null,
    conditions: flag.conditions,
    metadata: flag.metadata,
  };
}
