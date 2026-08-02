import Link from "next/link";

import { RESTAURANT_OPERATIONS_ROUTES } from "@/modules/restaurant-operations/constants/restaurant-operations";
import type {
  RestaurantDashboardWidgets,
  RestaurantOperationsPermissions,
  SerializedOrderQueueItem,
} from "@/modules/restaurant-operations/types/restaurant-operations-types";

interface RestaurantOverviewProps {
  widgets: RestaurantDashboardWidgets;
  permissions: RestaurantOperationsPermissions;
  recentOrders: SerializedOrderQueueItem[];
}

function formatMoney(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export function RestaurantOverview({
  widgets,
  permissions,
  recentOrders,
}: RestaurantOverviewProps) {
  const cards = [
    {
      label: "Today's sales",
      value: formatMoney(widgets.todaysSalesPence),
      href: RESTAURANT_OPERATIONS_ROUTES.orders,
      visible: permissions.canViewOrders,
    },
    {
      label: "Active orders",
      value: widgets.activeOrders.toString(),
      href: RESTAURANT_OPERATIONS_ROUTES.orders,
      visible: permissions.canViewOrders,
    },
    {
      label: "Kitchen queue",
      value: widgets.kitchenQueueCount.toString(),
      href: RESTAURANT_OPERATIONS_ROUTES.kitchen,
      visible: permissions.canViewKitchen,
    },
    {
      label: "Reservations today",
      value: widgets.todaysReservations.toString(),
      href: RESTAURANT_OPERATIONS_ROUTES.reservations,
      visible: permissions.canViewReservations,
    },
    {
      label: "Occupied tables",
      value: widgets.occupiedTables.toString(),
      href: RESTAURANT_OPERATIONS_ROUTES.tables,
      visible: permissions.canViewTables,
    },
    {
      label: "Staff on shift",
      value: widgets.staffOnShift.toString(),
      href: "/dashboard/staff/directory",
      visible: true,
    },
    {
      label: "Inventory alerts",
      value: widgets.inventoryAlerts.toString(),
      href: RESTAURANT_OPERATIONS_ROUTES.inventory,
      visible: permissions.canViewInventory,
    },
  ].filter((card) => card.visible);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="hover:bg-muted/40 rounded-lg border p-4 transition-colors"
          >
            <p className="text-muted-foreground text-sm">{card.label}</p>
            <p className="text-2xl font-semibold">{card.value}</p>
          </Link>
        ))}
      </div>

      {permissions.canViewOrders ? (
        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Recent orders</h2>
            <Link
              href={RESTAURANT_OPERATIONS_ROUTES.orders}
              className="text-primary text-sm hover:underline"
            >
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent orders yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    #{order.orderNumber} · {order.status} · {order.paymentStatus}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
