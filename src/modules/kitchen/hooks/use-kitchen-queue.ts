"use client";

import { useMemo } from "react";

import { useKitchenContext } from "@/modules/kitchen/hooks/use-kitchen";
import {
  filterActiveQueueRecords,
  sortKitchenQueue,
} from "@/modules/kitchen/utils/kitchen-queue-utils";
import type { KitchenQueueContextValue } from "@/modules/kitchen/types/kitchen";

export function useKitchenQueue(queueId?: string): KitchenQueueContextValue {
  const { queues, records, refresh } = useKitchenContext();

  return useMemo<KitchenQueueContextValue>(() => {
    const queue = queueId ? (queues.find((q) => q.id === queueId) ?? null) : (queues[0] ?? null);

    if (!queue) {
      return {
        queue: null,
        queuedRecords: [],
        sortStrategy: "priority",
        refresh,
      };
    }

    const ticketSet = new Set(queue.ticketIds);
    const queueRecords = records.filter((record) =>
      record.tickets.some((ticket) => ticketSet.has(ticket.id)),
    );

    const activeRecords = sortKitchenQueue(
      filterActiveQueueRecords(queueRecords),
      queue.sortStrategy,
    );

    return {
      queue,
      queuedRecords: activeRecords,
      sortStrategy: queue.sortStrategy,
      refresh,
    };
  }, [queueId, queues, records, refresh]);
}
