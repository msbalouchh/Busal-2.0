"use server";

import { revalidatePath } from "next/cache";

import { POS_MODULE_PERMISSIONS } from "@/modules/pos/constants/permissions";
import { KITCHEN_ROUTES } from "@/modules/kitchen/constants/routes";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { POS_ROUTES, type PosOrderType } from "@/modules/pos/constants/routes";
import {
  addItem,
  clearPosOrder,
  holdPosOrder,
  removeItem,
  resumePosOrder,
  sendPosOrderToKitchen,
  updateQuantity,
} from "@/modules/pos/services/pos-order.service";
import { getOrCreatePosCart } from "@/modules/pos/services/pos-order.service";
import { serializePosCart } from "@/modules/pos/utils/pos-utils";
import { listHeldPosOrders } from "@/modules/pos/services/pos-order.service";
import { prisma } from "@/lib/prisma";

function revalidatePosPaths() {
  revalidatePath(POS_ROUTES.overview);
  revalidatePath(KITCHEN_ROUTES.overview);
}

export async function addPosItemAction(input: {
  cartId: string;
  menuItemId: string;
  quantity?: number;
}) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_CREATE, async ({ business }) => {
    const currentCart = await prisma.cart.findFirst({
      where: { id: input.cartId, businessId: business.id },
      select: { qrMenuSessionId: true },
    });

    if (!currentCart) {
      throw new Error("Cart not found");
    }

    const cart = await addItem(
      business.id,
      currentCart.qrMenuSessionId,
      input.menuItemId,
      input.quantity ?? 1,
    );

    revalidatePosPaths();
    return { success: true as const, cart: serializePosCart(cart) };
  });
}

export async function removePosItemAction(input: { cartItemId: string }) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_CREATE, async ({ business }) => {
    const item = await prisma.cartItem.findUnique({
      where: { id: input.cartItemId },
      include: { cart: { select: { businessId: true } } },
    });

    if (!item || item.cart.businessId !== business.id) {
      throw new Error("Cart item not found");
    }

    const cart = await removeItem(input.cartItemId);
    revalidatePosPaths();
    return { success: true as const, cart: serializePosCart(cart) };
  });
}

export async function updatePosItemQuantityAction(input: { cartItemId: string; quantity: number }) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_CREATE, async ({ business }) => {
    const item = await prisma.cartItem.findUnique({
      where: { id: input.cartItemId },
      include: { cart: { select: { businessId: true } } },
    });

    if (!item || item.cart.businessId !== business.id) {
      throw new Error("Cart item not found");
    }

    const cart = await updateQuantity(input.cartItemId, input.quantity);
    revalidatePosPaths();
    return { success: true as const, cart: serializePosCart(cart) };
  });
}

export async function clearPosOrderAction(input: { cartId: string }) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_CREATE, async ({ business }) => {
    const cart = await clearPosOrder(input.cartId, business.id);
    revalidatePosPaths();
    return { success: true as const, cart: serializePosCart(cart) };
  });
}

export async function holdPosOrderAction(input: {
  posSessionId: string;
  cartId: string;
  label?: string;
  tableId?: string | null;
  orderType?: PosOrderType;
  customerName?: string | null;
  orderNotes?: string | null;
}) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_CREATE, async ({ business, platform }) => {
    const heldOrder = await holdPosOrder({
      businessId: business.id,
      cartId: input.cartId,
      posSessionId: input.posSessionId,
      branchId: platform.branchId,
      label: input.label,
      tableId: input.tableId,
      orderType: input.orderType,
      customerName: input.customerName,
      orderNotes: input.orderNotes,
    });

    const nextCart = await getOrCreatePosCart(business.id, input.posSessionId);
    revalidatePosPaths();

    return {
      success: true as const,
      heldOrder,
      cart: serializePosCart(nextCart),
      heldOrders: await listHeldPosOrders(business.id, platform.branchId),
    };
  });
}

export async function resumePosOrderAction(input: {
  posSessionId: string;
  orderSessionId: string;
}) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_CREATE, async ({ business, platform }) => {
    const cart = await resumePosOrder({
      businessId: business.id,
      orderSessionId: input.orderSessionId,
      posSessionId: input.posSessionId,
    });

    revalidatePosPaths();
    return {
      success: true as const,
      cart: serializePosCart(cart),
      heldOrders: await listHeldPosOrders(business.id, platform.branchId),
    };
  });
}

export async function sendPosOrderToKitchenAction(input: {
  posSessionId: string;
  cartId: string;
  tableId?: string | null;
  orderType?: PosOrderType;
  customerName?: string | null;
  orderNotes?: string | null;
}) {
  return protectedAction(
    [POS_MODULE_PERMISSIONS.POS_CREATE, POS_MODULE_PERMISSIONS.POS_UPDATE],
    async ({ business, platform }) => {
      const result = await sendPosOrderToKitchen({
        businessId: business.id,
        cartId: input.cartId,
        posSessionId: input.posSessionId,
        branchId: platform.branchId,
        tableId: input.tableId,
        orderType: input.orderType,
        customerName: input.customerName,
        orderNotes: input.orderNotes,
      });

      const nextCart = await getOrCreatePosCart(business.id, input.posSessionId);
      revalidatePosPaths();

      return {
        success: true as const,
        result,
        cart: serializePosCart(nextCart),
        heldOrders: await listHeldPosOrders(business.id, platform.branchId),
      };
    },
  );
}

export async function createNewPosOrderAction(input: { posSessionId: string }) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_CREATE, async ({ business }) => {
    const cart = await getOrCreatePosCart(business.id, input.posSessionId);
    revalidatePosPaths();
    return { success: true as const, cart: serializePosCart(cart) };
  });
}

export async function fetchPosStateAction(input: { posSessionId: string; cartId?: string }) {
  return protectedAction(POS_MODULE_PERMISSIONS.POS_CREATE, async ({ business, platform }) => {
    const cartRecord = input.cartId
      ? await prisma.cart.findFirst({
          where: { id: input.cartId, businessId: business.id },
          include: {
            items: {
              include: { menuItem: { select: { name: true } } },
              orderBy: [{ createdAt: "asc" }],
            },
          },
        })
      : null;

    const cart = cartRecord
      ? {
          id: cartRecord.id,
          businessId: cartRecord.businessId,
          qrMenuSessionId: cartRecord.qrMenuSessionId,
          status: cartRecord.status,
          subtotal: Number(cartRecord.subtotal),
          items: cartRecord.items.map((item) => ({
            id: item.id,
            cartId: item.cartId,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
            notes: item.notes,
            menuItemName: item.menuItem.name,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          })),
          createdAt: cartRecord.createdAt,
          updatedAt: cartRecord.updatedAt,
        }
      : await getOrCreatePosCart(business.id, input.posSessionId);

    return {
      cart: serializePosCart(cart),
      heldOrders: await listHeldPosOrders(business.id, platform.branchId),
    };
  });
}
