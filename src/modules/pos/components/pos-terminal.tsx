"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  addPosItemAction,
  clearPosOrderAction,
  holdPosOrderAction,
  removePosItemAction,
  resumePosOrderAction,
  sendPosOrderToKitchenAction,
  updatePosItemQuantityAction,
} from "@/modules/pos/actions/pos-actions";
import { PosCartPanel } from "@/modules/pos/components/pos-cart-panel";
import { PosMenuPanel } from "@/modules/pos/components/pos-menu-panel";
import type { PosOrderType } from "@/modules/pos/constants/routes";
import { PAYMENT_ROUTES } from "@/modules/payments/constants/routes";
import type {
  PosCartView,
  PosHeldOrderView,
  PosMenuCategoryView,
  PosMenuItemView,
  PosTableView,
} from "@/modules/pos/types/pos";

interface PosTerminalProps {
  posSessionId: string;
  initialCart: PosCartView;
  initialHeldOrders: PosHeldOrderView[];
  categories: PosMenuCategoryView[];
  menuItems: PosMenuItemView[];
  tables: PosTableView[];
}

export function PosTerminal({
  posSessionId,
  initialCart,
  initialHeldOrders,
  categories,
  menuItems,
  tables,
}: PosTerminalProps) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [heldOrders, setHeldOrders] = useState(initialHeldOrders);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderType, setOrderType] = useState<PosOrderType>("DINE_IN");
  const [tableId, setTableId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const tableName = useMemo(
    () => tables.find((table) => table.id === tableId)?.name ?? null,
    [tableId, tables],
  );

  const runAction = (action: () => Promise<void>) => {
    startTransition(async () => {
      try {
        await action();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "POS action failed");
      }
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 xl:flex-row">
      <PosMenuPanel
        categories={categories}
        menuItems={menuItems}
        selectedCategoryId={selectedCategoryId}
        searchQuery={searchQuery}
        isPending={isPending}
        onCategoryChange={setSelectedCategoryId}
        onSearchChange={setSearchQuery}
        onAddItem={(menuItemId) =>
          runAction(async () => {
            const result = await addPosItemAction({ cartId: cart.id, menuItemId });
            setCart(result.cart);
            toast.success("Item added");
          })
        }
      />

      <PosCartPanel
        cart={cart}
        heldOrders={heldOrders}
        tables={tables}
        orderType={orderType}
        tableId={tableId}
        customerName={customerName}
        orderNotes={orderNotes}
        isPending={isPending}
        onOrderTypeChange={setOrderType}
        onTableChange={setTableId}
        onCustomerNameChange={setCustomerName}
        onOrderNotesChange={setOrderNotes}
        onIncreaseQuantity={(cartItemId, quantity) =>
          runAction(async () => {
            const result = await updatePosItemQuantityAction({
              cartItemId,
              quantity: quantity + 1,
            });
            setCart(result.cart);
          })
        }
        onDecreaseQuantity={(cartItemId, quantity) =>
          runAction(async () => {
            const result = await updatePosItemQuantityAction({
              cartItemId,
              quantity: Math.max(1, quantity - 1),
            });
            setCart(result.cart);
          })
        }
        onRemoveItem={(cartItemId) =>
          runAction(async () => {
            const result = await removePosItemAction({ cartItemId });
            setCart(result.cart);
          })
        }
        onClearOrder={() =>
          runAction(async () => {
            const result = await clearPosOrderAction({ cartId: cart.id });
            setCart(result.cart);
            toast.success("Order cleared");
          })
        }
        onHoldOrder={() =>
          runAction(async () => {
            const result = await holdPosOrderAction({
              posSessionId,
              cartId: cart.id,
              tableId,
              orderType,
              customerName: customerName || null,
              orderNotes: orderNotes || null,
              label: tableName ? `Table ${tableName}` : undefined,
            });
            setCart(result.cart);
            setHeldOrders(result.heldOrders);
            setCustomerName("");
            setOrderNotes("");
            setTableId(null);
            toast.success("Order held");
          })
        }
        onResumeOrder={(orderSessionId) =>
          runAction(async () => {
            const result = await resumePosOrderAction({ posSessionId, orderSessionId });
            setCart(result.cart);
            setHeldOrders(result.heldOrders);
            toast.success("Held order resumed");
          })
        }
        onSendToKitchen={() =>
          runAction(async () => {
            const result = await sendPosOrderToKitchenAction({
              posSessionId,
              cartId: cart.id,
              tableId,
              orderType,
              customerName: customerName || null,
              orderNotes: orderNotes || null,
            });
            setCart(result.cart);
            setHeldOrders(result.heldOrders);
            setCustomerName("");
            setOrderNotes("");
            setTableId(null);
            toast.success(`Order ${result.result.orderNumber} sent to kitchen`);
            router.push(PAYMENT_ROUTES.order(result.result.orderId));
          })
        }
      />
    </div>
  );
}
