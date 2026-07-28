"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClientKitchenOrderCard } from "@/modules/kitchen/lib/kitchen-display-utils";

interface KitchenOrderCardProps {
  order: ClientKitchenOrderCard;
  isPending: boolean;
  onAction: (queueItemId: string) => void;
}

function getActionLabel(status: ClientKitchenOrderCard["status"]): string | null {
  switch (status) {
    case "NEW":
      return "Accept";
    case "ACKNOWLEDGED":
      return "Start Preparing";
    case "PREPARING":
      return "Mark Ready";
    case "READY":
      return "Mark Served";
    default:
      return null;
  }
}

export function KitchenOrderCard({ order, isPending, onAction }: KitchenOrderCardProps) {
  const actionLabel = getActionLabel(order.status);

  return (
    <article
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm",
        order.isHighPriority && "border-amber-400 ring-1 ring-amber-300",
        order.isUrgent && "border-red-400 ring-2 ring-red-300",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{order.orderNumber}</h3>
            {order.isHighPriority ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                HIGH
              </span>
            ) : null}
            {order.isUrgent ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                URGENT
              </span>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {order.fulfilmentType === "DINE_IN" && order.tableName
              ? `Table ${order.tableName}`
              : order.fulfilmentType.replace("_", " ")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">{order.elapsedLabel}</p>
          <p className="text-muted-foreground text-xs">queued</p>
        </div>
      </div>

      <div className="text-muted-foreground mt-3 space-y-1 text-xs">
        {order.customerName ? <p>Customer: {order.customerName}</p> : null}
        {order.orderNotes ? <p>Notes: {order.orderNotes}</p> : null}
        <p>{order.totalItems} items</p>
      </div>

      <ul className="mt-3 space-y-2 border-t pt-3">
        {order.items.map((item) => (
          <li key={item.id} className="text-sm">
            <span className="font-medium">{item.quantity}x</span> {item.name}
            {item.notes ? (
              <span className="text-muted-foreground block text-xs">{item.notes}</span>
            ) : null}
          </li>
        ))}
      </ul>

      {actionLabel ? (
        <Button
          type="button"
          className="mt-4 w-full"
          size="sm"
          onClick={() => onAction(order.queueItemId)}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {actionLabel}
        </Button>
      ) : null}
    </article>
  );
}
