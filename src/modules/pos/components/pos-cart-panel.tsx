"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { POS_ORDER_TYPES, type PosOrderType } from "@/modules/pos/constants/routes";
import { getPosOrderTypeLabel } from "@/modules/pos/components/pos-page-header";
import type { PosCartView, PosHeldOrderView, PosTableView } from "@/modules/pos/types/pos";
import { formatPosMoney } from "@/modules/pos/utils/pos-utils";
import { PosTablePicker } from "@/modules/pos/components/pos-table-picker";

interface PosCartPanelProps {
  cart: PosCartView;
  heldOrders: PosHeldOrderView[];
  tables: PosTableView[];
  orderType: PosOrderType;
  tableId: string | null;
  customerName: string;
  orderNotes: string;
  isPending: boolean;
  onOrderTypeChange: (orderType: PosOrderType) => void;
  onTableChange: (tableId: string | null) => void;
  onCustomerNameChange: (value: string) => void;
  onOrderNotesChange: (value: string) => void;
  onIncreaseQuantity: (cartItemId: string, quantity: number) => void;
  onDecreaseQuantity: (cartItemId: string, quantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearOrder: () => void;
  onHoldOrder: () => void;
  onResumeOrder: (orderSessionId: string) => void;
  onSendToKitchen: () => void;
}

export function PosCartPanel({
  cart,
  heldOrders,
  tables,
  orderType,
  tableId,
  customerName,
  orderNotes,
  isPending,
  onOrderTypeChange,
  onTableChange,
  onCustomerNameChange,
  onOrderNotesChange,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveItem,
  onClearOrder,
  onHoldOrder,
  onResumeOrder,
  onSendToKitchen,
}: PosCartPanelProps) {
  const selectedTable = tables.find((table) => table.id === tableId) ?? null;

  return (
    <section className="bg-card flex min-h-0 w-full flex-col gap-4 rounded-xl border p-4 shadow-sm xl:w-[420px] xl:shrink-0">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold">Current Order</p>
          <p className="text-muted-foreground text-xs">
            {selectedTable ? `Table ${selectedTable.name}` : "Walk-in"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {POS_ORDER_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant={orderType === type ? "default" : "outline"}
              disabled={isPending || type === "DELIVERY"}
              onClick={() => onOrderTypeChange(type)}
            >
              {getPosOrderTypeLabel(type)}
            </Button>
          ))}
        </div>

        <PosTablePicker
          tables={tables}
          selectedTableId={tableId}
          disabled={isPending || orderType !== "DINE_IN"}
          onSelect={onTableChange}
        />

        <input
          value={customerName}
          onChange={(event) => onCustomerNameChange(event.target.value)}
          placeholder="Customer name (optional)"
          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
        />

        <textarea
          value={orderNotes}
          onChange={(event) => onOrderNotesChange(event.target.value)}
          placeholder="Order notes"
          rows={2}
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border">
        {cart.items.length === 0 ? (
          <div className="text-muted-foreground flex h-full min-h-40 items-center justify-center p-4 text-sm">
            Add items to start a new order.
          </div>
        ) : (
          <ul className="divide-y">
            {cart.items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatPosMoney(item.unitPrice)} each
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    disabled={isPending}
                    onClick={() => onDecreaseQuantity(item.id, item.quantity)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    disabled={isPending}
                    onClick={() => onIncreaseQuantity(item.id, item.quantity)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    disabled={isPending}
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm font-semibold">{formatPosMoney(item.totalPrice)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatPosMoney(cart.subtotal)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={onClearOrder}>
            Clear
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || cart.items.length === 0}
            onClick={onHoldOrder}
          >
            Hold
          </Button>
        </div>

        <Button
          type="button"
          className="w-full"
          disabled={isPending || cart.items.length === 0}
          onClick={onSendToKitchen}
        >
          Send to Kitchen
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Held Orders</p>
        {heldOrders.length === 0 ? (
          <p className="text-muted-foreground text-xs">No held orders.</p>
        ) : (
          <ul className="space-y-2">
            {heldOrders.map((heldOrder) => (
              <li
                key={heldOrder.orderSessionId}
                className="flex items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{heldOrder.label}</p>
                  <p className="text-muted-foreground text-xs">
                    {heldOrder.itemCount} items · {formatPosMoney(heldOrder.subtotal)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={isPending}
                  onClick={() => onResumeOrder(heldOrder.orderSessionId)}
                >
                  Resume
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
