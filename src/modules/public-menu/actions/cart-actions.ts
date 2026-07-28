"use server";

import { serializeCart, type ClientCart } from "@/modules/public-menu/lib/cart-utils";
import { getValidatedPublicSession } from "@/modules/public-menu/lib/get-validated-public-session";
import {
  addItem,
  clearCart,
  getActiveCart,
  removeItem,
  updateQuantity,
} from "@/services/cart.service";

export async function fetchActiveCartAction(slug: string): Promise<ClientCart | null> {
  const { qrMenuSessionId } = await getValidatedPublicSession(slug);
  const cart = await getActiveCart(qrMenuSessionId);
  return cart ? serializeCart(cart) : null;
}

export async function addCartItemAction(slug: string, menuItemId: string): Promise<ClientCart> {
  const { businessId, qrMenuSessionId } = await getValidatedPublicSession(slug);
  const cart = await addItem(businessId, qrMenuSessionId, menuItemId);
  return serializeCart(cart);
}

export async function increaseCartItemQuantityAction(
  slug: string,
  cartItemId: string,
): Promise<ClientCart> {
  const { qrMenuSessionId } = await getValidatedPublicSession(slug);
  const activeCart = await getActiveCart(qrMenuSessionId);

  if (!activeCart) {
    throw new Error("Cart not found");
  }

  const item = activeCart.items.find((entry) => entry.id === cartItemId);

  if (!item) {
    throw new Error("Cart item not found");
  }

  const cart = await updateQuantity(cartItemId, item.quantity + 1);
  return serializeCart(cart);
}

export async function decreaseCartItemQuantityAction(
  slug: string,
  cartItemId: string,
): Promise<ClientCart> {
  const { qrMenuSessionId } = await getValidatedPublicSession(slug);
  const activeCart = await getActiveCart(qrMenuSessionId);

  if (!activeCart) {
    throw new Error("Cart not found");
  }

  const item = activeCart.items.find((entry) => entry.id === cartItemId);

  if (!item) {
    throw new Error("Cart item not found");
  }

  const cart = await updateQuantity(cartItemId, item.quantity - 1);
  return serializeCart(cart);
}

export async function removeCartItemAction(slug: string, cartItemId: string): Promise<ClientCart> {
  const { qrMenuSessionId } = await getValidatedPublicSession(slug);
  const activeCart = await getActiveCart(qrMenuSessionId);

  if (!activeCart) {
    throw new Error("Cart not found");
  }

  const item = activeCart.items.find((entry) => entry.id === cartItemId);

  if (!item) {
    throw new Error("Cart item not found");
  }

  const cart = await removeItem(cartItemId);
  return serializeCart(cart);
}

export async function clearCartAction(slug: string): Promise<ClientCart> {
  const { qrMenuSessionId } = await getValidatedPublicSession(slug);
  const activeCart = await getActiveCart(qrMenuSessionId);

  if (!activeCart) {
    throw new Error("Cart not found");
  }

  const cart = await clearCart(activeCart.id);
  return serializeCart(cart);
}
