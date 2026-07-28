import type { CartData, CartItemData } from "@/services/cart.service";
import { formatMenuPrice } from "@/modules/public-menu/lib/public-menu-utils";

export interface ClientCartItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  unitPriceLabel: string;
  totalPrice: number;
  totalPriceLabel: string;
  notes: string | null;
}

export interface ClientCart {
  id: string;
  itemCount: number;
  subtotal: number;
  subtotalLabel: string;
  items: ClientCartItem[];
}

export function serializeCartItem(item: CartItemData): ClientCartItem {
  return {
    id: item.id,
    menuItemId: item.menuItemId,
    menuItemName: item.menuItemName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    unitPriceLabel: formatMenuPrice(item.unitPrice),
    totalPrice: item.totalPrice,
    totalPriceLabel: formatMenuPrice(item.totalPrice),
    notes: item.notes,
  };
}

export function serializeCart(cart: CartData): ClientCart {
  const items = cart.items.map(serializeCartItem);

  return {
    id: cart.id,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cart.subtotal,
    subtotalLabel: formatMenuPrice(cart.subtotal),
    items,
  };
}

export function createEmptyClientCart(): ClientCart {
  return {
    id: "",
    itemCount: 0,
    subtotal: 0,
    subtotalLabel: formatMenuPrice(0),
    items: [],
  };
}
