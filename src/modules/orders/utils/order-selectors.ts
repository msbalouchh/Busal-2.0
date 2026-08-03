import { ORDER_STATUSES, type OrderStatus } from "@/modules/orders/constants/order-status";
import type { OrderRecord } from "@/modules/orders/types/order";

export function formatOrderTotal(pence: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(pence / 100);
}

export function getOrderSummary(record: OrderRecord): string {
  const { order, items } = record;
  const itemLabel = items.length === 1 ? "1 item" : `${items.length} items`;
  const customer = order.customerName ?? "Walk-in";

  return `${order.orderNumber} · ${customer} · ${itemLabel} · ${formatOrderTotal(order.totalPence, order.currency)}`;
}

export function isActiveOrder(status: OrderStatus): boolean {
  return (
    status !== ORDER_STATUSES.COMPLETED &&
    status !== ORDER_STATUSES.CANCELLED &&
    status !== ORDER_STATUSES.REFUNDED &&
    status !== ORDER_STATUSES.DRAFT
  );
}

export function sortByCreatedDesc(records: OrderRecord[]): OrderRecord[] {
  return [...records].sort(
    (a, b) => new Date(b.order.createdAt).getTime() - new Date(a.order.createdAt).getTime(),
  );
}

export function filterActiveOrders(records: OrderRecord[]): OrderRecord[] {
  return records.filter((record) => isActiveOrder(record.order.status));
}

export function countByStatus(records: OrderRecord[]): Record<OrderStatus, number> {
  const counts = Object.fromEntries(
    Object.values(ORDER_STATUSES).map((status) => [status, 0]),
  ) as Record<OrderStatus, number>;

  for (const record of records) {
    const status = record.order.status;
    counts[status] = (counts[status] ?? 0) + 1;
  }

  return counts;
}
