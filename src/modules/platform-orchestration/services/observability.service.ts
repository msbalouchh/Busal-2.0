import "server-only";

import { jobQueueRepository } from "@/modules/platform-orchestration/queue/job-queue.repository";
import { isOrchestrationWorkerRunning } from "@/modules/platform-orchestration/workers/orchestration-worker";
import type { OrchestrationMetrics } from "@/modules/platform-orchestration/types/domain-event.types";

export interface OrchestrationObservabilitySnapshot {
  metrics: OrchestrationMetrics;
  workerStatus: "idle" | "processing" | "disabled";
  workerActive: boolean;
  queueLength: number;
  deadLetterLength: number;
  averageProcessingLatencyMs: number;
  publishedEvents: number;
  processedJobs: number;
  failedJobsEstimate: number;
  successRatePercent: number;
}

/** Observability helpers for orchestration metrics and worker health. */
export class OrchestrationObservabilityService {
  async getSnapshot(branchId: string): Promise<OrchestrationObservabilitySnapshot> {
    const metrics = await jobQueueRepository.getMetrics(branchId);
    const pending = await jobQueueRepository.getPendingJobs(branchId, 500);
    const workerActive = isOrchestrationWorkerRunning();

    return {
      metrics,
      workerStatus:
        process.env.DISABLE_ORCHESTRATION_WORKER === "true"
          ? "disabled"
          : workerActive || pending.length > 0
            ? "processing"
            : "idle",
      workerActive,
      queueLength: metrics.pendingJobs,
      deadLetterLength: metrics.deadLetterCount,
      averageProcessingLatencyMs: metrics.averageDispatchMs,
      publishedEvents: metrics.totalEvents,
      processedJobs: metrics.totalJobs - metrics.pendingJobs,
      failedJobsEstimate: Math.max(0, metrics.deadLetterCount),
      successRatePercent: metrics.successRateBps / 100,
    };
  }
}

export const orchestrationObservabilityService = new OrchestrationObservabilityService();
