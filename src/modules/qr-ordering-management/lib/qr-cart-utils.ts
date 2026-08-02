import type {
  QrCartItem,
  QrCartState,
  QrMenuProduct,
} from "@/modules/qr-ordering-management/types/qr-ordering-types";

function createCartItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyCart(): QrCartState {
  return { items: [], updatedAt: new Date().toISOString() };
}

export function calculateCartLineTotal(item: QrCartItem): number {
  return (item.unitPrice + item.modifierTotal) * item.quantity;
}

export function calculateCartTotal(items: QrCartItem[]): number {
  return items.reduce((sum, item) => sum + calculateCartLineTotal(item), 0);
}

export function buildCartItemFromProduct(
  product: QrMenuProduct,
  quantity: number,
  modifierOptionIds: string[],
  specialInstructions?: string | null,
): QrCartItem {
  const modifierLabels: string[] = [];
  let modifierTotal = 0;

  for (const group of product.modifierGroups) {
    for (const option of group.options) {
      if (modifierOptionIds.includes(option.id)) {
        modifierLabels.push(option.name);
        modifierTotal += option.priceAdjustment;
      }
    }
  }

  return {
    id: createCartItemId(),
    productId: product.id,
    name: product.name,
    unitPrice: product.price,
    quantity,
    modifierOptionIds,
    modifierLabels,
    modifierTotal,
    specialInstructions: specialInstructions?.trim() || null,
  };
}

export function parseStoredCart(value: string | null | undefined): QrCartState {
  if (!value) return createEmptyCart();

  try {
    const parsed = JSON.parse(value) as QrCartState;
    if (!Array.isArray(parsed.items)) return createEmptyCart();
    return {
      items: parsed.items,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return createEmptyCart();
  }
}

export function serializeCart(cart: QrCartState): string {
  return JSON.stringify(cart);
}

export function getCartItemCount(items: QrCartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function formatQrCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}
