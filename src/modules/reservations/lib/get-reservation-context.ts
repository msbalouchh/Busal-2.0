import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import { listReservations } from "@/services/reservation.service";

export const getReservationModuleContext = cache(async () => {
  const context = await protectedPage({ permission: PERMISSION_CODES.RESERVATION_VIEW });
  const reservations = await listReservations(context.business.ownerId, {
    branchId: context.branchId,
  });

  return { user: context.user, reservations };
});
