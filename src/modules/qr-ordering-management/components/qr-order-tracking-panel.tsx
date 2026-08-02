"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { QR_ORDER_REFRESH_INTERVAL_MS } from "@/modules/qr-ordering-management/constants/routes";
import { formatQrCurrency } from "@/modules/qr-ordering-management/lib/qr-cart-utils";
import type { QrOrderTrackingRecord } from "@/modules/qr-ordering-management/types/qr-ordering-types";

const STATUS_LABELS: Record<string, string> = {
  NEW: "Received",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  COMPLETED: "Completed",
};

interface QrOrderTrackingPanelProps {
  order: QrOrderTrackingRecord;
}

export function QrOrderTrackingPanel({ order }: QrOrderTrackingPanelProps) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), QR_ORDER_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="space-y-6 pb-24">
      <div>
        <p className="text-muted-foreground text-sm">Order {order.orderNumber}</p>
        <h1 className="text-2xl font-semibold">Order tracking</h1>
      </div>

      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-sm">Kitchen status</p>
            <p className="text-lg font-semibold">
              {STATUS_LABELS[order.kitchenStatus] ?? order.kitchenStatus}
            </p>
          </div>
          <Badge>{order.status}</Badge>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Placed {new Date(order.placedAt).toLocaleTimeString()}
        </p>
        <p className="mt-3 text-lg font-semibold">{formatQrCurrency(order.totalAmount)}</p>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Items</h2>
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between rounded-lg border p-3 text-sm"
          >
            <div>
              <p className="font-medium">
                {item.quantity}× {item.name}
              </p>
              {item.modifiers.length > 0 ? (
                <p className="text-muted-foreground text-xs">{item.modifiers.join(", ")}</p>
              ) : null}
            </div>
            <Badge variant="outline">{item.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
