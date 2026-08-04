import type { KitchenPreparation } from "@/modules/kitchen/types/kitchen";

export function getElapsedSeconds(preparation: KitchenPreparation, nowMs = Date.now()): number {
  if (preparation.isPaused && preparation.pausedAt) {
    const pausedAt = new Date(preparation.pausedAt).getTime();
    const startedAt = new Date(preparation.startedAt).getTime();
    return Math.floor((pausedAt - startedAt) / 1000);
  }

  const startedAt = new Date(preparation.startedAt).getTime();
  return Math.floor((nowMs - startedAt) / 1000);
}

export function getRemainingSeconds(preparation: KitchenPreparation, nowMs = Date.now()): number {
  const estimatedEnd = new Date(preparation.estimatedEndAt).getTime();
  const remaining = Math.floor((estimatedEnd - nowMs) / 1000);
  return Math.max(0, remaining);
}

export function isPrepOvertime(preparation: KitchenPreparation, nowMs = Date.now()): boolean {
  return getRemainingSeconds(preparation, nowMs) === 0 && !preparation.isPaused;
}

export function formatElapsedTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function estimateCompletionAt(startedAt: string, estimatedPrepMinutes: number): string {
  const start = new Date(startedAt).getTime();
  return new Date(start + estimatedPrepMinutes * 60_000).toISOString();
}

export function getMinutesSinceQueued(queuedAt: string, nowMs = Date.now()): number {
  const queued = new Date(queuedAt).getTime();
  return Math.floor((nowMs - queued) / 60_000);
}

export function isUrgentByWaitTime(queuedAt: string, thresholdMinutes: number): boolean {
  return getMinutesSinceQueued(queuedAt) >= thresholdMinutes;
}
