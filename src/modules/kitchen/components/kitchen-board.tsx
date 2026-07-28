"use client";

import { EmptyState } from "@/components/common/empty-state";
import {
  KITCHEN_BOARD_STATUSES,
  type KitchenBoardStatus,
} from "@/modules/kitchen/constants/routes";
import { KitchenOrderCard } from "@/modules/kitchen/components/kitchen-order-card";
import type { ClientKitchenOrderCard } from "@/modules/kitchen/lib/kitchen-display-utils";

const STATUS_LABELS: Record<KitchenBoardStatus, string> = {
  NEW: "New",
  ACKNOWLEDGED: "Acknowledged",
  PREPARING: "Preparing",
  READY: "Ready",
};

interface KitchenBoardProps {
  groupedOrders: Record<KitchenBoardStatus, ClientKitchenOrderCard[]>;
  isPending: boolean;
  onAction: (queueItemId: string, status: ClientKitchenOrderCard["status"]) => void;
}

export function KitchenBoard({ groupedOrders, isPending, onAction }: KitchenBoardProps) {
  const hasOrders = KITCHEN_BOARD_STATUSES.some((status) => groupedOrders[status].length > 0);

  if (!hasOrders) {
    return (
      <EmptyState
        title="No active kitchen orders."
        description="New orders will appear here when they enter the kitchen queue."
        className="min-h-64"
      />
    );
  }

  return (
    <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {KITCHEN_BOARD_STATUSES.map((status) => (
        <section key={status} className="bg-muted/20 flex min-h-64 flex-col rounded-xl border p-3">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              {STATUS_LABELS[status]}
            </h2>
            <span className="text-muted-foreground text-xs">{groupedOrders[status].length}</span>
          </header>
          <div className="space-y-3 overflow-y-auto pr-1">
            {groupedOrders[status].length === 0 ? (
              <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-xs">
                No orders
              </p>
            ) : (
              groupedOrders[status].map((order) => (
                <KitchenOrderCard
                  key={order.queueItemId}
                  order={order}
                  isPending={isPending}
                  onAction={(queueItemId) => onAction(queueItemId, order.status)}
                />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
