"use client";

import Link from "next/link";
import { AlertTriangle, Loader2, Package, Plus, Search, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BranchSelector } from "@/modules/branch-management/components/branch-selector";
import { InventoryStatusBadge } from "@/modules/inventory-supplier-management/components/inventory-status-badge";
import {
  INVENTORY_SORT_OPTIONS,
  INVENTORY_STATUS_FILTER_OPTIONS,
  INVENTORY_SUPPLIER_ROUTES,
} from "@/modules/inventory-supplier-management/constants/routes";
import type { InventorySupplierContext } from "@/modules/inventory-supplier-management/lib/get-inventory-supplier-context";
import type {
  InventoryDashboardStats,
  InventoryItemRecord,
  InventoryListResult,
} from "@/modules/inventory-supplier-management/types/inventory-supplier-types";

interface InventoryDashboardPanelProps {
  context: InventorySupplierContext;
  list: InventoryListResult;
  stats: InventoryDashboardStats;
  lowStockItems: InventoryItemRecord[];
  initialSearch?: string;
  initialStatus?: string;
  initialSortBy?: string;
}

export function InventoryDashboardPanel({
  context,
  list,
  stats,
  lowStockItems,
  initialSearch = "",
  initialStatus = "ALL",
  initialSortBy = "name",
}: InventoryDashboardPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const branchId = context.selectedBranchId;

  const applyFilters = (page = 1) => {
    if (!branchId) return;
    const params = new URLSearchParams({ branchId });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (sortBy !== "name") params.set("sortBy", sortBy);
    if (page > 1) params.set("page", String(page));
    startTransition(() => {
      router.push(`${INVENTORY_SUPPLIER_ROUTES.dashboard()}?${params.toString()}`);
    });
  };

  const statCards = [
    { label: "Total items", value: stats.totalItems },
    { label: "Active items", value: stats.activeItems },
    { label: "Low stock", value: stats.lowStockCount },
    { label: "Out of stock", value: stats.outOfStockCount },
    { label: "Stock value", value: `£${stats.totalStockValue.toFixed(2)}` },
    { label: "Open POs", value: stats.openPurchaseOrders },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xs space-y-2">
          <p className="text-sm font-medium">Branch</p>
          <BranchSelector
            branches={context.branches}
            value={branchId ?? undefined}
            onValueChange={(nextBranchId) => {
              startTransition(() => {
                router.push(INVENTORY_SUPPLIER_ROUTES.dashboardForBranch(nextBranchId));
              });
            }}
            placeholder="Select branch"
            disabled={isPending}
          />
        </div>
        {branchId ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={INVENTORY_SUPPLIER_ROUTES.suppliers(branchId)}>
                <Truck className="mr-2 h-4 w-4" />
                Suppliers
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={INVENTORY_SUPPLIER_ROUTES.purchaseOrders(branchId)}>Purchase orders</Link>
            </Button>
            {context.permissionsFlags.canCreateInventory ? (
              <Button asChild>
                <Link href={INVENTORY_SUPPLIER_ROUTES.createItem(branchId)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add item
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {branchId ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statCards.map((card) => (
              <Card key={card.label} className="rounded-xl shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm">{card.label}</p>
                  <p className="text-2xl font-semibold">{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {lowStockItems.length > 0 ? (
            <Card className="rounded-xl border-amber-200 bg-amber-50/50 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Low stock alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 md:grid-cols-2">
                {lowStockItems.slice(0, 6).map((item) => (
                  <Link
                    key={item.id}
                    href={INVENTORY_SUPPLIER_ROUTES.item(item.id, branchId)}
                    className="bg-background rounded-lg border p-3 text-sm hover:shadow-sm"
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground">
                      {item.currentStock} {item.unit} · reorder at{" "}
                      {item.reorderLevel ?? item.minimumStock}
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search inventory"
                className="pl-9"
              />
            </div>
            <select
              className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {INVENTORY_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              {INVENTORY_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort by {option.label}
                </option>
              ))}
            </select>
            <Button onClick={() => applyFilters()} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apply
            </Button>
          </div>

          {list.items.length === 0 ? (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <Package className="text-muted-foreground h-10 w-10" />
                <p className="font-medium">No inventory items</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.items.map((item) => (
                <Link key={item.id} href={INVENTORY_SUPPLIER_ROUTES.item(item.id, branchId)}>
                  <Card className="h-full rounded-xl shadow-sm transition-shadow hover:shadow-md">
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <InventoryStatusBadge status={item.status} />
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {item.sku} · {item.category ?? "Uncategorised"}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stock</span>
                        <span className={item.isLowStock ? "font-medium text-amber-600" : ""}>
                          {item.currentStock} {item.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg cost</span>
                        <span>£{item.averageCost.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
