"use client";

import type { RestaurantOrderItemStatus } from "@prisma/client";

import { OrderKitchenStatusBadge } from "@/modules/order-management/components/order-kitchen-status-badge";
import type { KitchenOrderItemRecord } from "@/modules/kitchen-display-management/types/kitchen-display-types";

interface KitchenItemStatusPanelProps {
  branchId: string;
  orderId: string;
  items: KitchenOrderItemRecord[];
  canUpdate: boolean;
  disabled?: boolean;
  onItemStatusChange: (itemId: string, status: RestaurantOrderItemStatus) => void;
}

const ITEM_ACTIONS: Array<{ label: string; status: RestaurantOrderItemStatus }> = [
  { label: "Prepare", status: "PREPARING" },
  { label: "Ready", status: "READY" },
  { label: "Served", status: "SERVED" },
];

export function KitchenItemStatusPanel({
  items,
  canUpdate,
  disabled = false,
  onItemStatusChange,
}: KitchenItemStatusPanelProps) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">No items for this station.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-lg border p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium">
                {item.quantity}× {item.productNameSnapshot}
              </p>
              {item.modifiers.length > 0 ? (
                <p className="text-muted-foreground text-xs">
                  {item.modifiers.map((modifier) => modifier.nameSnapshot).join(", ")}
                </p>
              ) : null}
              {item.specialInstructions ? (
                <p className="text-muted-foreground text-xs italic">{item.specialInstructions}</p>
              ) : null}
            </div>
            <OrderKitchenStatusBadge status={item.status} />
          </div>
          {canUpdate && item.status !== "SERVED" && item.status !== "CANCELLED" ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {ITEM_ACTIONS.filter((action) => action.status !== item.status).map((action) => (
                <button
                  key={action.status}
                  type="button"
                  disabled={disabled}
                  className="hover:bg-muted rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                  onClick={() => onItemStatusChange(item.id, action.status)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
