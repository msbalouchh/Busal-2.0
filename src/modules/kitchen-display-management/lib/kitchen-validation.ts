import type {
  KitchenOrderStatus,
  RestaurantOrderItemStatus,
  RestaurantOrderStatus,
} from "@prisma/client";

const ORDER_TO_KITCHEN: Record<RestaurantOrderStatus, KitchenOrderStatus> = {
  PENDING: "NEW",
  CONFIRMED: "ACCEPTED",
  PREPARING: "PREPARING",
  READY: "READY",
  SERVED: "SERVED",
  COMPLETED: "COMPLETED",
  CANCELLED: "COMPLETED",
};

const KITCHEN_TO_ORDER: Record<Exclude<KitchenOrderStatus, "COMPLETED">, RestaurantOrderStatus> = {
  NEW: "PENDING",
  ACCEPTED: "CONFIRMED",
  PREPARING: "PREPARING",
  READY: "READY",
  SERVED: "SERVED",
};

export function mapOrderStatusToKitchen(status: RestaurantOrderStatus): KitchenOrderStatus {
  return ORDER_TO_KITCHEN[status];
}

export function mapKitchenStatusToOrder(
  status: Exclude<KitchenOrderStatus, "COMPLETED">,
): RestaurantOrderStatus {
  return KITCHEN_TO_ORDER[status];
}

export function validateKitchenOrderTransition(
  currentStatus: RestaurantOrderStatus,
  nextStatus: RestaurantOrderStatus,
): void {
  if (currentStatus === nextStatus) return;

  if (["COMPLETED", "CANCELLED"].includes(currentStatus)) {
    throw new Error(`Cannot update kitchen workflow from ${currentStatus}`);
  }

  const allowed: Record<RestaurantOrderStatus, RestaurantOrderStatus[]> = {
    PENDING: ["CONFIRMED", "PREPARING", "CANCELLED"],
    CONFIRMED: ["PREPARING", "CANCELLED"],
    PREPARING: ["READY", "CANCELLED"],
    READY: ["SERVED", "CANCELLED"],
    SERVED: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  };

  if (!allowed[currentStatus].includes(nextStatus)) {
    throw new Error(`Invalid kitchen transition from ${currentStatus} to ${nextStatus}`);
  }
}

export function validateKitchenItemStatusTransition(
  currentStatus: RestaurantOrderItemStatus,
  nextStatus: RestaurantOrderItemStatus,
): void {
  if (currentStatus === nextStatus) return;

  if (currentStatus === "CANCELLED") {
    throw new Error("Cannot update a cancelled item");
  }

  const allowed: Record<RestaurantOrderItemStatus, RestaurantOrderItemStatus[]> = {
    PENDING: ["PREPARING", "CANCELLED"],
    PREPARING: ["READY", "CANCELLED"],
    READY: ["SERVED", "CANCELLED"],
    SERVED: [],
    CANCELLED: [],
  };

  if (!allowed[currentStatus].includes(nextStatus)) {
    throw new Error(`Invalid item transition from ${currentStatus} to ${nextStatus}`);
  }
}

export function validateKitchenStationInput(input: { name?: string; branchId?: string }): void {
  if (!input.branchId?.trim()) {
    throw new Error("Branch is required");
  }

  const name = input.name?.trim();
  if (!name) {
    throw new Error("Station name is required");
  }

  if (name.length < 2 || name.length > 80) {
    throw new Error("Station name must be 2-80 characters");
  }
}

export function calculateElapsedMinutes(fromIso: string): number {
  const diff = Date.now() - new Date(fromIso).getTime();
  return Math.max(0, Math.floor(diff / 60_000));
}
