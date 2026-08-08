"use client";

import { OrderStatusBadge } from "@/modules/orders/components/order-status-badge";
import { OrderTimelinePanel } from "@/modules/orders/components/order-timeline-panel";
import type { OmsPlatformSnapshot } from "@/modules/orders/services/oms-platform.service";

interface OrderManagementOverviewProps {
  initialSnapshot: OmsPlatformSnapshot;
}

export function OrderManagementOverview({ initialSnapshot }: OrderManagementOverviewProps) {
  const recent = initialSnapshot.orders.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active", value: initialSnapshot.activeCount },
          { label: "Preparing", value: initialSnapshot.preparingCount },
          { label: "Delivery", value: initialSnapshot.deliveryCount },
          { label: "Completed Today", value: initialSnapshot.completedTodayCount },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">{item.label}</p>
            <p className="text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border">
        <div className="border-b p-4">
          <h2 className="font-semibold">Recent orders</h2>
        </div>
        <div className="divide-y">
          {recent.length === 0 ? (
            <p className="text-muted-foreground p-4 text-sm">No orders in queue.</p>
          ) : (
            recent.map((record) => (
              <div key={record.order.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{record.order.orderNumber}</p>
                  <p className="text-muted-foreground text-sm">
                    {record.order.customerName ?? "Walk-in"} · {record.order.orderType.replace("_", " ")}
                  </p>
                </div>
                <OrderStatusBadge status={record.order.status} />
              </div>
            ))
          )}
        </div>
      </div>

      {recent[0] ? <OrderTimelinePanel events={recent[0].timeline} /> : null}
    </div>
  );
}
