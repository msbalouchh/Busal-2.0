"use client";

import { Loader2, Maximize2, Search, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BranchSelector } from "@/modules/branch-management/components/branch-selector";
import { KitchenDashboardStatsCards } from "@/modules/kitchen-display-management/components/kitchen-dashboard-stats";
import { KitchenEmptyState } from "@/modules/kitchen-display-management/components/kitchen-empty-state";
import { KitchenOrderCard } from "@/modules/kitchen-display-management/components/kitchen-order-card";
import {
  KITCHEN_DISPLAY_ROUTES,
  KITCHEN_QUEUE_COLUMNS,
  KITCHEN_REFRESH_INTERVAL_MS,
} from "@/modules/kitchen-display-management/constants/routes";
import type { KitchenDisplayContext } from "@/modules/kitchen-display-management/lib/get-kitchen-display-context";
import type {
  KitchenDashboardStats,
  KitchenOrderRecord,
  KitchenStationRecord,
} from "@/modules/kitchen-display-management/types/kitchen-display-types";

interface KitchenDashboardPanelProps {
  context: KitchenDisplayContext;
  queue: KitchenOrderRecord[];
  stats: KitchenDashboardStats;
  stations: KitchenStationRecord[];
  initialStationId?: string;
  initialSearch?: string;
  fullscreen?: boolean;
}

export function KitchenDashboardPanel({
  context,
  queue,
  stats,
  stations,
  initialStationId = "",
  initialSearch = "",
  fullscreen = false,
}: KitchenDashboardPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [stationId, setStationId] = useState(initialStationId);
  const branchId = context.selectedBranchId;

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, KITCHEN_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [router]);

  const applyFilters = () => {
    if (!branchId) return;

    const params = new URLSearchParams({ branchId });
    if (stationId) params.set("stationId", stationId);
    if (search.trim()) params.set("search", search.trim());

    startTransition(() => {
      router.push(`${KITCHEN_DISPLAY_ROUTES.dashboard()}?${params.toString()}`);
    });
  };

  const handleBranchChange = (nextBranchId: string) => {
    startTransition(() => {
      router.push(KITCHEN_DISPLAY_ROUTES.dashboardForBranch(nextBranchId, stationId || undefined));
    });
  };

  const activeQueue = queue.filter((order) =>
    ["NEW", "ACCEPTED", "PREPARING", "READY"].includes(order.kitchenStatus),
  );
  const readyQueue = queue.filter((order) => order.kitchenStatus === "READY");
  const completedQueue = queue.filter((order) =>
    ["SERVED", "COMPLETED"].includes(order.kitchenStatus),
  );

  const groupedColumns = KITCHEN_QUEUE_COLUMNS.map((column) => ({
    ...column,
    orders: activeQueue.filter((order) => order.kitchenStatus === column.value),
  }));

  return (
    <div className={`space-y-6 ${fullscreen ? "min-h-screen p-4" : ""}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">Branch</p>
            <BranchSelector
              branches={context.branches}
              value={branchId ?? undefined}
              onValueChange={handleBranchChange}
              placeholder="Select branch"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Station</p>
            <select
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              value={stationId}
              onChange={(event) => setStationId(event.target.value)}
            >
              <option value="">All stations</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative space-y-2">
            <p className="text-sm font-medium">Search</p>
            <Search className="text-muted-foreground absolute top-9 left-3 h-4 w-4" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Order number"
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => applyFilters()} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Apply
          </Button>
          {branchId && context.permissionsFlags.canManage ? (
            <Button asChild variant="outline">
              <Link href={KITCHEN_DISPLAY_ROUTES.stations(branchId)}>
                <Settings2 className="mr-2 h-4 w-4" />
                Stations
              </Link>
            </Button>
          ) : null}
          {branchId && !fullscreen ? (
            <Button asChild>
              <Link href={KITCHEN_DISPLAY_ROUTES.fullscreen(branchId, stationId || undefined)}>
                <Maximize2 className="mr-2 h-4 w-4" />
                Full screen
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {branchId ? (
        <>
          <KitchenDashboardStatsCards stats={stats} />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Live queue</h2>
            {activeQueue.length === 0 ? (
              <KitchenEmptyState />
            ) : (
              <div className="grid gap-4 xl:grid-cols-4">
                {groupedColumns.map((column) => (
                  <div key={column.value} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">{column.label}</h3>
                      <span className="text-muted-foreground text-xs">{column.orders.length}</span>
                    </div>
                    <div className="space-y-3">
                      {column.orders.length === 0 ? (
                        <p className="text-muted-foreground text-xs">No orders</p>
                      ) : (
                        column.orders.map((order) => (
                          <KitchenOrderCard
                            key={order.id}
                            branchId={branchId}
                            order={order}
                            permissionsFlags={context.permissionsFlags}
                            compact={fullscreen}
                          />
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {readyQueue.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Ready for pickup</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {readyQueue.map((order) => (
                  <KitchenOrderCard
                    key={order.id}
                    branchId={branchId}
                    order={order}
                    permissionsFlags={context.permissionsFlags}
                    compact
                  />
                ))}
              </div>
            </section>
          ) : null}

          {completedQueue.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Completed / served</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {completedQueue.slice(0, 8).map((order) => (
                  <KitchenOrderCard
                    key={order.id}
                    branchId={branchId}
                    order={order}
                    permissionsFlags={context.permissionsFlags}
                    compact
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Select a branch to open the kitchen display.
        </p>
      )}
    </div>
  );
}
