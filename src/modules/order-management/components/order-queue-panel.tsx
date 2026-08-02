"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/modules/order-management/components/order-status-badge";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order-management/constants/routes";
import type { OrderManagementRecord } from "@/modules/order-management/types/order-management-types";

interface OrderQueuePanelProps {
  branchId: string;
  orders: OrderManagementRecord[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" }).format(value);
}

const QUEUE_STATUS_ORDER = ["PENDING", "CONFIRMED", "PREPARING", "READY"] as const;

export function OrderQueuePanel({ branchId, orders }: OrderQueuePanelProps) {
  const grouped = QUEUE_STATUS_ORDER.map((status) => ({
    status,
    orders: orders.filter((order) => order.status === status),
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {grouped.map((column) => (
        <Card key={column.status} className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span>{column.status.charAt(0) + column.status.slice(1).toLowerCase()}</span>
              <span className="text-muted-foreground">{column.orders.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {column.orders.length === 0 ? (
              <p className="text-muted-foreground text-xs">No orders</p>
            ) : (
              column.orders.map((order) => (
                <Link
                  key={order.id}
                  href={ORDER_MANAGEMENT_ROUTES.details(order.id, branchId)}
                  className="hover:bg-muted/50 block rounded-lg border p-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{order.orderNumber}</p>
                      <p className="text-muted-foreground text-xs capitalize">
                        {order.orderType.toLowerCase().replace("_", " ")}
                        {order.tableLabel ? ` · ${order.tableLabel}` : ""}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-2 text-sm font-semibold">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-muted-foreground text-xs">
                    {order.items.length} item{order.items.length === 1 ? "" : "s"}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
