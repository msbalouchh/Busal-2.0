"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  addCartItemAction,
  decreaseCartItemQuantityAction,
  increaseCartItemQuantityAction,
  removeCartItemAction,
} from "@/modules/public-menu/actions/cart-actions";
import {
  getOrderReviewContextAction,
  submitOrderSessionAction,
} from "@/modules/public-menu/actions/order-session-actions";
import { OrderReviewScreen } from "@/modules/public-menu/components/order-review-screen";
import { CartDrawer, FloatingCartButton } from "@/modules/public-menu/components/public-menu-cart";
import { PublicMenuView } from "@/modules/public-menu/components/public-menu-view";
import type { ClientCart } from "@/modules/public-menu/lib/cart-utils";
import {
  createEmptyOrderReviewForm,
  type OrderReviewFormState,
} from "@/modules/public-menu/lib/order-session-utils";
import type { PublicMenuViewModel } from "@/modules/public-menu/lib/public-menu-utils";

interface PublicMenuWithCartProps {
  slug: string;
  menu: PublicMenuViewModel;
  initialCart: ClientCart;
}

export function PublicMenuWithCart({ slug, menu, initialCart }: PublicMenuWithCartProps) {
  const [cart, setCart] = useState<ClientCart>(initialCart);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [tableName, setTableName] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState<OrderReviewFormState>(createEmptyOrderReviewForm());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!showReview) {
      return;
    }

    startTransition(async () => {
      try {
        const context = await getOrderReviewContextAction(slug);
        setCart(context.cart);
        setTableName(context.tableName);
        if (context.orderSession) {
          setReviewForm({
            customerName: context.orderSession.customerName,
            customerPhone: context.orderSession.customerPhone,
            orderNotes: context.orderSession.orderNotes,
          });
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load order review");
        setShowReview(false);
      }
    });
  }, [showReview, slug]);

  const handleAddItem = (menuItemId: string) => {
    startTransition(async () => {
      try {
        const updatedCart = await addCartItemAction(slug, menuItemId);
        setCart(updatedCart);
        toast.success("Added to cart");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to add item");
      }
    });
  };

  const handleIncreaseQuantity = (cartItemId: string) => {
    startTransition(async () => {
      try {
        const updatedCart = await increaseCartItemQuantityAction(slug, cartItemId);
        setCart(updatedCart);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update quantity");
      }
    });
  };

  const handleDecreaseQuantity = (cartItemId: string) => {
    startTransition(async () => {
      try {
        const updatedCart = await decreaseCartItemQuantityAction(slug, cartItemId);
        setCart(updatedCart);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update quantity");
      }
    });
  };

  const handleRemoveItem = (cartItemId: string) => {
    startTransition(async () => {
      try {
        const updatedCart = await removeCartItemAction(slug, cartItemId);
        setCart(updatedCart);
        toast.success("Item removed");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to remove item");
      }
    });
  };

  const handleOpenReview = () => {
    setDrawerOpen(false);
    setShowReview(true);
  };

  const handleSubmitReview = () => {
    startTransition(async () => {
      try {
        await submitOrderSessionAction(slug, reviewForm);
        toast.success("Order session saved");
        setShowReview(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save order session");
      }
    });
  };

  if (showReview) {
    return (
      <OrderReviewScreen
        cart={cart}
        tableName={tableName}
        form={reviewForm}
        isPending={isPending}
        onBack={() => setShowReview(false)}
        onFormChange={setReviewForm}
        onContinue={handleSubmitReview}
      />
    );
  }

  return (
    <>
      <PublicMenuView menu={menu} onAddItem={handleAddItem} isCartPending={isPending} />
      <FloatingCartButton cart={cart} onClick={() => setDrawerOpen(true)} />
      <CartDrawer
        open={drawerOpen}
        cart={cart}
        isPending={isPending}
        onOpenChange={setDrawerOpen}
        onIncreaseQuantity={handleIncreaseQuantity}
        onDecreaseQuantity={handleDecreaseQuantity}
        onRemoveItem={handleRemoveItem}
        onContinue={handleOpenReview}
      />
    </>
  );
}
