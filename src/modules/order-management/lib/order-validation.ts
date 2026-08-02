import type { RestaurantOrderStatus } from "@prisma/client";

import type {
  OrderItemInput,
  OrderManagementInput,
} from "@/modules/order-management/types/order-management-types";

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function validateOrderInput(input: OrderManagementInput): void {
  if (!input.branchId?.trim()) {
    throw new Error("Branch is required");
  }

  if (!input.orderType) {
    throw new Error("Order type is required");
  }

  if (input.orderType === "DINE_IN" && !input.restaurantTableId) {
    throw new Error("Dine-in orders require a table");
  }

  if (!input.items?.length) {
    throw new Error("Order must contain at least one item");
  }

  for (const item of input.items) {
    validateOrderItemInput(item);
  }

  for (const field of ["discountAmount", "serviceCharge", "deliveryCharge", "tipAmount"] as const) {
    const value = input[field];
    if (value != null && (Number.isNaN(value) || value < 0)) {
      throw new Error(`${field} must be zero or greater`);
    }
  }
}

export function validateOrderItemInput(item: OrderItemInput): void {
  if (!item.productId?.trim()) {
    throw new Error("Product is required");
  }

  if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  if (
    item.discountAmount != null &&
    (Number.isNaN(item.discountAmount) || item.discountAmount < 0)
  ) {
    throw new Error("Item discount must be zero or greater");
  }
}

export function validateOrderStatusTransition(
  currentStatus: RestaurantOrderStatus,
  nextStatus: RestaurantOrderStatus,
): void {
  if (currentStatus === nextStatus) {
    return;
  }

  if (["COMPLETED", "CANCELLED"].includes(currentStatus)) {
    throw new Error(`Cannot change status from ${currentStatus}`);
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
    throw new Error(`Invalid status transition from ${currentStatus} to ${nextStatus}`);
  }
}

export function calculateLineAmounts(
  unitPrice: number,
  quantity: number,
  modifierTotal: number,
  taxRate: number | null,
  discountAmount = 0,
): { taxAmount: number; totalAmount: number } {
  const base = roundMoney((unitPrice + modifierTotal) * quantity);
  const discounted = roundMoney(Math.max(0, base - discountAmount));
  const taxAmount = taxRate ? roundMoney((discounted * taxRate) / 100) : 0;
  return {
    taxAmount,
    totalAmount: roundMoney(discounted + taxAmount),
  };
}

export function calculateOrderTotals(input: {
  items: Array<{ totalAmount: number; taxAmount: number }>;
  discountAmount?: number;
  serviceCharge?: number;
  deliveryCharge?: number;
  tipAmount?: number;
}): {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
} {
  const subtotal = roundMoney(
    input.items.reduce((sum, item) => sum + item.totalAmount - item.taxAmount, 0),
  );
  const taxAmount = roundMoney(input.items.reduce((sum, item) => sum + item.taxAmount, 0));
  const discountAmount = roundMoney(input.discountAmount ?? 0);
  const serviceCharge = roundMoney(input.serviceCharge ?? 0);
  const deliveryCharge = roundMoney(input.deliveryCharge ?? 0);
  const tipAmount = roundMoney(input.tipAmount ?? 0);
  const totalAmount = roundMoney(
    subtotal - discountAmount + taxAmount + serviceCharge + deliveryCharge + tipAmount,
  );

  return { subtotal, taxAmount, totalAmount };
}

export function buildDuplicateOrderNumber(orderNumber: string): string {
  const base = orderNumber.trim();
  const copyMatch = base.match(/^(.*)-SPLIT(?:-(\d+))?$/);

  if (copyMatch) {
    const root = copyMatch[1];
    const attempt = copyMatch[2] ? Number(copyMatch[2]) + 1 : 2;
    return `${root}-SPLIT-${attempt}`;
  }

  return `${base}-SPLIT`;
}
