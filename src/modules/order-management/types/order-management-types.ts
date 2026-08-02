import type {
  OrderType,
  PaymentMethod,
  RestaurantOrderItemStatus,
  RestaurantOrderPaymentStatus,
  RestaurantOrderStatus,
} from "@prisma/client";

import type { ORDER_SORT_OPTIONS } from "@/modules/order-management/constants/routes";

export type OrderSortField = (typeof ORDER_SORT_OPTIONS)[number]["value"];

export interface OrderItemModifierInput {
  modifierOptionId: string;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
  modifierOptionIds?: string[];
  specialInstructions?: string | null;
  discountAmount?: number;
}

export interface OrderManagementInput {
  branchId: string;
  orderType: OrderType;
  customerId?: string | null;
  restaurantTableId?: string | null;
  reservationId?: string | null;
  staffId?: string | null;
  notes?: string | null;
  items: OrderItemInput[];
  discountAmount?: number;
  serviceCharge?: number;
  deliveryCharge?: number;
  tipAmount?: number;
  paymentMethod?: PaymentMethod | null;
}

export interface OrderAdjustmentsInput {
  branchId: string;
  orderId: string;
  discountAmount?: number;
  serviceCharge?: number;
  deliveryCharge?: number;
  tipAmount?: number;
}

export interface TransferOrderTableInput {
  branchId: string;
  orderId: string;
  restaurantTableId: string;
}

export interface SplitOrderInput {
  branchId: string;
  orderId: string;
  itemIds: string[];
}

export interface MergeOrdersInput {
  branchId: string;
  targetOrderId: string;
  sourceOrderIds: string[];
}

export interface OrderListQuery {
  branchId: string;
  search?: string;
  status?: RestaurantOrderStatus | "ALL";
  orderType?: OrderType | "ALL";
  paymentStatus?: RestaurantOrderPaymentStatus | "ALL";
  sortBy?: OrderSortField;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface OrderItemModifierRecord {
  id: string;
  modifierOptionId: string;
  nameSnapshot: string;
  priceAdjustment: number;
}

export interface OrderItemRecord {
  id: string;
  productId: string;
  productNameSnapshot: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  specialInstructions: string | null;
  status: RestaurantOrderItemStatus;
  modifiers: OrderItemModifierRecord[];
}

export interface OrderManagementRecord {
  id: string;
  businessId: string;
  branchId: string;
  orderNumber: string;
  orderType: OrderType;
  customerId: string | null;
  customerName: string | null;
  restaurantTableId: string | null;
  tableLabel: string | null;
  reservationId: string | null;
  reservationNumber: string | null;
  staffId: string | null;
  staffName: string | null;
  status: RestaurantOrderStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  deliveryCharge: number;
  tipAmount: number;
  totalAmount: number;
  paymentStatus: RestaurantOrderPaymentStatus;
  paymentMethod: PaymentMethod | null;
  notes: string | null;
  placedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  items: OrderItemRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResult {
  items: OrderManagementRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrderDashboardStats {
  totalToday: number;
  pendingToday: number;
  preparingToday: number;
  readyToday: number;
  completedToday: number;
  cancelledToday: number;
  unpaidToday: number;
  revenueToday: number;
}

export interface ProductSelectOption {
  id: string;
  label: string;
  price: number;
  taxRate: number | null;
  modifierGroups: Array<{
    id: string;
    name: string;
    minSelections: number;
    maxSelections: number;
    isRequired: boolean;
    options: Array<{ id: string; name: string; priceAdjustment: number }>;
  }>;
}
