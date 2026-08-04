import type { KitchenQueueSortStrategy } from "@/modules/kitchen/constants/kitchen-status";
import type { KitchenRecord } from "@/modules/kitchen/types/kitchen";
import { getPriorityRank } from "@/modules/kitchen/utils/kitchen-selectors";

export function sortKitchenQueue(
  records: KitchenRecord[],
  strategy: KitchenQueueSortStrategy,
): KitchenRecord[] {
  const sorted = [...records];

  switch (strategy) {
    case "fifo":
      return sorted.sort(
        (a, b) => new Date(a.order.queuedAt).getTime() - new Date(b.order.queuedAt).getTime(),
      );
    case "promised_time":
      return sorted.sort((a, b) => {
        const aTime = a.order.promisedAt ? new Date(a.order.promisedAt).getTime() : Infinity;
        const bTime = b.order.promisedAt ? new Date(b.order.promisedAt).getTime() : Infinity;
        return aTime - bTime;
      });
    case "station":
      return sorted.sort((a, b) => {
        const aStation = a.tickets[0]?.stationId ?? "";
        const bStation = b.tickets[0]?.stationId ?? "";
        return aStation.localeCompare(bStation);
      });
    case "priority":
    default:
      return sorted.sort(
        (a, b) => getPriorityRank(b.order.priority) - getPriorityRank(a.order.priority),
      );
  }
}

export function filterActiveQueueRecords(records: KitchenRecord[]): KitchenRecord[] {
  return records.filter(
    (record) => record.order.status !== "served" && record.order.status !== "cancelled",
  );
}

export function getNextQueueOrder(records: KitchenRecord[]): KitchenRecord | null {
  const active = filterActiveQueueRecords(records);
  const sorted = sortKitchenQueue(active, "priority");
  return sorted[0] ?? null;
}

export function groupRecordsByStation(records: KitchenRecord[]): Map<string, KitchenRecord[]> {
  const groups = new Map<string, KitchenRecord[]>();

  for (const record of records) {
    for (const ticket of record.tickets) {
      if (!ticket.stationId) {
        continue;
      }

      const existing = groups.get(ticket.stationId) ?? [];
      existing.push(record);
      groups.set(ticket.stationId, existing);
    }
  }

  return groups;
}

export function estimateQueueWaitMinutes(records: KitchenRecord[]): number {
  const active = filterActiveQueueRecords(records);
  return active.reduce((sum, record) => {
    const ticketPrep = record.tickets.reduce(
      (ticketSum, ticket) => ticketSum + ticket.estimatedPrepMinutes,
      0,
    );
    return sum + ticketPrep;
  }, 0);
}
