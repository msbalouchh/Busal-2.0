"use server";

import { revalidatePath } from "next/cache";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { RESTAURANT_OPERATIONS_ROUTES } from "@/modules/restaurant-operations/constants/restaurant-operations";
import type {
  BulkMenuAvailabilityInput,
  MergeTablesInput,
  OrderQueueQuery,
  SplitTablesInput,
} from "@/modules/restaurant-operations/types/restaurant-operations-types";
import { protectedAction } from "@/modules/platform-guards/guards/action.guards";
import {
  bulkUpdateMenuAvailability,
  cancelRestaurantOrder,
  mergeTables,
  queryOrderQueue,
  splitTables,
} from "@/services/restaurant-operations-module.service";

function revalidateRestaurantPages() {
  Object.values(RESTAURANT_OPERATIONS_ROUTES).forEach((path) => revalidatePath(path));
}

export async function queryRestaurantOrdersAction(query: OrderQueueQuery = {}) {
  return protectedAction(PERMISSION_CODES.ORDER_VIEW, async ({ platform }) => {
    const queue = await queryOrderQueue(platform, query);
    return { queue };
  });
}

export async function cancelRestaurantOrderAction(orderId: string) {
  return protectedAction(PERMISSION_CODES.ORDER_CANCEL, async ({ platform }) => {
    const order = await cancelRestaurantOrder(platform, orderId);
    revalidateRestaurantPages();
    return { order };
  });
}

export async function mergeRestaurantTablesAction(input: MergeTablesInput) {
  return protectedAction(PERMISSION_CODES.TABLE_MANAGE, async ({ platform }) => {
    await mergeTables(platform, input);
    revalidateRestaurantPages();
    return { ok: true as const };
  });
}

export async function splitRestaurantTablesAction(input: SplitTablesInput) {
  return protectedAction(PERMISSION_CODES.TABLE_MANAGE, async ({ platform }) => {
    await splitTables(platform, input);
    revalidateRestaurantPages();
    return { ok: true as const };
  });
}

export async function bulkUpdateMenuAvailabilityAction(input: BulkMenuAvailabilityInput) {
  return protectedAction(PERMISSION_CODES.MENU_UPDATE, async ({ platform }) => {
    await bulkUpdateMenuAvailability(platform, input);
    revalidateRestaurantPages();
    return { ok: true as const };
  });
}
