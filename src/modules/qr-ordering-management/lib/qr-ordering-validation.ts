import type { OrderItemInput } from "@/modules/order-management/types/order-management-types";
import type {
  QrCartItem,
  QrMenuProduct,
} from "@/modules/qr-ordering-management/types/qr-ordering-types";

const TOKEN_PATTERN = /^[a-f0-9]{48}$/;

export function validateQrTableToken(token: string): void {
  if (!token?.trim() || !TOKEN_PATTERN.test(token.trim())) {
    throw new Error("Invalid QR code");
  }
}

export function validateQrSessionToken(token: string): void {
  if (!token?.trim() || token.trim().length < 16) {
    throw new Error("Invalid session");
  }
}

export function validateQrCart(items: OrderItemInput[]): void {
  if (!items?.length) {
    throw new Error("Cart is empty");
  }

  if (items.length > 50) {
    throw new Error("Cart exceeds maximum item lines");
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQuantity > 100) {
    throw new Error("Cart exceeds maximum quantity");
  }
}

export function validateQrCartModifiers(product: QrMenuProduct, selectedOptionIds: string[]): void {
  for (const group of product.modifierGroups) {
    const selectedInGroup = group.options.filter((option) =>
      selectedOptionIds.includes(option.id),
    ).length;

    if (group.isRequired && selectedInGroup < Math.max(1, group.minSelections)) {
      throw new Error(`${group.name} requires a selection`);
    }

    if (selectedInGroup < group.minSelections) {
      throw new Error(`${group.name} requires at least ${group.minSelections} selection(s)`);
    }

    if (selectedInGroup > group.maxSelections) {
      throw new Error(`${group.name} allows at most ${group.maxSelections} selection(s)`);
    }
  }

  const validOptionIds = new Set(
    product.modifierGroups.flatMap((group) => group.options.map((o) => o.id)),
  );
  for (const optionId of selectedOptionIds) {
    if (!validOptionIds.has(optionId)) {
      throw new Error("Invalid modifier selection");
    }
  }
}

export function validateQrCartState(items: QrCartItem[], products: QrMenuProduct[]): void {
  if (!items.length) {
    throw new Error("Cart is empty");
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error("Product is no longer available");
    }

    validateQrCartModifiers(product, item.modifierOptionIds);

    const expectedUnit = product.price;
    const modifierTotal = item.modifierOptionIds.reduce((sum, optionId) => {
      for (const group of product.modifierGroups) {
        const option = group.options.find((entry) => entry.id === optionId);
        if (option) return sum + option.priceAdjustment;
      }
      return sum;
    }, 0);

    if (Math.abs(item.unitPrice - expectedUnit) > 0.001) {
      throw new Error("Product price changed. Refresh your cart.");
    }

    if (Math.abs(item.modifierTotal - modifierTotal) > 0.001) {
      throw new Error("Modifier pricing changed. Refresh your cart.");
    }
  }
}

export function toOrderItemsFromCart(items: QrCartItem[]): OrderItemInput[] {
  return items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    modifierOptionIds: item.modifierOptionIds,
    specialInstructions: item.specialInstructions ?? null,
  }));
}
