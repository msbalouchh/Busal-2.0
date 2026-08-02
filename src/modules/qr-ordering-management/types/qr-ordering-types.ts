import type {
  KitchenOrderStatus,
  QRCodeStatus,
  QRSessionStatus,
  RestaurantOrderStatus,
} from "@prisma/client";
import type { OrderItemInput } from "@/modules/order-management/types/order-management-types";

export interface TableQrCodeRecord {
  id: string;
  businessId: string;
  branchId: string;
  tableId: string;
  token: string;
  qrCodeUrl: string;
  status: QRCodeStatus;
  lastGeneratedAt: string;
  tableLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface QrSessionRecord {
  id: string;
  token: string;
  customerName: string | null;
  customerPhone: string | null;
  sessionStatus: QRSessionStatus;
  expiresAt: string;
  waiterRequestedAt: string | null;
  billRequestedAt: string | null;
  businessName: string;
  branchName: string;
  tableLabel: string;
}

export interface QrMenuCategory {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
}

export interface QrMenuModifierOption {
  id: string;
  name: string;
  priceAdjustment: number;
}

export interface QrMenuModifierGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  options: QrMenuModifierOption[];
}

export interface QrMenuProduct {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  image: string | null;
  isFeatured: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  preparationTime: number | null;
  modifierGroups: QrMenuModifierGroup[];
}

export interface QrCartItem {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  modifierOptionIds: string[];
  modifierLabels: string[];
  modifierTotal: number;
  specialInstructions?: string | null;
}

export interface QrCartState {
  items: QrCartItem[];
  updatedAt: string;
}

export interface QrPlaceOrderInput {
  sessionToken: string;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  items: OrderItemInput[];
  idempotencyKey?: string;
}

export interface QrOrderSummary {
  id: string;
  orderNumber: string;
  status: RestaurantOrderStatus;
  kitchenStatus: KitchenOrderStatus;
  totalAmount: number;
  placedAt: string;
}

export interface QrOrderTrackingRecord extends QrOrderSummary {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    status: string;
    modifiers: string[];
  }>;
}

export interface QrDashboardStats {
  totalCodes: number;
  activeCodes: number;
  inactiveCodes: number;
  archivedCodes: number;
  tablesWithoutQr: number;
}

export interface QrTableAssignmentOption {
  id: string;
  label: string;
  hasQrCode: boolean;
  qrCodeUrl: string | null;
  qrStatus: QRCodeStatus | null;
}
