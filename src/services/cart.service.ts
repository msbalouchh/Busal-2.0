import "server-only";

import { type CartStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

function toNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface CartItemData {
  id: string;
  cartId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  menuItemName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartData {
  id: string;
  businessId: string;
  qrMenuSessionId: string;
  status: CartStatus;
  subtotal: number;
  items: CartItemData[];
  createdAt: Date;
  updatedAt: Date;
}

const cartInclude = {
  items: {
    include: {
      menuItem: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ createdAt: "asc" as const }],
  },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

function mapCartItem(item: CartWithItems["items"][number]): CartItemData {
  return {
    id: item.id,
    cartId: item.cartId,
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    unitPrice: toNumber(item.unitPrice),
    totalPrice: toNumber(item.totalPrice),
    notes: item.notes,
    menuItemName: item.menuItem?.name ?? "Unavailable item",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapCart(cart: CartWithItems): CartData {
  return {
    id: cart.id,
    businessId: cart.businessId,
    qrMenuSessionId: cart.qrMenuSessionId,
    status: cart.status,
    subtotal: toNumber(cart.subtotal),
    items: cart.items.map(mapCartItem),
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

export function calculateSubtotal(items: Array<{ totalPrice: number }>): number {
  return roundMoney(items.reduce((sum, item) => sum + item.totalPrice, 0));
}

async function getCartRecord(cartId: string): Promise<CartWithItems> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: cartInclude,
  });

  if (!cart) {
    throw new Error("Cart not found");
  }

  return cart;
}

async function assertSingleActiveCart(
  qrMenuSessionId: string,
  excludeCartId?: string,
): Promise<void> {
  const existing = await prisma.cart.findFirst({
    where: {
      qrMenuSessionId,
      status: "ACTIVE",
      ...(excludeCartId ? { id: { not: excludeCartId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("An active cart already exists for this session");
  }
}

async function assertAvailableMenuItem(businessId: string, menuItemId: string): Promise<number> {
  const menuItem = await prisma.menuItem.findFirst({
    where: { id: menuItemId, businessId },
    select: { id: true, price: true, isAvailable: true },
  });

  if (!menuItem) {
    throw new Error("Menu item not found");
  }

  if (!menuItem.isAvailable) {
    throw new Error("Menu item is not available");
  }

  return toNumber(menuItem.price);
}

export async function createCart(
  businessId: string,
  qrMenuSessionId: string,
  branchId: string | null = null,
): Promise<CartData> {
  const session = await prisma.qRMenuSession.findFirst({
    where: { id: qrMenuSessionId, businessId },
    select: { id: true },
  });

  if (!session) {
    throw new Error("QR menu session not found");
  }

  await assertSingleActiveCart(qrMenuSessionId);

  const cart = await prisma.cart.create({
    data: {
      businessId,
      branchId,
      qrMenuSessionId,
      status: "ACTIVE",
      subtotal: 0,
    },
    include: cartInclude,
  });

  return mapCart(cart);
}

export async function getActiveCart(qrMenuSessionId: string): Promise<CartData | null> {
  const cart = await prisma.cart.findFirst({
    where: { qrMenuSessionId, status: "ACTIVE" },
    include: cartInclude,
  });

  return cart ? mapCart(cart) : null;
}

export async function getCartById(cartId: string): Promise<CartData> {
  const cart = await getCartRecord(cartId);
  return mapCart(cart);
}

export async function recalculateCart(cartId: string): Promise<CartData> {
  const cart = await getCartRecord(cartId);
  const subtotal = calculateSubtotal(cart.items.map(mapCartItem));

  const updated = await prisma.cart.update({
    where: { id: cartId },
    data: { subtotal },
    include: cartInclude,
  });

  return mapCart(updated);
}

async function getOrCreateActiveCart(
  businessId: string,
  qrMenuSessionId: string,
  branchId: string | null = null,
): Promise<CartData> {
  const existing = await getActiveCart(qrMenuSessionId);
  if (existing) {
    return existing;
  }

  return createCart(businessId, qrMenuSessionId, branchId);
}

export async function addItem(
  businessId: string,
  qrMenuSessionId: string,
  menuItemId: string,
  quantity = 1,
  branchId: string | null = null,
): Promise<CartData> {
  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const unitPrice = await assertAvailableMenuItem(businessId, menuItemId);
  const cart = await getOrCreateActiveCart(businessId, qrMenuSessionId, branchId);

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_menuItemId: {
        cartId: cart.id,
        menuItemId,
      },
    },
  });

  if (existingItem) {
    return updateQuantity(existingItem.id, existingItem.quantity + quantity);
  }

  const totalPrice = roundMoney(unitPrice * quantity);

  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      menuItemId,
      quantity,
      unitPrice,
      totalPrice,
    },
  });

  return recalculateCart(cart.id);
}

export async function removeItem(cartItemId: string): Promise<CartData> {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    select: { id: true, cartId: true },
  });

  if (!cartItem) {
    throw new Error("Cart item not found");
  }

  await prisma.cartItem.delete({ where: { id: cartItemId } });
  return recalculateCart(cartItem.cartId);
}

export async function updateQuantity(cartItemId: string, quantity: number): Promise<CartData> {
  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    select: { id: true, cartId: true, unitPrice: true },
  });

  if (!cartItem) {
    throw new Error("Cart item not found");
  }

  const totalPrice = roundMoney(toNumber(cartItem.unitPrice) * quantity);

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity, totalPrice },
  });

  return recalculateCart(cartItem.cartId);
}

export async function clearCart(cartId: string): Promise<CartData> {
  const cart = await getCartRecord(cartId);

  if (cart.status !== "ACTIVE") {
    throw new Error("Only active carts can be cleared");
  }

  await prisma.cartItem.deleteMany({ where: { cartId } });

  const updated = await prisma.cart.update({
    where: { id: cartId },
    data: { subtotal: 0 },
    include: cartInclude,
  });

  return mapCart(updated);
}

export async function abandonCart(cartId: string): Promise<CartData> {
  const cart = await getCartRecord(cartId);

  if (cart.status !== "ACTIVE") {
    throw new Error("Only active carts can be abandoned");
  }

  const updated = await prisma.cart.update({
    where: { id: cartId },
    data: { status: "ABANDONED" },
    include: cartInclude,
  });

  return mapCart(updated);
}
