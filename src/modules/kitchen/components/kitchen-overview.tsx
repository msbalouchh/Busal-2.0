"use client";

import { KitchenManagementEmpty } from "@/modules/kitchen/components/kitchen-management-empty";
import { KitchenManagementError } from "@/modules/kitchen/components/kitchen-management-error";
import { KitchenManagementLoading } from "@/modules/kitchen/components/kitchen-management-loading";
import { KitchenPriorityBadge } from "@/modules/kitchen/components/kitchen-priority-badge";
import { KitchenStatusBadge } from "@/modules/kitchen/components/kitchen-status-badge";
import { useKitchen } from "@/modules/kitchen/hooks/use-kitchen";
import { getKitchenOrderSummary } from "@/modules/kitchen/utils/kitchen-selectors";

export function KitchenOverview() {
  const { records, refresh, isRefreshing, error } = useKitchen();

  if (isRefreshing && records.length === 0) {
    return <KitchenManagementLoading />;
  }

  if (error && records.length === 0) {
    return <KitchenManagementError message={error} />;
  }

  if (records.length === 0) {
    return <KitchenManagementEmpty />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Kitchen Orders</h2>
          <p className="text-muted-foreground text-sm">{records.length} active order(s)</p>
        </div>
        <button
          type="button"
          className="text-sm font-medium underline-offset-4 hover:underline"
          onClick={refresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <KitchenManagementError message={error} /> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {records.map((record) => (
          <article key={record.order.id} className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="font-medium">{record.order.orderNumber}</h3>
              <KitchenStatusBadge status={record.order.status} />
            </div>
            <p className="text-muted-foreground mb-3 text-sm">{getKitchenOrderSummary(record)}</p>
            <div className="flex items-center justify-between">
              <KitchenPriorityBadge priority={record.order.priority} />
              <span className="text-muted-foreground text-xs">
                {record.items.length} item(s)
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
