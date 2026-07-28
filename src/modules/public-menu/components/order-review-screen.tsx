"use client";

import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClientCart } from "@/modules/public-menu/lib/cart-utils";
import {
  isOrderReviewValid,
  type OrderReviewFormState,
} from "@/modules/public-menu/lib/order-session-utils";

interface OrderReviewScreenProps {
  cart: ClientCart;
  tableName: string | null;
  form: OrderReviewFormState;
  isPending: boolean;
  onBack: () => void;
  onFormChange: (form: OrderReviewFormState) => void;
  onContinue: () => void;
}

export function OrderReviewScreen({
  cart,
  tableName,
  form,
  isPending,
  onBack,
  onFormChange,
  onContinue,
}: OrderReviewScreenProps) {
  const canContinue = isOrderReviewValid(cart.itemCount);

  return (
    <div className="bg-muted/30 min-h-screen">
      <header className="border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <Button type="button" variant="ghost" size="icon" onClick={onBack} disabled={isPending}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Order review</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6">
        <section className="space-y-3 rounded-xl border bg-white p-4">
          <h2 className="text-base font-semibold">Your items</h2>
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{item.menuItemName}</p>
                  <p className="text-muted-foreground mt-1">
                    Qty {item.quantity} · {item.unitPriceLabel} each
                  </p>
                </div>
                <p className="font-semibold">{item.totalPriceLabel}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t pt-3 text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-base font-semibold">{cart.subtotalLabel}</span>
          </div>
        </section>

        <section className="space-y-2 rounded-xl border bg-white p-4">
          <Label htmlFor="order-table">Table</Label>
          <Input
            id="order-table"
            value={tableName ?? "Not assigned"}
            readOnly
            disabled
            className="bg-muted/40"
          />
        </section>

        <section className="space-y-4 rounded-xl border bg-white p-4">
          <div className="space-y-2">
            <Label htmlFor="order-notes">Order notes</Label>
            <textarea
              id="order-notes"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Any special requests?"
              value={form.orderNotes}
              onChange={(event) => onFormChange({ ...form, orderNotes: event.target.value })}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-name">Customer name (optional)</Label>
            <Input
              id="customer-name"
              value={form.customerName}
              onChange={(event) => onFormChange({ ...form, customerName: event.target.value })}
              disabled={isPending}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-phone">Customer phone (optional)</Label>
            <Input
              id="customer-phone"
              value={form.customerPhone}
              onChange={(event) => onFormChange({ ...form, customerPhone: event.target.value })}
              disabled={isPending}
              placeholder="Phone number"
            />
          </div>
        </section>

        <Button
          type="button"
          className="w-full"
          onClick={onContinue}
          disabled={!canContinue || isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continue
        </Button>
      </main>
    </div>
  );
}
