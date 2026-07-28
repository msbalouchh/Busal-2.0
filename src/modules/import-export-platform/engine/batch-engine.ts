import { DEFAULT_BATCH_SIZE } from "@/modules/import-export-platform/constants/routes";
import type { BatchProcessResult } from "@/modules/import-export-platform/types/import-export-platform-types";

export function splitIntoBatches<T>(items: T[], batchSize = DEFAULT_BATCH_SIZE): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

export function calculateBatchProgress(
  processed: number,
  total: number,
): BatchProcessResult["progressPct"] {
  if (total === 0) {
    return 100;
  }
  return Math.min(100, Math.round((processed / total) * 100));
}

export function accumulateBatchResult(
  current: BatchProcessResult,
  batch: { success: number; failed: number; duplicates: number },
  total: number,
): BatchProcessResult {
  const processed = current.processed + batch.success + batch.failed + batch.duplicates;
  return {
    processed,
    successCount: current.successCount + batch.success,
    failureCount: current.failureCount + batch.failed,
    duplicateCount: current.duplicateCount + batch.duplicates,
    progressPct: calculateBatchProgress(processed, total),
  };
}
