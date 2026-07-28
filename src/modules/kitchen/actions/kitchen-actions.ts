"use server";

import { revalidatePath } from "next/cache";

import { KITCHEN_ROUTES } from "@/modules/kitchen/constants/routes";
import {
  refreshElapsedLabels,
  serializeKitchenOrderCard,
  type ClientKitchenOrderCard,
} from "@/modules/kitchen/lib/kitchen-display-utils";
import { requireAuthenticatedUser } from "@/modules/onboarding/lib/onboarding-guard";
import {
  acknowledgeOrder,
  getQueue,
  markReady,
  markServed,
  startPreparation,
} from "@/services/kitchen-queue.service";
import { getOrCreateBusinessForOwner } from "@/services/business-profile.service";
import { prisma } from "@/lib/prisma";

function revalidateKitchenPage() {
  revalidatePath(KITCHEN_ROUTES.overview);
}

async function getBusinessId(): Promise<string> {
  const user = await requireAuthenticatedUser();
  const business = await getOrCreateBusinessForOwner(user.id);
  return business.id;
}

async function loadActiveKitchenOrders(businessId: string): Promise<ClientKitchenOrderCard[]> {
  const queueItems = await prisma.kitchenQueue.findMany({
    where: {
      businessId,
      status: { in: ["NEW", "ACKNOWLEDGED", "PREPARING", "READY"] },
    },
    include: {
      order: {
        include: {
          table: { select: { name: true } },
          items: {
            orderBy: [{ createdAt: "asc" }],
            select: {
              id: true,
              quantity: true,
              nameSnapshot: true,
              notes: true,
            },
          },
        },
      },
    },
    orderBy: [{ priority: "desc" }, { queuedAt: "asc" }],
  });

  return refreshElapsedLabels(queueItems.map(serializeKitchenOrderCard));
}

export async function fetchKitchenQueueAction(): Promise<ClientKitchenOrderCard[]> {
  const businessId = await getBusinessId();
  await getQueue(businessId);
  return loadActiveKitchenOrders(businessId);
}

async function assertQueueItemBelongsToBusiness(
  queueItemId: string,
  businessId: string,
): Promise<void> {
  const item = await prisma.kitchenQueue.findFirst({
    where: { id: queueItemId, businessId },
    select: { id: true },
  });

  if (!item) {
    throw new Error("Kitchen queue item not found");
  }
}

export async function acceptKitchenOrderAction(
  queueItemId: string,
): Promise<ClientKitchenOrderCard[]> {
  const businessId = await getBusinessId();
  await assertQueueItemBelongsToBusiness(queueItemId, businessId);
  await acknowledgeOrder(queueItemId);
  revalidateKitchenPage();
  return loadActiveKitchenOrders(businessId);
}

export async function startPreparingKitchenOrderAction(
  queueItemId: string,
): Promise<ClientKitchenOrderCard[]> {
  const businessId = await getBusinessId();
  await assertQueueItemBelongsToBusiness(queueItemId, businessId);
  await startPreparation(queueItemId);
  revalidateKitchenPage();
  return loadActiveKitchenOrders(businessId);
}

export async function markKitchenOrderReadyAction(
  queueItemId: string,
): Promise<ClientKitchenOrderCard[]> {
  const businessId = await getBusinessId();
  await assertQueueItemBelongsToBusiness(queueItemId, businessId);
  await markReady(queueItemId);
  revalidateKitchenPage();
  return loadActiveKitchenOrders(businessId);
}

export async function markKitchenOrderServedAction(
  queueItemId: string,
): Promise<ClientKitchenOrderCard[]> {
  const businessId = await getBusinessId();
  await assertQueueItemBelongsToBusiness(queueItemId, businessId);
  await markServed(queueItemId);
  revalidateKitchenPage();
  return loadActiveKitchenOrders(businessId);
}
