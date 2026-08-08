import "server-only";

import { getSubscribersForEvent } from "@/modules/platform-orchestration/registry/subscriber-registry";
import { jobQueueRepository } from "@/modules/platform-orchestration/queue/job-queue.repository";
import type {
  DomainEventEnvelope,
  OrchestrationJob,
} from "@/modules/platform-orchestration/types/domain-event.types";

export interface QueueProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  deadLettered: number;
  jobIds: string[];
}

/** Processes pending orchestration background jobs with retry and DLQ handling. */
export class QueueProcessor {
  async processBranchQueue(branchId: string, limit = 25): Promise<QueueProcessResult> {
    const pending = await jobQueueRepository.getPendingJobs(branchId, limit);
    const result: QueueProcessResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      deadLettered: 0,
      jobIds: [],
    };

    for (const job of pending) {
      result.processed += 1;
      result.jobIds.push(job.id);

      await jobQueueRepository.updateJob(branchId, job.id, {
        status: "processing",
        startedAt: new Date().toISOString(),
      });

      try {
        await this.executeJob(job);
        await jobQueueRepository.updateJob(branchId, job.id, {
          status: "completed",
          completedAt: new Date().toISOString(),
          lastError: null,
        });
        result.succeeded += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Queue job failed";
        const beforeRetry = job.attemptCount;
        await jobQueueRepository.markJobRetry(branchId, job, message);

        if (beforeRetry + 1 >= job.maxAttempts) {
          result.deadLettered += 1;
        } else {
          result.failed += 1;
        }
      }
    }

    return result;
  }

  private async executeJob(job: OrchestrationJob): Promise<void> {
    const eventPayload = job.payload.event as DomainEventEnvelope | undefined;
    if (!eventPayload) {
      throw new Error(`Job ${job.id} missing event payload`);
    }

    const event: DomainEventEnvelope = {
      ...eventPayload,
      id: job.eventId || eventPayload.id,
    };

    const subscribers = getSubscribersForEvent(job.eventType);
    const subscriber = subscribers.find((item) => item.subscriberId === job.subscriber);

    if (!subscriber) {
      throw new Error(`Subscriber not found: ${job.subscriber}`);
    }

    await subscriber.handler(event);
  }
}

export const queueProcessor = new QueueProcessor();
