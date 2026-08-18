import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { branchFilter } from "@/modules/business-context/utils/branch-scope";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { prisma } from "@/lib/prisma";
import { listTablesForBusiness } from "@/services/table.service";

const ACTIVE_RESERVATION_STATUSES = ["PENDING", "CONFIRMED", "SEATED"] as const;

export const getTableModuleContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.TABLE_MANAGE });

  const [tables, activeReservations] = await Promise.all([
    listTablesForBusiness(context.business.id, { branchId: context.branchId }),
    prisma.reservation.findMany({
      where: {
        businessId: context.business.id,
        ...branchFilter(context.branchId),
        legacyTableId: { not: null },
        status: { in: [...ACTIVE_RESERVATION_STATUSES] },
      },
      select: {
        id: true,
        legacyTableId: true,
        guestName: true,
        reservationNumber: true,
        status: true,
      },
    }),
  ]);

  return { user: context.user, tables, activeReservations };
});
