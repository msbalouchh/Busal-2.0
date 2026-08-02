import type { FulfilmentType, OrderStatus, ReservationStatus } from "@prisma/client";

import type {
  CategoryData,
  MenuItemData,
  ModifierGroupData,
} from "@/services/menu-management.service";
import type { ReservationData } from "@/services/reservation.service";
import type { TableData } from "@/services/table.service";

export interface RestaurantOperationsPermissions {
  canViewMenu: boolean;
  canManageMenu: boolean;
  canViewTables: boolean;
  canManageTables: boolean;
  canViewReservations: boolean;
  canManageReservations: boolean;
  canViewOrders: boolean;
  canManageOrders: boolean;
  canViewKitchen: boolean;
  canUpdateKitchen: boolean;
  canUsePos: boolean;
  canViewInventory: boolean;
  canManageInventory: boolean;
}

export interface RestaurantDashboardWidgets {
  todaysSalesPence: number;
  activeOrders: number;
  kitchenQueueCount: number;
  todaysReservations: number;
  occupiedTables: number;
  staffOnShift: number;
  inventoryAlerts: number;
}

export interface SerializedOrderQueueItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  fulfilmentType: FulfilmentType;
  customerName: string | null;
  customerPhone: string | null;
  tableName: string | null;
  total: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  amountPaidPence: number;
  remainingBalancePence: number;
  kitchenStatus: string | null;
  itemCount: number;
  createdAt: string;
}

export interface OrderQueueQuery {
  search?: string;
  status?: OrderStatus;
  fulfilmentType?: FulfilmentType;
  paymentStatus?: "UNPAID" | "PARTIAL" | "PAID";
  page?: number;
  pageSize?: number;
}

export interface OrderQueueResult {
  items: SerializedOrderQueueItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SerializedTableFloorItem extends TableData {
  qrCodeCount: number;
  activeReservationCount: number;
}

export interface SerializedReservationEntry extends ReservationData {
  tableId: string | null;
  tableName: string | null;
  isWaitlist: boolean;
}

export interface ReservationOperationsBundle {
  reservations: SerializedReservationEntry[];
  waitlist: SerializedReservationEntry[];
  calendarDays: Array<{ date: string; count: number }>;
}

export interface RestaurantOperationsBundle {
  permissions: RestaurantOperationsPermissions;
  widgets: RestaurantDashboardWidgets;
  recentOrders: SerializedOrderQueueItem[];
}

export interface MenuOperationsBundle {
  categories: CategoryData[];
  menuItems: MenuItemData[];
  modifierGroups: ModifierGroupData[];
}

export interface MergeTablesInput {
  targetTableId: string;
  sourceTableIds: string[];
}

export interface SplitTablesInput {
  targetTableId: string;
  sourceTableIds: string[];
  restoredCapacities: Record<string, number>;
}

export interface BulkMenuAvailabilityInput {
  menuItemIds: string[];
  isAvailable: boolean;
}

export interface ReservationOperationsQuery {
  view?: "calendar" | "daily" | "weekly";
  date?: string;
  status?: ReservationStatus;
}
