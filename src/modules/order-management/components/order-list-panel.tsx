"use client";

import { ClipboardList, LayoutGrid, List, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BranchSelector } from "@/modules/branch-management/components/branch-selector";
import { OrderDashboardStatsCards } from "@/modules/order-management/components/order-dashboard-stats";
import { OrderEmptyState } from "@/modules/order-management/components/order-empty-state";
import { OrderQueuePanel } from "@/modules/order-management/components/order-queue-panel";
import { OrderStatusBadge } from "@/modules/order-management/components/order-status-badge";
import {
  ORDER_MANAGEMENT_ROUTES,
  ORDER_PAYMENT_STATUS_FILTER_OPTIONS,
  ORDER_SORT_OPTIONS,
  ORDER_STATUS_FILTER_OPTIONS,
  ORDER_TYPE_FILTER_OPTIONS,
} from "@/modules/order-management/constants/routes";
import type { OrderManagementContext } from "@/modules/order-management/lib/get-order-management-context";
import type {
  OrderDashboardStats,
  OrderListResult,
  OrderManagementRecord,
} from "@/modules/order-management/types/order-management-types";

type OrderViewMode = "list" | "queue";

interface OrderListPanelProps {
  context: OrderManagementContext;
  list: OrderListResult;
  stats: OrderDashboardStats;
  queueOrders: OrderManagementRecord[];
  initialSearch?: string;
  initialStatus?: string;
  initialOrderType?: string;
  initialPaymentStatus?: string;
  initialSortBy?: string;
  initialSortDirection?: string;
  initialView?: OrderViewMode;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" }).format(value);
}

export function OrderListPanel({
  context,
  list,
  stats,
  queueOrders,
  initialSearch = "",
  initialStatus = "ALL",
  initialOrderType = "ALL",
  initialPaymentStatus = "ALL",
  initialSortBy = "placedAt",
  initialSortDirection = "desc",
  initialView = "list",
}: OrderListPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [orderType, setOrderType] = useState(initialOrderType);
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection] = useState(initialSortDirection);
  const [view, setView] = useState<OrderViewMode>(initialView);
  const branchId = context.selectedBranchId;

  const applyFilters = (page = 1) => {
    if (!branchId) return;

    const params = new URLSearchParams({ branchId, view });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (orderType !== "ALL") params.set("orderType", orderType);
    if (paymentStatus !== "ALL") params.set("paymentStatus", paymentStatus);
    if (sortBy !== "placedAt") params.set("sortBy", sortBy);
    if (sortDirection !== "desc") params.set("sortDirection", sortDirection);
    if (page > 1) params.set("page", String(page));

    startTransition(() => {
      router.push(`${ORDER_MANAGEMENT_ROUTES.list()}?${params.toString()}`);
    });
  };

  const handleBranchChange = (nextBranchId: string) => {
    startTransition(() => {
      router.push(ORDER_MANAGEMENT_ROUTES.listForBranch(nextBranchId));
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium">Branch</p>
          <BranchSelector
            branches={context.branches}
            value={branchId ?? undefined}
            onValueChange={handleBranchChange}
            placeholder="Select branch"
          />
        </div>
        {branchId && context.permissionsFlags.canCreate ? (
          <Button asChild>
            <Link href={ORDER_MANAGEMENT_ROUTES.create(branchId)}>
              <Plus className="mr-2 h-4 w-4" />
              Create order
            </Link>
          </Button>
        ) : null}
      </div>

      {branchId ? (
        <>
          <OrderDashboardStatsCards stats={stats} />

          <div className="space-y-6">
            <div className="grid gap-3 lg:grid-cols-6">
              <div className="relative lg:col-span-2">
                <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search orders"
                  className="pl-9"
                />
              </div>
              <select
                className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm"
                value={orderType}
                onChange={(event) => setOrderType(event.target.value)}
              >
                {ORDER_TYPE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="border-input bg-background flex h-10 rounded-md border px-3 py-2 text-sm"
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value)}
              >
                {ORDER_PAYMENT_STATUS_FILTER_OPTIONS.map((option) => (
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
                {ORDER_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => applyFilters()} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Apply filters
              </Button>
              <Button
                variant={view === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setView("list");
                  applyFilters();
                }}
              >
                <List className="mr-2 h-4 w-4" />
                List
              </Button>
              <Button
                variant={view === "queue" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setView("queue");
                  applyFilters();
                }}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Queue
              </Button>
            </div>

            {view === "list" ? (
              list.items.length === 0 ? (
                <OrderEmptyState
                  branchId={branchId}
                  canCreate={context.permissionsFlags.canCreate}
                />
              ) : (
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr className="text-left">
                        <th className="p-3 font-medium">Order</th>
                        <th className="p-3 font-medium">Type</th>
                        <th className="p-3 font-medium">Table / Guest</th>
                        <th className="p-3 font-medium">Total</th>
                        <th className="p-3 font-medium">Payment</th>
                        <th className="p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.items.map((order) => (
                        <tr key={order.id} className="border-t">
                          <td className="p-3">
                            <Link
                              href={ORDER_MANAGEMENT_ROUTES.details(order.id, branchId)}
                              className="font-medium hover:underline"
                            >
                              {order.orderNumber}
                            </Link>
                            <p className="text-muted-foreground text-xs">
                              {new Date(order.placedAt).toLocaleString()}
                            </p>
                          </td>
                          <td className="p-3 capitalize">
                            {order.orderType.toLowerCase().replace("_", " ")}
                          </td>
                          <td className="p-3">
                            {order.tableLabel ?? order.customerName ?? "Walk-in"}
                          </td>
                          <td className="p-3">{formatCurrency(order.totalAmount)}</td>
                          <td className="p-3 capitalize">
                            {order.paymentStatus.toLowerCase().replace("_", " ")}
                          </td>
                          <td className="p-3">
                            <OrderStatusBadge status={order.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : null}

            {view === "queue" ? <OrderQueuePanel branchId={branchId} orders={queueOrders} /> : null}

            {view === "list" && list.totalPages > 1 ? (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Page {list.page} of {list.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={list.page <= 1 || isPending}
                    onClick={() => applyFilters(list.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={list.page >= list.totalPages || isPending}
                    onClick={() => applyFilters(list.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <ClipboardList className="text-muted-foreground h-8 w-8" />
          <p className="text-muted-foreground text-sm">Select a branch to manage orders.</p>
        </div>
      )}
    </div>
  );
}
