"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  calculateCartLineTotal,
  calculateCartTotal,
  formatQrCurrency,
} from "@/modules/qr-ordering-management/lib/qr-cart-utils";
import { QR_PUBLIC_ROUTES } from "@/modules/qr-ordering-management/constants/routes";
import type { QrCartItem } from "@/modules/qr-ordering-management/types/qr-ordering-types";

interface QrCartDrawerProps {
  tableToken: string;
  items: QrCartItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIncrease: (itemId: string) => void;
  onDecrease: (itemId: string) => void;
  onRemove: (itemId: string) => void;
}

export function QrCartDrawer({
  tableToken,
  items,
  open,
  onOpenChange,
  onIncrease,
  onDecrease,
  onRemove,
}: QrCartDrawerProps) {
  const total = calculateCartTotal(items);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Your cart</DrawerTitle>
        </DrawerHeader>

        <div className="space-y-4 overflow-y-auto px-4 pb-4">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">Your cart is empty.</p>
          ) : (
            items.map((item) => (
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
                    onClick={() => onRemove(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onDecrease(item.id)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onIncrease(item.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DrawerFooter>
          <div className="flex w-full items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatQrCurrency(total)}</span>
          </div>
          <Button type="button" className="w-full" asChild disabled={items.length === 0}>
            <Link href={QR_PUBLIC_ROUTES.checkout(tableToken)} onClick={() => onOpenChange(false)}>
              Checkout
            </Link>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

interface QrFloatingCartButtonProps {
  itemCount: number;
  onClick: () => void;
}

export function QrFloatingCartButton({ itemCount, onClick }: QrFloatingCartButtonProps) {
  if (itemCount <= 0) return null;

  return (
    <div className="fixed right-4 bottom-4 left-4 z-40">
      <Button type="button" className="h-12 w-full shadow-lg" onClick={onClick}>
        <ShoppingBag className="mr-2 h-4 w-4" />
        View cart ({itemCount})
      </Button>
    </div>
  );
}
