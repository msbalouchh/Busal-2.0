"use client";

import type { FulfilmentType, OrderStatus } from "@prisma/client";
import { Loader2, XCircle } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cancelRestaurantOrderAction,
  queryRestaurantOrdersAction,
} from "@/modules/restaurant-operations/actions/restaurant-operations-actions";
import {
  FULFILMENT_TYPE_OPTIONS,
  ORDER_STATUS_OPTIONS,
} from "@/modules/restaurant-operations/constants/restaurant-operations";
import type {
  OrderQueueResult,
  RestaurantOperationsPermissions,
} from "@/modules/restaurant-operations/types/restaurant-operations-types";

interface RestaurantOrdersPanelProps {
  initialQueue: OrderQueueResult;
  permissions: RestaurantOperationsPermissions;
}

export function RestaurantOrdersPanel({ initialQueue, permissions }: RestaurantOrdersPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [queue, setQueue] = useState(initialQueue);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fulfilmentType, setFulfilmentType] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const hasFilters = useMemo(
    () => Boolean(search.trim() || status || fulfilmentType || paymentStatus),
    [search, status, fulfilmentType, paymentStatus],
  );

  const loadQueue = (page = queue.page) => {
    startTransition(async () => {
      try {
        const result = await queryRestaurantOrdersAction({
          search: search.trim() || undefined,
          status: status ? (status as OrderStatus) : undefined,
          fulfilmentType: fulfilmentType ? (fulfilmentType as FulfilmentType) : undefined,
          paymentStatus:
            paymentStatus === "UNPAID" || paymentStatus === "PARTIAL" || paymentStatus === "PAID"
              ? paymentStatus
              : undefined,
          page,
        });
        setQueue(result.queue);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load orders");
      }
    });
  };

  const handleCancel = (orderId: string) => {
    startTransition(async () => {
      try {
        await cancelRestaurantOrderAction(orderId);
        toast.success("Order cancelled");
        loadQueue();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to cancel order");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="order-search">Search</Label>
          <Input
            id="order-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Order #, customer, phone"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="order-status">Status</Label>
          <select
            id="order-status"
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="order-fulfilment">Fulfilment</Label>
          <select
            id="order-fulfilment"
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            value={fulfilmentType}
            onChange={(event) => setFulfilmentType(event.target.value)}
          >
            <option value="">All types</option>
            {FULFILMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="order-payment">Payment</Label>
          <select
            id="order-payment"
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value)}
          >
            <option value="">All payments</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="button" disabled={isPending} onClick={() => loadQueue(1)}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
          </Button>
          {hasFilters ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                setSearch("");
                setStatus("");
                setFulfilmentType("");
                setPaymentStatus("");
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Order</th>
              <th className="px-4 py-3 text-left font-medium">Customer</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Payment</th>
              <th className="px-4 py-3 text-left font-medium">Kitchen</th>
              <th className="px-4 py-3 text-left font-medium">Total</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {queue.items.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-muted-foreground px-4 py-8 text-center">
                  No orders match your filters.
                </td>
              </tr>
            ) : (
              queue.items.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">#{order.orderNumber}</div>
                    <div className="text-muted-foreground text-xs">
                      {order.tableName ?? "No table"} · {order.itemCount} items
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{order.customerName ?? "Walk-in"}</div>
                    <div className="text-muted-foreground text-xs">
                      {order.customerPhone ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">{order.fulfilmentType.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3">{order.status}</td>
                  <td className="px-4 py-3">{order.paymentStatus}</td>
                  <td className="px-4 py-3">{order.kitchenStatus ?? "—"}</td>
                  <td className="px-4 py-3">£{order.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {permissions.canManageOrders && order.status !== "CANCELLED" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending || order.status === "COMPLETED"}
                        onClick={() => handleCancel(order.id)}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Cancel
                      </Button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Page {queue.page} of {queue.totalPages} · {queue.total} orders
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending || queue.page <= 1}
            onClick={() => loadQueue(queue.page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || queue.page >= queue.totalPages}
            onClick={() => loadQueue(queue.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
