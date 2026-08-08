import "server-only";

import { processAutomationEvent } from "@/services/ai-automation.service";

import { eventDispatcher, parseEventAction } from "@/modules/platform-orchestration/bus/event-dispatcher";
import { ensureOrchestrationBootstrap } from "@/modules/platform-orchestration/plugins/bootstrap-orchestration";
import { jobQueueRepository } from "@/modules/platform-orchestration/queue/job-queue.repository";
import {
  bootstrapDomainEventRegistry,
  getDomainEventDefinition,
} from "@/modules/platform-orchestration/registry/event-registry";
import { eventStoreRepository } from "@/modules/platform-orchestration/store/event-store.repository";
import type {
  DomainEventDispatchResult,
  DomainEventEnvelope,
} from "@/modules/platform-orchestration/types/domain-event.types";
import { runAutomationEngineForEvent } from "@/modules/platform-orchestration/engine/automation-engine";
import { updateAiContextFromEvent } from "@/modules/platform-orchestration/engine/workflow-engine";

export interface PublishDomainEventInput {
  eventType: string;
  aggregateId: string;
  tenantId: string;
  workspaceId: string;
  businessId: string;
  branchId: string;
  userId: string;
  payload?: Record<string, unknown>;
  idempotencyKey?: string;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, unknown>;
}

/** Central domain event bus — persist, audit, dispatch, and enqueue. */
export class DomainEventBus {
  async publish(input: PublishDomainEventInput): Promise<DomainEventDispatchResult> {
    ensureOrchestrationBootstrap();
    bootstrapDomainEventRegistry();

    const definition = getDomainEventDefinition(input.eventType);
    if (!definition) {
      throw new Error(`Unregistered domain event type: ${input.eventType}`);
    }

    if (input.idempotencyKey) {
      const duplicate = await jobQueueRepository.hasIdempotencyKey(input.branchId, input.idempotencyKey);
      if (duplicate) {
        return {
          eventId: "",
          eventType: input.eventType,
          duplicate: true,
          syncResults: [],
          queuedJobIds: [],
        };
      }
    }

    const envelope: DomainEventEnvelope = {
      version: definition.version,
      eventType: input.eventType,
      aggregateType: definition.aggregateType,
      aggregateId: input.aggregateId,
      action: parseEventAction(input.eventType),
      occurredAt: new Date().toISOString(),
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      businessId: input.businessId,
      branchId: input.branchId,
      userId: input.userId,
      sourceModule: definition.sourceModule,
      category: definition.category,
      payload: input.payload ?? {},
      metadata: input.metadata,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId,
      causationId: input.causationId,
    };

    const started = Date.now();
    const stored = await eventStoreRepository.append(envelope);
    envelope.id = stored.id;

    await eventStoreRepository.writeAuditLog(envelope, stored.id, "domain_event_published");

    const dispatchResult = await eventDispatcher.dispatch(envelope);

    await updateAiContextFromEvent(envelope);
    await runAutomationEngineForEvent(stored.id, input.businessId, input.eventType);

    if (input.idempotencyKey) {
      await jobQueueRepository.recordIdempotencyKey(input.branchId, input.idempotencyKey);
    }

    const success = dispatchResult.syncResults.every((result) => result.success);
    await jobQueueRepository.recordDispatchMetrics(input.branchId, Date.now() - started, success);

    return { ...dispatchResult, eventId: stored.id };
  }

  async replayEvent(eventId: string, businessId: string): Promise<DomainEventDispatchResult | null> {
    ensureOrchestrationBootstrap();

    const record = await eventStoreRepository.findById(eventId, businessId);
    if (!record) {
      return null;
    }

    const payload = record.payload as Record<string, unknown>;
    const body = (payload.body ?? {}) as Record<string, unknown>;

    const envelope: DomainEventEnvelope = {
      id: record.id,
      version: Number(payload.version ?? 1),
      eventType: record.eventType,
      aggregateType: String(payload.aggregateType ?? "unknown"),
      aggregateId: String(payload.aggregateId ?? record.id),
      action: String(payload.action ?? "created") as DomainEventEnvelope["action"],
      occurredAt: String(payload.occurredAt ?? record.createdAt.toISOString()),
      tenantId: String(payload.tenantId ?? businessId),
      workspaceId: String(payload.workspaceId ?? businessId),
      businessId: record.businessId,
      branchId: record.branchId ?? "",
      userId: String(payload.userId ?? "system"),
      sourceModule: record.sourceModule as DomainEventEnvelope["sourceModule"],
      category: record.category,
      payload: body,
      metadata: (payload.metadata ?? {}) as Record<string, unknown>,
    };

    const dispatchResult = await eventDispatcher.dispatch(envelope);
    await processAutomationEvent(record.id, businessId);
    return dispatchResult;
  }
}

export const domainEventBus = new DomainEventBus();
