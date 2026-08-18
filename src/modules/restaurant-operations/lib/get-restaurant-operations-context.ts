import { cache } from "react";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";
import type {
  OrderQueueQuery,
  ReservationOperationsQuery,
} from "@/modules/restaurant-operations/types/restaurant-operations-types";
import { getKitchenDisplayContext } from "@/modules/kitchen/lib/get-kitchen-display-context";
import { getPosTerminalContext } from "@/modules/pos/lib/get-pos-context";
import { getInventoryOverviewContext } from "@/modules/inventory/lib/get-inventory-context";
import {
  getMenuOperationsBundle,
  getReservationOperationsBundle,
  getRestaurantOperationsBundle,
  getTableFloorBundle,
  queryOrderQueue,
} from "@/services/restaurant-operations-module.service";
import { listTablesForBusiness } from "@/services/table.service";
import { serializeReservation } from "@/modules/reservations/lib/reservation-utils";
import { serializeTable } from "@/modules/tables/lib/table-utils";
import type { ClientTable } from "@/modules/tables/lib/table-utils";

export const getRestaurantOperationsContext = cache(async () => {
  const platform = await protectedPage();
  const bundle = await getRestaurantOperationsBundle(platform);

  return {
    platform,
    ...bundle,
  };
});

export const getRestaurantMenuContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.MENU_VIEW });
  const menu = await getMenuOperationsBundle(platform);

  return {
    platform,
    permissions: (await getRestaurantOperationsBundle(platform)).permissions,
    ...menu,
  };
});

export const getRestaurantTablesContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.TABLE_MANAGE });
  const [floor, tables] = await Promise.all([
    getTableFloorBundle(platform),
    listTablesForBusiness(platform.business.id, { branchId: platform.branchId }),
  ]);

  return {
    platform,
    permissions: (await getRestaurantOperationsBundle(platform)).permissions,
    floor,
    tables: tables.map((table) => serializeTable(table)) as ClientTable[],
  };
});

export const getRestaurantReservationsContext = cache(
  async (query: ReservationOperationsQuery = {}) => {
    const platform = await protectedPage({ permission: PERMISSION_CODES.RESERVATION_VIEW });
    const bundle = await getReservationOperationsBundle(platform, query);

    return {
      platform,
      permissions: (await getRestaurantOperationsBundle(platform)).permissions,
      ...bundle,
      reservations: bundle.reservations.map((reservation) =>
        serializeReservation({
          ...reservation,
          reservationDate: reservation.reservationDate,
          createdAt: reservation.createdAt,
          updatedAt: reservation.updatedAt,
        }),
      ),
      waitlist: bundle.waitlist.map((reservation) =>
        serializeReservation({
          ...reservation,
          reservationDate: reservation.reservationDate,
          createdAt: reservation.createdAt,
          updatedAt: reservation.updatedAt,
        }),
      ),
    };
  },
);

export const getRestaurantOrdersContext = cache(async (query: OrderQueueQuery = {}) => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.ORDER_VIEW });
  const queue = await queryOrderQueue(platform, query);

  return {
    platform,
    permissions: (await getRestaurantOperationsBundle(platform)).permissions,
    queue,
  };
});

export const getRestaurantKitchenContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.KITCHEN_VIEW });
  const orders = await getKitchenDisplayContext();

  return {
    platform,
    permissions: (await getRestaurantOperationsBundle(platform)).permissions,
    orders,
  };
});

export const getRestaurantPosContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.POS_USE });
  const terminal = await getPosTerminalContext();
  const permissions = (await getRestaurantOperationsBundle(platform)).permissions;

  return {
    platform,
    permissions,
    terminal,
  };
});

export const getRestaurantInventoryContext = cache(async () => {
  const platform = await protectedPage({ permission: PERMISSION_CODES.INVENTORY_VIEW });
  const inventory = await getInventoryOverviewContext();

  return {
    platform,
    permissions: (await getRestaurantOperationsBundle(platform)).permissions,
    ...inventory,
  };
});

export const getRestaurantModuleContext = getRestaurantOperationsContext;
