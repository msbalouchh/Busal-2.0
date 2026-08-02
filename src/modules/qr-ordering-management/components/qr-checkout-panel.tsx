"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { placeQrOrderFromCartAction } from "@/modules/qr-ordering-management/actions/qr-public-actions";
import {
  calculateCartTotal,
  serializeCart,
} from "@/modules/qr-ordering-management/lib/qr-cart-utils";
import { QR_PUBLIC_ROUTES } from "@/modules/qr-ordering-management/constants/routes";
import type {
  QrCartItem,
  QrSessionRecord,
} from "@/modules/qr-ordering-management/types/qr-ordering-types";

interface QrCheckoutPanelProps {
  tableToken: string;
  session: QrSessionRecord;
  items: QrCartItem[];
  onOrderPlaced: () => void;
}

export function QrCheckoutPanel({
  tableToken,
  session,
  items,
  onOrderPlaced,
}: QrCheckoutPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [customerName, setCustomerName] = useState(session.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(session.customerPhone ?? "");
  const [notes, setNotes] = useState("");
  const idempotencyRef = useRef<string | null>(null);

  const total = useMemo(() => calculateCartTotal(items), [items]);

  const handleSubmit = () => {
    if (!items.length) {
      toast.error("Cart is empty");
      return;
    }

    if (!idempotencyRef.current) {
      idempotencyRef.current = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    startTransition(async () => {
      try {
        const order = await placeQrOrderFromCartAction({
          sessionToken: session.token,
          cartJson: serializeCart({ items, updatedAt: new Date().toISOString() }),
          customerName,
          customerPhone,
          notes,
          idempotencyKey: idempotencyRef.current ?? undefined,
        });

        toast.success("Order placed");
        onOrderPlaced();
        router.push(QR_PUBLIC_ROUTES.orderTracking(tableToken, order.id));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to place order");
      }
    });
  };

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="text-muted-foreground text-sm">
          {session.businessName} · {session.tableLabel}
        </p>
      </div>

      <div className="space-y-3 rounded-xl border p-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
            <div>
              <p className="font-medium">
                {item.quantity}× {item.name}
              </p>
              {item.modifierLabels.length > 0 ? (
                <p className="text-muted-foreground text-xs">{item.modifierLabels.join(", ")}</p>
              ) : null}
            </div>
            <p>${((item.unitPrice + item.modifierTotal) * item.quantity).toFixed(2)}</p>
          </div>
        ))}
        <div className="flex items-center justify-between border-t pt-3 text-lg font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="qr-customer-name">Name (optional)</Label>
          <Input
            id="qr-customer-name"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qr-customer-phone">Phone (optional)</Label>
          <Input
            id="qr-customer-phone"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qr-order-notes">Order notes</Label>
          <textarea
            id="qr-order-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Allergies or special requests"
            rows={3}
            className="border-input bg-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <Button type="button" className="h-12 w-full" onClick={handleSubmit} disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Place order · ${total.toFixed(2)}
      </Button>
    </div>
  );
}
