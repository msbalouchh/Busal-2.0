import type { KitchenPriority, KitchenStatus } from "@/modules/kitchen/constants/kitchen-status";
import type { KitchenItem, KitchenRecord, KitchenTicket } from "@/modules/kitchen/types/kitchen";

export function getKitchenOrderSummary(record: KitchenRecord): string {
  const items = record.items.map((item) => `${item.quantity}x ${item.menuItemName}`).join(", ");
  const table = record.order.tableLabel ? ` — ${record.order.tableLabel}` : "";
  return `#${record.order.orderNumber}${table}: ${items}`;
}

export function getKitchenOrderLabel(record: KitchenRecord): string {
  return `#${record.order.orderNumber}`;
}

export function getActiveItems(record: KitchenRecord): KitchenItem[] {
  return record.items.filter((item) => item.status !== "served" && item.status !== "cancelled");
}

export function getItemsByStation(record: KitchenRecord, stationId: string): KitchenItem[] {
  return record.items.filter((item) => item.stationId === stationId);
}

export function getTicketForStation(
  record: KitchenRecord,
  stationId: string,
): KitchenTicket | null {
  return record.tickets.find((ticket) => ticket.stationId === stationId) ?? null;
}

export function isOrderDelayed(record: KitchenRecord): boolean {
  return record.order.status === "delayed" || record.delays.some((d) => !d.isResolved);
}

export function getDelayMinutes(record: KitchenRecord): number {
  return record.delays.reduce((sum, delay) => sum + delay.delayMinutes, 0);
}

export function getPriorityRank(priority: KitchenPriority): number {
  const ranks: Record<KitchenPriority, number> = {
    vip: 5,
    urgent: 4,
    high: 3,
    normal: 2,
    low: 1,
  };
  return ranks[priority];
}

export function isTerminalStatus(status: KitchenStatus): boolean {
  return status === "served" || status === "cancelled";
}

export function countItemsByStatus(record: KitchenRecord, status: KitchenStatus): number {
  return record.items.filter((item) => item.status === status).length;
}

export function getStationUtilization(record: KitchenRecord): Record<string, number> {
  return record.analytics.stationUtilization;
}
