"use server";

import { revalidatePath } from "next/cache";

import { KITCHEN_MODULE_PERMISSIONS } from "@/modules/kitchen/constants/permissions";
import { KITCHEN_ROUTES } from "@/modules/kitchen/constants/routes";
import {
  refreshElapsedLabels,
  serializeKitchenOrderCard,
  type ClientKitchenOrderCard,
} from "@/modules/kitchen/lib/kitchen-display-utils";
import {
  resolveKitchenScope,
  toKitchenPlatformContext,
} from "@/modules/kitchen/lib/kitchen-scope";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import { kitchenRepository } from "@/modules/kitchen/repository/kitchen-repository";
import { kitchenService } from "@/modules/kitchen/services/kitchen.service";
import {
  addKitchenNoteSchema,
  assignKitchenStationSchema,
  createKitchenStationSchema,
  kitchenOrderActionSchema,
  receiveOmsOrderSchema,
  updateKitchenStationSchema,
} from "@/modules/kitchen/validation/kitchen-schemas";

function revalidateKitchenPages() {
  revalidatePath(KITCHEN_ROUTES.overview);
  revalidatePath("/dashboard/restaurant/kitchen");
  revalidatePath("/app/restaurant/kitchen");
}

async function loadActiveKitchenOrders(scope: ReturnType<typeof resolveKitchenScope>): Promise<ClientKitchenOrderCard[]> {
  const queueItems = await kitchenRepository.loadDisplayCards(scope);
  return refreshElapsedLabels(queueItems.map(serializeKitchenOrderCard));
}

export async function fetchKitchenQueueAction(): Promise<ClientKitchenOrderCard[]> {
  return protectedAction(KITCHEN_MODULE_PERMISSIONS.KITCHEN_READ, async ({ platform }) => {
    const scope = resolveKitchenScope(platform);
    return loadActiveKitchenOrders(scope);
  });
}

async function assertQueueItemInScope(queueItemId: string, scope: ReturnType<typeof resolveKitchenScope>) {
  const item = await kitchenRepository.findById(scope, queueItemId);
  if (!item) {
    throw new Error("Kitchen queue item not found");
  }
}

export async function acceptKitchenOrderAction(
  queueItemId: string,
): Promise<ClientKitchenOrderCard[]> {
  return protectedAction(KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE, async ({ platform }) => {
    const scope = resolveKitchenScope(platform);
    await assertQueueItemInScope(queueItemId, scope);
    await kitchenRepository.acceptOrder(scope, { kitchenOrderId: queueItemId });
    revalidateKitchenPages();
    return loadActiveKitchenOrders(scope);
  });
}

export async function startPreparingKitchenOrderAction(
  queueItemId: string,
): Promise<ClientKitchenOrderCard[]> {
  return protectedAction(KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE, async ({ platform }) => {
    const scope = resolveKitchenScope(platform);
    await assertQueueItemInScope(queueItemId, scope);
    await kitchenRepository.fireOrder(scope, queueItemId);
    revalidateKitchenPages();
    return loadActiveKitchenOrders(scope);
  });
}

export async function markKitchenOrderReadyAction(
  queueItemId: string,
): Promise<ClientKitchenOrderCard[]> {
  return protectedAction(KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE, async ({ platform }) => {
    const scope = resolveKitchenScope(platform);
    await assertQueueItemInScope(queueItemId, scope);
    await kitchenRepository.markReady(scope, queueItemId);
    revalidateKitchenPages();
    return loadActiveKitchenOrders(scope);
  });
}

export async function markKitchenOrderServedAction(
  queueItemId: string,
): Promise<ClientKitchenOrderCard[]> {
  return protectedAction(KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE, async ({ platform }) => {
    const scope = resolveKitchenScope(platform);
    await assertQueueItemInScope(queueItemId, scope);
    await kitchenRepository.bumpOrder(scope, { kitchenOrderId: queueItemId });
    revalidateKitchenPages();
    return loadActiveKitchenOrders(scope);
  });
}

export async function holdKitchenOrderAction(kitchenOrderId: string) {
  return protectedAction(KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE, async ({ platform }) => {
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const record = await kitchenService.holdOrder(context, kitchenOrderId);
    revalidateKitchenPages();
    return { success: true as const, record };
  });
}

export async function resumeKitchenOrderAction(kitchenOrderId: string) {
  return protectedAction(KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE, async ({ platform }) => {
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const record = await kitchenService.resumeOrder(context, kitchenOrderId);
    revalidateKitchenPages();
    return { success: true as const, record };
  });
}

export async function recallKitchenOrderAction(input: unknown) {
  return protectedAction(KITCHEN_MODULE_PERMISSIONS.KITCHEN_MANAGE, async ({ platform }) => {
    const body = kitchenOrderActionSchema.parse(input);
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const record = await kitchenService.recallOrder(context, body);
    revalidateKitchenPages();
    return { success: true as const, record };
  });
}

export async function completeKitchenOrderAction(kitchenOrderId: string) {
  return protectedAction(KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE, async ({ platform }) => {
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const record = await kitchenService.completeOrder(context, kitchenOrderId);
    revalidateKitchenPages();
    return { success: true as const, record };
  });
}

export async function assignKitchenStationAction(input: unknown) {
  return protectedAction(KITCHEN_MODULE_PERMISSIONS.KITCHEN_ASSIGN_STATION, async ({ platform }) => {
    const body = assignKitchenStationSchema.parse(input);
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const record = await kitchenService.assignStation(context, body);
    revalidateKitchenPages();
    return { success: true as const, record };
  });
}

export async function addKitchenNoteAction(input: unknown) {
  return protectedAction(KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE, async ({ platform }) => {
    const body = addKitchenNoteSchema.parse(input);
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const record = await kitchenService.addNote(context, body);
    revalidateKitchenPages();
    return { success: true as const, record };
  });
}

export async function createKitchenStationAction(input: unknown) {
  return protectedAction(KITCHEN_MODULE_PERMISSIONS.KITCHEN_MANAGE, async ({ platform }) => {
    const body = createKitchenStationSchema.parse(input);
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const station = await kitchenService.createStation(context, body);
    revalidateKitchenPages();
    return { success: true as const, station };
  });
}

export async function updateKitchenStationAction(input: unknown) {
  return protectedAction(KITCHEN_MODULE_PERMISSIONS.KITCHEN_MANAGE, async ({ platform }) => {
    const body = updateKitchenStationSchema.parse(input);
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const station = await kitchenService.updateStation(context, body);
    revalidateKitchenPages();
    return { success: true as const, station };
  });
}

export async function receiveOmsKitchenOrderAction(input: unknown) {
  return protectedAction(KITCHEN_MODULE_PERMISSIONS.KITCHEN_UPDATE, async ({ platform }) => {
    const body = receiveOmsOrderSchema.parse(input);
    const context = toKitchenPlatformContext(resolveKitchenScope(platform));
    const record = await kitchenService.receiveFromOms(
      context,
      body.restaurantOrderId,
      body.priority,
    );
    revalidateKitchenPages();
    return { success: true as const, record };
  });
}
