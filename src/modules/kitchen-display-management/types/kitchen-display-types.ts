import type {
  KitchenOrderStatus,
  OrderType,
  RestaurantOrderItemStatus,
  RestaurantOrderStatus,
} from "@prisma/client";

export interface KitchenOrderItemRecord {
  id: string;
  productId: string;
  productNameSnapshot: string;
  quantity: number;
  specialInstructions: string | null;
  status: RestaurantOrderItemStatus;
  preparingStartedAt: string | null;
  readyAt: string | null;
  preparationTimeMinutes: number | null;
  modifiers: Array<{ id: string; nameSnapshot: string }>;
}

export interface KitchenOrderRecord {
  id: string;
  branchId: string;
  orderNumber: string;
  orderType: OrderType;
  tableLabel: string | null;
  customerName: string | null;
  notes: string | null;
  status: RestaurantOrderStatus;
  kitchenStatus: KitchenOrderStatus;
  isPriority: boolean;
  placedAt: string;
  kitchenAcceptedAt: string | null;
  kitchenPreparingAt: string | null;
  kitchenReadyAt: string | null;
  kitchenServedAt: string | null;
  elapsedMinutes: number;
  items: KitchenOrderItemRecord[];
}

export interface KitchenDashboardStats {
  newCount: number;
  acceptedCount: number;
  preparingCount: number;
  readyCount: number;
  servedToday: number;
  completedToday: number;
  averagePrepMinutes: number;
  priorityCount: number;
}

export interface KitchenStationRecord {
  id: string;
  businessId: string;
  branchId: string;
  name: string;
  description: string | null;
  displayOrder: number;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  productCount: number;
  productIds: string[];
}

export interface KitchenStationInput {
  branchId: string;
  name: string;
  description?: string | null;
  displayOrder?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  productIds?: string[];
}

export interface KitchenQueueQuery {
  branchId: string;
  stationId?: string | null;
  search?: string;
  status?: KitchenOrderStatus | "ALL";
}

export interface KitchenItemStatusInput {
  branchId: string;
  orderId: string;
  itemId: string;
  status: RestaurantOrderItemStatus;
}
