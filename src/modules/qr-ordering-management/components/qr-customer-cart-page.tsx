"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  calculateCartLineTotal,
  calculateCartTotal,
  createEmptyCart,
  formatQrCurrency,
  parseStoredCart,
  serializeCart,
} from "@/modules/qr-ordering-management/lib/qr-cart-utils";
import {
  getQrCartStorageKey,
  QR_PUBLIC_ROUTES,
} from "@/modules/qr-ordering-management/constants/routes";
import type {
  QrCartItem,
  QrSessionRecord,
} from "@/modules/qr-ordering-management/types/qr-ordering-types";

interface QrCustomerCartPageProps {
  tableToken: string;
  session: QrSessionRecord;
}

function readCart(tableToken: string): QrCartItem[] {
  if (typeof window === "undefined") return [];
  return parseStoredCart(localStorage.getItem(getQrCartStorageKey(tableToken))).items;
}

function persistCart(tableToken: string, items: QrCartItem[]) {
  localStorage.setItem(
    getQrCartStorageKey(tableToken),
    serializeCart({ items, updatedAt: new Date().toISOString() }),
  );
}

export function QrCustomerCartPage({ tableToken, session }: QrCustomerCartPageProps) {
  const [cartItems, setCartItems] = useState<QrCartItem[]>(() => readCart(tableToken));
  const [, startTransition] = useTransition();

  const total = useMemo(() => calculateCartTotal(cartItems), [cartItems]);

  const updateCart = (updater: (items: QrCartItem[]) => QrCartItem[]) => {
    startTransition(() => {
      setCartItems((current) => {
        const next = updater(current);
        persistCart(tableToken, next);
        return next;
      });
    });
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-6 pb-24">
      <Button type="button" variant="ghost" size="sm" asChild className="mb-4">
        <Link href={QR_PUBLIC_ROUTES.menu(tableToken)}>← Back to menu</Link>
      </Button>

      <div className="mb-6 flex items-center gap-2">
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Your cart</h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground text-sm">Your cart is empty.</p>
          <Button type="button" asChild>
            <Link href={QR_PUBLIC_ROUTES.menu(tableToken)}>Browse menu</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.modifierLabels.length > 0 ? (
                      <p className="text-muted-foreground text-xs">
                        {item.modifierLabels.join(", ")}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm font-semibold">
                      {formatQrCurrency(calculateCartLineTotal(item))}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${item.name}`}
                    onClick={() =>
                      updateCart((items) => items.filter((entry) => entry.id !== item.id))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Decrease ${item.name} quantity`}
                    onClick={() =>
                      updateCart((items) =>
                        items
                          .map((entry) =>
                            entry.id === item.id
                              ? { ...entry, quantity: Math.max(0, entry.quantity - 1) }
                              : entry,
                          )
                          .filter((entry) => entry.quantity > 0),
                      )
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="min-w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Increase ${item.name} quantity`}
                    onClick={() =>
                      updateCart((items) =>
                        items.map((entry) =>
                          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
                        ),
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-background fixed right-0 bottom-0 left-0 z-30 border-t p-4">
            <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs">{session.tableLabel}</p>
                <p className="text-lg font-semibold">{formatQrCurrency(total)}</p>
              </div>
              <Button type="button" asChild className="min-w-32">
                <Link href={QR_PUBLIC_ROUTES.checkout(tableToken)}>Checkout</Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function clearQrCustomerCart(tableToken: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(getQrCartStorageKey(tableToken), serializeCart(createEmptyCart()));
  }
}
