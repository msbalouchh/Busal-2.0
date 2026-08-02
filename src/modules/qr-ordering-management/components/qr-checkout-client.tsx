"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { QrCheckoutPanel } from "@/modules/qr-ordering-management/components/qr-checkout-panel";
import { clearQrCustomerCart } from "@/modules/qr-ordering-management/components/qr-customer-cart-page";
import { parseStoredCart } from "@/modules/qr-ordering-management/lib/qr-cart-utils";
import {
  getQrCartStorageKey,
  QR_PUBLIC_ROUTES,
} from "@/modules/qr-ordering-management/constants/routes";
import type { QrSessionRecord } from "@/modules/qr-ordering-management/types/qr-ordering-types";

interface QrCheckoutClientProps {
  tableToken: string;
  session: QrSessionRecord;
}

export function QrCheckoutClient({ tableToken, session }: QrCheckoutClientProps) {
  const [mounted, setMounted] = useState(false);
  const cart = mounted
    ? parseStoredCart(localStorage.getItem(getQrCartStorageKey(tableToken)))
    : { items: [], updatedAt: new Date().toISOString() };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <p className="text-muted-foreground text-sm">Loading cart…</p>;
  }

  if (!cart.items.length) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button type="button" asChild>
          <Link href={QR_PUBLIC_ROUTES.menu(tableToken)}>Back to menu</Link>
        </Button>
      </div>
    );
  }

  return (
    <QrCheckoutPanel
      tableToken={tableToken}
      session={session}
      items={cart.items}
      onOrderPlaced={() => clearQrCustomerCart(tableToken)}
    />
  );
}
