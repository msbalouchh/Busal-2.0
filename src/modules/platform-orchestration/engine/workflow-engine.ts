import "server-only";

import { prisma } from "@/lib/prisma";
import {
  defaultOrchestrationBranchMeta,
  jobQueueRepository,
} from "@/modules/platform-orchestration/queue/job-queue.repository";
import type { DomainEventEnvelope } from "@/modules/platform-orchestration/types/domain-event.types";
import { bridgeAiContextUpdate } from "@/modules/platform-orchestration/bridges/module-bridges";

/** Keeps AI context snapshots fresh on every important business event. */
export async function updateAiContextFromEvent(event: DomainEventEnvelope): Promise<void> {
  const snapshot = await bridgeAiContextUpdate(event);
  await jobQueueRepository.updateAiContextSnapshot(
    event.branchId,
    event.eventType,
    event.aggregateId,
    snapshot,
  );
}

export async function getAiContextSnapshot(
  branchId: string,
  eventType?: string,
  aggregateId?: string,
): Promise<Record<string, unknown> | null> {
  const settings = await prisma.branchSettings.findUnique({
    where: { branchId },
    select: { settings: true },
  });

  const raw = settings?.settings;
  if (!raw || typeof raw !== "object" || raw === null || !("orchestrationOperations" in raw)) {
    return null;
  }

  const snapshots = (
    raw as unknown as { orchestrationOperations: ReturnType<typeof defaultOrchestrationBranchMeta> }
  ).orchestrationOperations.aiContextSnapshots;

  const match = snapshots.find(
    (item) =>
      (!eventType || item.eventType === eventType) &&
      (!aggregateId || item.aggregateId === aggregateId),
  );

  return match?.snapshot ?? null;
}
