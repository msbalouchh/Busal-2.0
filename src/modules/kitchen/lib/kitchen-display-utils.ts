import type {
  FulfilmentType,
  KitchenQueuePriority,
  KitchenQueueStation,
  KitchenQueueStatus,
} from "@prisma/client";

import {
  KITCHEN_BOARD_STATUSES,
  KITCHEN_URGENT_MINUTES,
  type KitchenBoardStatus,
  type KitchenPriorityFilterValue,
  type KitchenStationFilterValue,
  type KitchenStatusFilterValue,
} from "@/modules/kitchen/constants/routes";

export interface ClientKitchenOrderItem {
  id: string;
  quantity: number;
  name: string;
  notes: string | null;
}

export interface ClientKitchenOrderCard {
  queueItemId: string;
  orderId: string;
  orderNumber: string;
  tableName: string | null;
  fulfilmentType: FulfilmentType;
  priority: KitchenQueuePriority;
  station: KitchenQueueStation;
  status: KitchenQueueStatus;
  queuedAt: string;
  customerName: string | null;
  orderNotes: string | null;
  totalItems: number;
  items: ClientKitchenOrderItem[];
  isHighPriority: boolean;
  isUrgent: boolean;
  elapsedLabel: string;
}

export function formatElapsedMinutes(queuedAt: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - new Date(queuedAt).getTime()) / 60_000));

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h ${remainder}m`;
}

export function isUrgentQueueTime(queuedAt: string, now = Date.now()): boolean {
  const minutes = (now - new Date(queuedAt).getTime()) / 60_000;
  return minutes >= KITCHEN_URGENT_MINUTES;
}

export function serializeKitchenOrderCard(item: {
  id: string;
  orderId: string;
  priority: KitchenQueuePriority;
  station: KitchenQueueStation;
  status: KitchenQueueStatus;
  queuedAt: Date;
  order: {
    orderNumber: string;
    fulfilmentType: FulfilmentType;
    customerName: string | null;
    notes: string | null;
    table: { name: string } | null;
    items: Array<{
      id: string;
      quantity: number;
      nameSnapshot: string;
      notes: string | null;
    }>;
  };
}): ClientKitchenOrderCard {
  const queuedAt = item.queuedAt.toISOString();
  const totalItems = item.order.items.reduce((sum, entry) => sum + entry.quantity, 0);

  return {
    queueItemId: item.id,
    orderId: item.orderId,
    orderNumber: item.order.orderNumber,
    tableName: item.order.table?.name ?? null,
    fulfilmentType: item.order.fulfilmentType,
    priority: item.priority,
    station: item.station,
    status: item.status,
    queuedAt,
    customerName: item.order.customerName,
    orderNotes: item.order.notes,
    totalItems,
    items: item.order.items.map((entry) => ({
      id: entry.id,
      quantity: entry.quantity,
      name: entry.nameSnapshot,
      notes: entry.notes,
    })),
    isHighPriority: item.priority === "HIGH",
    isUrgent: isUrgentQueueTime(queuedAt),
    elapsedLabel: formatElapsedMinutes(queuedAt),
  };
}

export function filterKitchenOrders(
  orders: ClientKitchenOrderCard[],
  options: {
    searchQuery: string;
    stationFilter: KitchenStationFilterValue;
    priorityFilter: KitchenPriorityFilterValue;
    statusFilter: KitchenStatusFilterValue;
  },
): ClientKitchenOrderCard[] {
  const query = options.searchQuery.trim().toLowerCase();

  return orders.filter((order) => {
    if (options.stationFilter && order.station !== options.stationFilter) {
      return false;
    }

    if (options.priorityFilter && order.priority !== options.priorityFilter) {
      return false;
    }

    if (options.statusFilter && order.status !== options.statusFilter) {
      return false;
    }

    if (!query) {
      return true;
    }

    const orderMatch = order.orderNumber.toLowerCase().includes(query);
    const tableMatch = order.tableName?.toLowerCase().includes(query) ?? false;
    return orderMatch || tableMatch;
  });
}

export function groupKitchenOrdersByStatus(
  orders: ClientKitchenOrderCard[],
): Record<KitchenBoardStatus, ClientKitchenOrderCard[]> {
  const grouped = Object.fromEntries(
    KITCHEN_BOARD_STATUSES.map((status) => [status, [] as ClientKitchenOrderCard[]]),
  ) as Record<KitchenBoardStatus, ClientKitchenOrderCard[]>;

  for (const order of orders) {
    if (KITCHEN_BOARD_STATUSES.includes(order.status as KitchenBoardStatus)) {
      grouped[order.status as KitchenBoardStatus].push(order);
    }
  }

  return grouped;
}

export function refreshElapsedLabels(
  orders: ClientKitchenOrderCard[],
  now = Date.now(),
): ClientKitchenOrderCard[] {
  return orders.map((order) => ({
    ...order,
    isUrgent: isUrgentQueueTime(order.queuedAt, now),
    elapsedLabel: formatElapsedMinutes(order.queuedAt, now),
  }));
}
