"use client";

import { Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  acceptKitchenOrderAction,
  completeKitchenOrderAction,
  markKitchenOrderReadyAction,
  markKitchenOrderServedAction,
  startKitchenPreparingAction,
  toggleKitchenOrderPriorityAction,
  updateKitchenItemStatusAction,
} from "@/modules/kitchen-display-management/actions/kitchen-display-actions";
import { KitchenItemStatusPanel } from "@/modules/kitchen-display-management/components/kitchen-item-status-panel";
import { KitchenStatusBadge } from "@/modules/kitchen-display-management/components/kitchen-status-badge";
import { PreparationTimer } from "@/modules/kitchen-display-management/components/preparation-timer";
import type { KitchenDisplayPermissions } from "@/modules/kitchen-display-management/lib/get-kitchen-display-context";
import type { KitchenOrderRecord } from "@/modules/kitchen-display-management/types/kitchen-display-types";

interface KitchenOrderCardProps {
  branchId: string;
  order: KitchenOrderRecord;
  permissionsFlags: KitchenDisplayPermissions;
  compact?: boolean;
}

export function KitchenOrderCard({
  branchId,
  order,
  permissionsFlags,
  compact = false,
}: KitchenOrderCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const runAction = (action: () => Promise<{ success: boolean }>, message: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(message);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  const maxPrepTarget = order.items.reduce<number | null>((max, item) => {
    if (item.preparationTimeMinutes == null) return max;
    return max == null ? item.preparationTimeMinutes : Math.max(max, item.preparationTimeMinutes);
  }, null);

  return (
    <Card
      className={`rounded-xl shadow-sm ${order.isPriority ? "border-primary ring-primary/20 ring-2" : ""}`}
    >
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {order.orderNumber}
              {order.isPriority ? <Star className="text-primary h-4 w-4 fill-current" /> : null}
            </CardTitle>
            <p className="text-muted-foreground text-xs capitalize">
              {order.orderType.toLowerCase().replace("_", " ")}
              {order.tableLabel ? ` · ${order.tableLabel}` : ""}
              {order.customerName ? ` · ${order.customerName}` : ""}
            </p>
          </div>
          <KitchenStatusBadge status={order.kitchenStatus} />
        </div>
        <PreparationTimer
          placedAt={order.placedAt}
          preparingStartedAt={order.kitchenPreparingAt}
          targetMinutes={maxPrepTarget}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <KitchenItemStatusPanel
          branchId={branchId}
          orderId={order.id}
          items={order.items}
          canUpdate={permissionsFlags.canUpdate}
          disabled={isPending}
          onItemStatusChange={(itemId, status) =>
            runAction(
              () => updateKitchenItemStatusAction(branchId, order.id, itemId, status),
              "Item status updated",
            )
          }
        />

        {order.notes ? (
          <p className="text-muted-foreground rounded-md border border-dashed p-2 text-xs italic">
            {order.notes}
          </p>
        ) : null}

        {permissionsFlags.canUpdate && !compact ? (
          <div className="grid gap-2">
            {order.kitchenStatus === "NEW" ? (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  runAction(() => acceptKitchenOrderAction(branchId, order.id), "Order accepted")
                }
              >
                Accept
              </Button>
            ) : null}
            {["NEW", "ACCEPTED"].includes(order.kitchenStatus) ? (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => startKitchenPreparingAction(branchId, order.id),
                    "Preparation started",
                  )
                }
              >
                Start preparing
              </Button>
            ) : null}
            {order.kitchenStatus === "PREPARING" ? (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => markKitchenOrderReadyAction(branchId, order.id),
                    "Order marked ready",
                  )
                }
              >
                Mark ready
              </Button>
            ) : null}
            {order.kitchenStatus === "READY" ? (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  runAction(() => markKitchenOrderServedAction(branchId, order.id), "Order served")
                }
              >
                Mark served
              </Button>
            ) : null}
            {order.kitchenStatus === "SERVED" ? (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  runAction(() => completeKitchenOrderAction(branchId, order.id), "Order completed")
                }
              >
                Complete
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                runAction(
                  () => toggleKitchenOrderPriorityAction(branchId, order.id, !order.isPriority),
                  order.isPriority ? "Priority removed" : "Marked as priority",
                )
              }
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {order.isPriority ? "Remove priority" : "Mark priority"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
