"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { KITCHEN_DISPLAY_ROUTES } from "@/modules/kitchen-display-management/constants/routes";
import { requireKitchenActionContext } from "@/modules/kitchen-display-management/lib/get-kitchen-display-context";
import { validateKitchenStationInput } from "@/modules/kitchen-display-management/lib/kitchen-validation";
import type { KitchenStationInput } from "@/modules/kitchen-display-management/types/kitchen-display-types";
import type { RestaurantOrderItemStatus } from "@prisma/client";
import {
  acceptKitchenOrder,
  assignProductsToKitchenStation,
  completeKitchenOrder,
  createKitchenStation,
  markKitchenOrderReady,
  markKitchenOrderServed,
  startKitchenPreparing,
  toggleKitchenOrderPriority,
  updateKitchenItemStatus,
  updateKitchenStation,
} from "@/services/restaurant-kitchen-display.service";

function revalidateKitchenPages(branchId: string) {
  revalidatePath(KITCHEN_DISPLAY_ROUTES.dashboardForBranch(branchId));
  revalidatePath(KITCHEN_DISPLAY_ROUTES.fullscreen(branchId));
  revalidatePath(KITCHEN_DISPLAY_ROUTES.stations(branchId));
}

export async function acceptKitchenOrderAction(branchId: string, orderId: string) {
  const context = await requireKitchenActionContext(branchId, PERMISSION_CODES.KITCHEN_UPDATE);
  await acceptKitchenOrder(context.user.id, branchId, orderId);
  revalidateKitchenPages(branchId);
  return { success: true as const };
}

export async function startKitchenPreparingAction(branchId: string, orderId: string) {
  const context = await requireKitchenActionContext(branchId, PERMISSION_CODES.KITCHEN_UPDATE);
  await startKitchenPreparing(context.user.id, branchId, orderId);
  revalidateKitchenPages(branchId);
  return { success: true as const };
}

export async function markKitchenOrderReadyAction(branchId: string, orderId: string) {
  const context = await requireKitchenActionContext(branchId, PERMISSION_CODES.KITCHEN_UPDATE);
  await markKitchenOrderReady(context.user.id, branchId, orderId);
  revalidateKitchenPages(branchId);
  return { success: true as const };
}

export async function markKitchenOrderServedAction(branchId: string, orderId: string) {
  const context = await requireKitchenActionContext(branchId, PERMISSION_CODES.KITCHEN_UPDATE);
  await markKitchenOrderServed(context.user.id, branchId, orderId);
  revalidateKitchenPages(branchId);
  return { success: true as const };
}

export async function completeKitchenOrderAction(branchId: string, orderId: string) {
  const context = await requireKitchenActionContext(branchId, PERMISSION_CODES.KITCHEN_UPDATE);
  await completeKitchenOrder(context.user.id, branchId, orderId);
  revalidateKitchenPages(branchId);
  return { success: true as const };
}

export async function toggleKitchenOrderPriorityAction(
  branchId: string,
  orderId: string,
  isPriority: boolean,
) {
  const context = await requireKitchenActionContext(branchId, PERMISSION_CODES.KITCHEN_UPDATE);
  await toggleKitchenOrderPriority(context.user.id, branchId, orderId, isPriority);
  revalidateKitchenPages(branchId);
  return { success: true as const };
}

export async function updateKitchenItemStatusAction(
  branchId: string,
  orderId: string,
  itemId: string,
  status: RestaurantOrderItemStatus,
) {
  const context = await requireKitchenActionContext(branchId, PERMISSION_CODES.KITCHEN_UPDATE);
  await updateKitchenItemStatus(context.user.id, branchId, orderId, itemId, status);
  revalidateKitchenPages(branchId);
  return { success: true as const };
}

export async function createKitchenStationAction(input: KitchenStationInput) {
  const context = await requireKitchenActionContext(
    input.branchId,
    PERMISSION_CODES.KITCHEN_MANAGE,
  );
  validateKitchenStationInput(input);
  await createKitchenStation(context.user.id, input);
  revalidateKitchenPages(input.branchId);
  return { success: true as const };
}

export async function updateKitchenStationAction(stationId: string, input: KitchenStationInput) {
  const context = await requireKitchenActionContext(
    input.branchId,
    PERMISSION_CODES.KITCHEN_MANAGE,
  );
  validateKitchenStationInput(input);
  await updateKitchenStation(context.user.id, stationId, input);
  revalidateKitchenPages(input.branchId);
  return { success: true as const };
}

export async function assignKitchenStationProductsAction(
  stationId: string,
  branchId: string,
  productIds: string[],
) {
  const context = await requireKitchenActionContext(
    branchId,
    PERMISSION_CODES.KITCHEN_ASSIGN_STATION,
  );
  await assignProductsToKitchenStation(context.user.id, stationId, branchId, productIds);
  revalidateKitchenPages(branchId);
  return { success: true as const };
}
