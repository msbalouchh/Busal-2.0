function hashString(input: string): number {
  let hash = 0;

  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function isInRolloutBucket(
  flagKey: string,
  contextKey: string,
  rolloutPercentage: number,
): boolean {
  if (rolloutPercentage <= 0) {
    return false;
  }

  if (rolloutPercentage >= 100) {
    return true;
  }

  const bucket = hashString(`${flagKey}:${contextKey}`) % 100;
  return bucket < rolloutPercentage;
}

export function normalizeRolloutPercentage(percentage: number): number {
  return Math.max(0, Math.min(100, Math.round(percentage)));
}
