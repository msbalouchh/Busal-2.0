import "server-only";

import { prisma } from "@/lib/prisma";
import { ensureOrchestrationBootstrap } from "@/modules/platform-orchestration/plugins/bootstrap-orchestration";
import { queueProcessor } from "@/modules/platform-orchestration/workers/queue-processor";
import type { QueueProcessResult } from "@/modules/platform-orchestration/workers/queue-processor";

export interface OrchestrationWorkerRunResult {
  branchesProcessed: number;
  totalProcessed: number;
  totalSucceeded: number;
  totalFailed: number;
  totalDeadLettered: number;
  branchResults: Array<{ branchId: string; result: QueueProcessResult }>;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

let workerInterval: ReturnType<typeof setInterval> | null = null;
let workerRunning = false;

/** Processes orchestration queues for all active branches. */
export async function runOrchestrationWorker(limit = 25): Promise<OrchestrationWorkerRunResult> {
  ensureOrchestrationBootstrap();

  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const branchResults: OrchestrationWorkerRunResult["branchResults"] = [];
  let totalProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;
  let totalDeadLettered = 0;

  for (const branch of branches) {
    const result = await queueProcessor.processBranchQueue(branch.id, limit);
    branchResults.push({ branchId: branch.id, result });
    totalProcessed += result.processed;
    totalSucceeded += result.succeeded;
    totalFailed += result.failed;
    totalDeadLettered += result.deadLettered;
  }

  return {
    branchesProcessed: branches.length,
    totalProcessed,
    totalSucceeded,
    totalFailed,
    totalDeadLettered,
    branchResults,
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startMs,
  };
}

export function startOrchestrationWorkerInterval(intervalMs = 30_000, limit = 25): void {
  if (workerInterval || process.env.DISABLE_ORCHESTRATION_WORKER === "true") {
    return;
  }

  workerInterval = setInterval(async () => {
    if (workerRunning) {
      return;
    }

    workerRunning = true;
    try {
      await runOrchestrationWorker(limit);
    } catch (error) {
      console.error("[orchestration-worker] Queue processing failed", error);
    } finally {
      workerRunning = false;
    }
  }, intervalMs);

  if (typeof workerInterval === "object" && "unref" in workerInterval) {
    workerInterval.unref();
  }
}

export function stopOrchestrationWorkerInterval(): void {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
}

export function isOrchestrationWorkerRunning(): boolean {
  return workerRunning;
}
