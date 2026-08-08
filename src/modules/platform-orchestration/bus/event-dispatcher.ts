import "server-only";

import {
  DEFAULT_MAX_JOB_ATTEMPTS,
  ORCHESTRATION_EVENT_VERSION,
  type DomainEventAction,
} from "@/modules/platform-orchestration/constants/domain-events";
import { jobQueueRepository } from "@/modules/platform-orchestration/queue/job-queue.repository";
import { getSubscribersForEvent } from "@/modules/platform-orchestration/registry/subscriber-registry";
import type {
  DomainEventDispatchResult,
  DomainEventEnvelope,
  DomainEventHandlerResult,
} from "@/modules/platform-orchestration/types/domain-event.types";

/** Dispatches domain events to registered subscribers (sync and async). */
export class EventDispatcher {
  async dispatch(event: DomainEventEnvelope): Promise<DomainEventDispatchResult> {
    const subscribers = getSubscribersForEvent(event.eventType);
    const syncResults: DomainEventHandlerResult[] = [];
    const queuedJobIds: string[] = [];

    for (const subscriber of subscribers) {
      if (subscriber.async) {
        const job = await jobQueueRepository.enqueueJob(event.branchId, {
          type: subscriber.jobType ?? "integration",
          eventId: event.id ?? "",
          eventType: event.eventType,
          subscriber: subscriber.subscriberId,
          maxAttempts: DEFAULT_MAX_JOB_ATTEMPTS,
          payload: { event },
          scope: {
            tenantId: event.tenantId,
            workspaceId: event.workspaceId,
            businessId: event.businessId,
            branchId: event.branchId,
            userId: event.userId,
          },
          scheduledAt: new Date().toISOString(),
        });
        queuedJobIds.push(job.id);
        continue;
      }

      const started = Date.now();
      try {
        const output = await subscriber.handler(event);
        syncResults.push({
          subscriber: subscriber.subscriberId,
          success: true,
          durationMs: Date.now() - started,
          output: output ?? undefined,
        });
      } catch (error) {
        syncResults.push({
          subscriber: subscriber.subscriberId,
          success: false,
          durationMs: Date.now() - started,
          error: error instanceof Error ? error.message : "Unknown subscriber error",
        });
      }
    }

    return {
      eventId: event.id ?? "",
      eventType: event.eventType,
      duplicate: false,
      syncResults,
      queuedJobIds,
    };
  }
}

export const eventDispatcher = new EventDispatcher();

export function parseEventAction(eventType: string): DomainEventAction {
  const action = eventType.split(".").pop() ?? "created";
  const known = [
    "created",
    "updated",
    "deleted",
    "assigned",
    "completed",
    "cancelled",
    "paid",
    "refunded",
    "failed",
    "approved",
    "rejected",
    "activated",
    "deactivated",
    "clocked_in",
    "clocked_out",
    "low_stock",
    "deducted",
    "recorded",
    "dispatched",
    "opened",
    "login",
    "sent",
  ] as const;

  if (known.includes(action as (typeof known)[number])) {
    return action as DomainEventAction;
  }

  return "created";
}

export function buildEnvelopeVersion(eventType: string): number {
  void eventType;
  return ORCHESTRATION_EVENT_VERSION;
}
