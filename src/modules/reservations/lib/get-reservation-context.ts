import { cache } from "react";

import { RESERVATION_MODULE_PERMISSIONS } from "@/modules/reservations/constants/permissions";
import {
  resolveReservationScope,
  toReservationPlatformContext,
} from "@/modules/reservations/lib/reservation-scope";
import { reservationService } from "@/modules/reservations/services/reservation.service";
import { buildReservationPlatformSnapshot } from "@/modules/reservations/services/reservation-platform.service";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import type { ReservationPlatformSnapshot } from "@/modules/reservations/services/reservation-platform.service";
import type { ClientReservationData } from "@/modules/reservations/lib/reservation-mappers";

export const getReservationModuleContext = cache(async () => {
  const platform = await protectedPage({
    permission: RESERVATION_MODULE_PERMISSIONS.RESERVATION_READ,
  });
  const scope = resolveReservationScope(platform);
  const platformContext = toReservationPlatformContext(scope);
  const [reservations, snapshot] = await Promise.all([
    reservationService.listClientReservations(platformContext),
    buildReservationPlatformSnapshot(platformContext),
  ]);

  const permissions = platform.permissions;

  return {
    user: platform.user,
    business: platform.business,
    branchId: scope.branchId,
    platformContext,
    reservations,
    snapshot,
    permissions: {
      canRead: permissions.includes(RESERVATION_MODULE_PERMISSIONS.RESERVATION_READ),
      canCreate: permissions.includes(RESERVATION_MODULE_PERMISSIONS.RESERVATION_CREATE),
      canUpdate: permissions.includes(RESERVATION_MODULE_PERMISSIONS.RESERVATION_UPDATE),
      canDelete: permissions.includes(RESERVATION_MODULE_PERMISSIONS.RESERVATION_DELETE),
      canCancel: permissions.includes(RESERVATION_MODULE_PERMISSIONS.RESERVATION_CANCEL),
      canManage: permissions.includes(RESERVATION_MODULE_PERMISSIONS.RESERVATION_MANAGE),
    },
  };
});

export type ReservationModulePageContext = Awaited<ReturnType<typeof getReservationModuleContext>>;

export async function getReservationSnapshot(): Promise<ReservationPlatformSnapshot> {
  const context = await getReservationModuleContext();
  return context.snapshot;
}

export type { ClientReservationData };
