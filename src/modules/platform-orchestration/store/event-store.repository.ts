import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { DomainEventEnvelope } from "@/modules/platform-orchestration/types/domain-event.types";

/** Persists domain events to the Prisma event store (`automation_events`). */
export class EventStoreRepository {
  async append(event: DomainEventEnvelope): Promise<{ id: string }> {
    const record = await prisma.automationEvent.create({
      data: {
        businessId: event.businessId,
        branchId: event.branchId,
        category: event.category,
        eventType: event.eventType,
        payload: {
          version: event.version,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          action: event.action,
          tenantId: event.tenantId,
          workspaceId: event.workspaceId,
          userId: event.userId,
          sourceModule: event.sourceModule,
          occurredAt: event.occurredAt,
          metadata: event.metadata ?? {},
          correlationId: event.correlationId ?? null,
          causationId: event.causationId ?? null,
          body: event.payload,
        } as Prisma.InputJsonValue,
        sourceModule: event.sourceModule,
      },
    });

    return { id: record.id };
  }

  async writeAuditLog(
    event: DomainEventEnvelope,
    eventId: string,
    action: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await prisma.automationAuditLog.create({
      data: {
        businessId: event.businessId,
        entityType: event.aggregateType,
        entityId: event.aggregateId,
        action,
        metadata: {
          eventId,
          eventType: event.eventType,
          branchId: event.branchId,
          userId: event.userId,
          ...metadata,
        } as Prisma.InputJsonValue,
      },
    });
  }

  async findById(eventId: string, businessId: string) {
    return prisma.automationEvent.findFirst({
      where: { id: eventId, businessId },
    });
  }
}

export const eventStoreRepository = new EventStoreRepository();
