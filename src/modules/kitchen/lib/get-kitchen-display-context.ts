import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import {
  refreshElapsedLabels,
  serializeKitchenOrderCard,
  type ClientKitchenOrderCard,
} from "@/modules/kitchen/lib/kitchen-display-utils";
import { prisma } from "@/lib/prisma";

export const getKitchenDisplayContext = cache(async (): Promise<ClientKitchenOrderCard[]> => {
  const context = await protectedPage({ permission: PERMISSION_CODES.KITCHEN_VIEW });

  const queueItems = await prisma.kitchenQueue.findMany({
    where: {
      businessId: context.business.id,
      ...branchFilter(context.branchId),
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

  const cards = queueItems.map(serializeKitchenOrderCard);
  return refreshElapsedLabels(cards);
});
