import "server-only";

import { prisma } from "@/lib/prisma";
import { domainEventBus } from "@/modules/platform-orchestration/bus/domain-event-bus";
import { publishDomainEvent, type PublishDomainEventInput } from "@/modules/platform-orchestration/publishers/domain-event-publisher";
import { jobQueueRepository } from "@/modules/platform-orchestration/queue/job-queue.repository";
import {
  bootstrapDomainEventRegistry,
  listDomainEventDefinitions,
} from "@/modules/platform-orchestration/registry/event-registry";
import { listDomainEventSubscribers } from "@/modules/platform-orchestration/registry/subscriber-registry";
import { eventStoreRepository } from "@/modules/platform-orchestration/store/event-store.repository";
import { queueProcessor } from "@/modules/platform-orchestration/workers/queue-processor";
import type { OrchestrationMetrics } from "@/modules/platform-orchestration/types/domain-event.types";
import { ensureOrchestrationBootstrap } from "@/modules/platform-orchestration/plugins/bootstrap-orchestration";

/** High-level orchestration service for publish, replay, queue, and registry introspection. */
export class OrchestrationService {
  async publish(input: PublishDomainEventInput) {
    ensureOrchestrationBootstrap();
    return publishDomainEvent(input);
  }

  async replay(eventId: string, businessId: string) {
    ensureOrchestrationBootstrap();
    return domainEventBus.replayEvent(eventId, businessId);
  }

  async processQueue(branchId: string, limit = 25) {
    ensureOrchestrationBootstrap();
    return queueProcessor.processBranchQueue(branchId, limit);
  }

  async getMetrics(branchId: string): Promise<OrchestrationMetrics> {
    return jobQueueRepository.getMetrics(branchId);
  }

  getRegistry() {
    ensureOrchestrationBootstrap();
    bootstrapDomainEventRegistry();
    return {
      events: listDomainEventDefinitions(),
      subscribers: listDomainEventSubscribers(),
    };
  }

  async listRecentEvents(businessId: string, limit = 50, eventType?: string) {
    return prisma.automationEvent.findMany({
      where: {
        businessId,
        ...(eventType ? { eventType } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getEventById(eventId: string, businessId: string) {
    return eventStoreRepository.findById(eventId, businessId);
  }
}

export const orchestrationService = new OrchestrationService();
