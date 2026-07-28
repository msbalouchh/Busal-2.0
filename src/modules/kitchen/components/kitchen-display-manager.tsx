"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  acceptKitchenOrderAction,
  fetchKitchenQueueAction,
  markKitchenOrderReadyAction,
  markKitchenOrderServedAction,
  startPreparingKitchenOrderAction,
} from "@/modules/kitchen/actions/kitchen-actions";
import { KitchenBoard } from "@/modules/kitchen/components/kitchen-board";
import { KitchenFilters } from "@/modules/kitchen/components/kitchen-filters";
import {
  KITCHEN_REFRESH_INTERVAL_MS,
  type KitchenPriorityFilterValue,
  type KitchenStationFilterValue,
  type KitchenStatusFilterValue,
} from "@/modules/kitchen/constants/routes";
import {
  filterKitchenOrders,
  groupKitchenOrdersByStatus,
  refreshElapsedLabels,
  type ClientKitchenOrderCard,
} from "@/modules/kitchen/lib/kitchen-display-utils";

interface KitchenDisplayManagerProps {
  initialOrders: ClientKitchenOrderCard[];
}

export function KitchenDisplayManager({ initialOrders }: KitchenDisplayManagerProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [stationFilter, setStationFilter] = useState<KitchenStationFilterValue>("");
  const [priorityFilter, setPriorityFilter] = useState<KitchenPriorityFilterValue>("");
  const [statusFilter, setStatusFilter] = useState<KitchenStatusFilterValue>("");
  const [isPending, startTransition] = useTransition();

  const refreshQueue = useCallback(() => {
    startTransition(async () => {
      try {
        const nextOrders = await fetchKitchenQueueAction();
        setOrders(nextOrders);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to refresh kitchen queue");
      }
    });
  }, []);

  useEffect(() => {
    const refreshTimer = window.setInterval(refreshQueue, KITCHEN_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(refreshTimer);
  }, [refreshQueue]);

  useEffect(() => {
    const timerTimer = window.setInterval(() => {
      setOrders((current) => refreshElapsedLabels(current));
    }, 1000);
    return () => window.clearInterval(timerTimer);
  }, []);

  const filteredOrders = useMemo(
    () =>
      filterKitchenOrders(orders, {
        searchQuery,
        stationFilter,
        priorityFilter,
        statusFilter,
      }),
    [orders, searchQuery, stationFilter, priorityFilter, statusFilter],
  );

  const groupedOrders = useMemo(() => groupKitchenOrdersByStatus(filteredOrders), [filteredOrders]);

  const handleAction = (queueItemId: string, status: ClientKitchenOrderCard["status"]) => {
    startTransition(async () => {
      try {
        let nextOrders: ClientKitchenOrderCard[];

        switch (status) {
          case "NEW":
            nextOrders = await acceptKitchenOrderAction(queueItemId);
            break;
          case "ACKNOWLEDGED":
            nextOrders = await startPreparingKitchenOrderAction(queueItemId);
            break;
          case "PREPARING":
            nextOrders = await markKitchenOrderReadyAction(queueItemId);
            break;
          case "READY":
            nextOrders = await markKitchenOrderServedAction(queueItemId);
            break;
          default:
            return;
        }

        setOrders(nextOrders);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update kitchen order");
      }
    });
  };

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col gap-4">
      <KitchenFilters
        searchQuery={searchQuery}
        stationFilter={stationFilter}
        priorityFilter={priorityFilter}
        statusFilter={statusFilter}
        isPending={isPending}
        onSearchChange={setSearchQuery}
        onStationFilterChange={setStationFilter}
        onPriorityFilterChange={setPriorityFilter}
        onStatusFilterChange={setStatusFilter}
      />
      <KitchenBoard groupedOrders={groupedOrders} isPending={isPending} onAction={handleAction} />
    </div>
  );
}
