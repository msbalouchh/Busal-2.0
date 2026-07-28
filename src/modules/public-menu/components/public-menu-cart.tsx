"use client";

import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { ClientCart } from "@/modules/public-menu/lib/cart-utils";

interface CartDrawerProps {
  open: boolean;
  cart: ClientCart;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onIncreaseQuantity: (cartItemId: string) => void;
  onDecreaseQuantity: (cartItemId: string) => void;
  onRemoveItem: (cartItemId: string) => void;
  onContinue: () => void;
}

export function CartDrawer({
  open,
  cart,
  isPending,
  onOpenChange,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveItem,
  onContinue,
}: CartDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Your cart</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-4">
          {cart.items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-sm">Your cart is empty.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <article key={item.id} className="flex gap-3 rounded-lg border bg-white p-3">
                  <div className="bg-muted flex h-16 w-16 shrink-0 items-center justify-center rounded-lg">
                    <span className="text-muted-foreground text-[10px] font-medium">No image</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm leading-tight font-semibold">{item.menuItemName}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => onRemoveItem(item.id)}
                        disabled={isPending}
                        aria-label={`Remove ${item.menuItemName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">{item.unitPriceLabel} each</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onDecreaseQuantity(item.id)}
                          disabled={isPending}
                          aria-label={`Decrease ${item.menuItemName} quantity`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="min-w-6 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onIncreaseQuantity(item.id)}
                          disabled={isPending}
                          aria-label={`Increase ${item.menuItemName} quantity`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm font-semibold">{item.totalPriceLabel}</p>
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs italic">
                      Notes: {item.notes?.trim() || "None"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        <DrawerFooter className="border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-base font-semibold">{cart.subtotalLabel}</span>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={onContinue}
            disabled={isPending || cart.items.length === 0}
          >
            Continue
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

interface FloatingCartButtonProps {
  cart: ClientCart;
  onClick: () => void;
}

export function FloatingCartButton({ cart, onClick }: FloatingCartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-primary text-primary-foreground fixed right-4 bottom-4 z-40 flex items-center gap-3 rounded-full px-4 py-3 shadow-lg transition-transform hover:scale-[1.02] sm:right-6 sm:bottom-6"
      aria-label="Open cart"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="text-sm font-semibold">{cart.itemCount} items</span>
      <span className="text-sm font-semibold">{cart.subtotalLabel}</span>
    </button>
  );
}
