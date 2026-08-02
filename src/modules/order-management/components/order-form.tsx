"use client";

import type { OrderType, PaymentMethod } from "@prisma/client";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateLineAmounts,
  calculateOrderTotals,
} from "@/modules/order-management/lib/order-validation";
import { ORDER_TYPE_OPTIONS } from "@/modules/order-management/constants/routes";
import type {
  OrderItemInput,
  OrderManagementInput,
  OrderManagementRecord,
  ProductSelectOption,
} from "@/modules/order-management/types/order-management-types";

interface OrderFormProps {
  branchId: string;
  products: ProductSelectOption[];
  tables: { id: string; label: string }[];
  staff: { id: string; label: string }[];
  customers: { id: string; label: string }[];
  initialOrder?: OrderManagementRecord;
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (input: OrderManagementInput) => Promise<void>;
}

interface DraftItem {
  key: string;
  productId: string;
  quantity: number;
  modifierOptionIds: string[];
  specialInstructions: string;
  discountAmount: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" }).format(value);
}

function createDraftItem(productId = "", quantity = 1): DraftItem {
  return {
    key: `${Date.now()}-${Math.random()}`,
    productId,
    quantity,
    modifierOptionIds: [],
    specialInstructions: "",
    discountAmount: 0,
  };
}

export function OrderForm({
  branchId,
  products,
  tables,
  staff,
  customers,
  initialOrder,
  submitLabel,
  disabled = false,
  onSubmit,
}: OrderFormProps) {
  const [isPending, startTransition] = useTransition();
  const [orderType, setOrderType] = useState<OrderType>(initialOrder?.orderType ?? "DINE_IN");
  const [customerId, setCustomerId] = useState(initialOrder?.customerId ?? "");
  const [restaurantTableId, setRestaurantTableId] = useState(initialOrder?.restaurantTableId ?? "");
  const [staffId, setStaffId] = useState(initialOrder?.staffId ?? "");
  const [notes, setNotes] = useState(initialOrder?.notes ?? "");
  const [discountAmount, setDiscountAmount] = useState(String(initialOrder?.discountAmount ?? 0));
  const [serviceCharge, setServiceCharge] = useState(String(initialOrder?.serviceCharge ?? 0));
  const [deliveryCharge, setDeliveryCharge] = useState(String(initialOrder?.deliveryCharge ?? 0));
  const [tipAmount, setTipAmount] = useState(String(initialOrder?.tipAmount ?? 0));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">(
    initialOrder?.paymentMethod ?? "",
  );
  const [items, setItems] = useState<DraftItem[]>(() =>
    initialOrder?.items.length
      ? initialOrder.items.map((item) => ({
          key: item.id,
          productId: item.productId,
          quantity: item.quantity,
          modifierOptionIds: item.modifiers.map((modifier) => modifier.modifierOptionId),
          specialInstructions: item.specialInstructions ?? "",
          discountAmount: item.discountAmount,
        }))
      : [createDraftItem()],
  );

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const previewTotals = useMemo(() => {
    const lineItems = items
      .filter((item) => item.productId)
      .map((item) => {
        const product = productMap.get(item.productId);
        if (!product) return null;

        const modifierTotal = item.modifierOptionIds.reduce((sum, optionId) => {
          for (const group of product.modifierGroups) {
            const option = group.options.find((entry) => entry.id === optionId);
            if (option) return sum + option.priceAdjustment;
          }
          return sum;
        }, 0);

        const amounts = calculateLineAmounts(
          product.price,
          item.quantity,
          modifierTotal,
          product.taxRate,
          item.discountAmount,
        );

        return amounts;
      })
      .filter((item): item is NonNullable<typeof item> => item != null);

    return calculateOrderTotals({
      items: lineItems,
      discountAmount: Number(discountAmount) || 0,
      serviceCharge: Number(serviceCharge) || 0,
      deliveryCharge: Number(deliveryCharge) || 0,
      tipAmount: Number(tipAmount) || 0,
    });
  }, [items, productMap, discountAmount, serviceCharge, deliveryCharge, tipAmount]);

  const updateItem = (key: string, patch: Partial<DraftItem>) => {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const handleSubmit = () => {
    const payloadItems: OrderItemInput[] = items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        modifierOptionIds: item.modifierOptionIds,
        specialInstructions: item.specialInstructions || null,
        discountAmount: item.discountAmount,
      }));

    const input: OrderManagementInput = {
      branchId,
      orderType,
      customerId: customerId || null,
      restaurantTableId: orderType === "DINE_IN" ? restaurantTableId || null : null,
      staffId: staffId || null,
      notes: notes || null,
      items: payloadItems,
      discountAmount: Number(discountAmount) || 0,
      serviceCharge: Number(serviceCharge) || 0,
      deliveryCharge: Number(deliveryCharge) || 0,
      tipAmount: Number(tipAmount) || 0,
      paymentMethod: paymentMethod || null,
    };

    startTransition(async () => {
      try {
        await onSubmit(input);
        toast.success(initialOrder ? "Order updated" : "Order created");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save order");
      }
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Order details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orderType">Order type</Label>
              <select
                id="orderType"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={orderType}
                disabled={disabled || isPending}
                onChange={(event) => setOrderType(event.target.value as OrderType)}
              >
                {ORDER_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <select
                id="customerId"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={customerId}
                disabled={disabled || isPending}
                onChange={(event) => setCustomerId(event.target.value)}
              >
                <option value="">Walk-in guest</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.label}
                  </option>
                ))}
              </select>
            </div>
            {orderType === "DINE_IN" ? (
              <div className="space-y-2">
                <Label htmlFor="restaurantTableId">Table</Label>
                <select
                  id="restaurantTableId"
                  className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  value={restaurantTableId}
                  disabled={disabled || isPending}
                  onChange={(event) => setRestaurantTableId(event.target.value)}
                >
                  <option value="">Select table</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="staffId">Staff</Label>
              <select
                id="staffId"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={staffId}
                disabled={disabled || isPending}
                onChange={(event) => setStaffId(event.target.value)}
              >
                <option value="">Unassigned</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={notes}
                disabled={disabled || isPending}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNotes(event.target.value)
                }
                placeholder="Special instructions for the kitchen or service team"
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isPending}
              onClick={() => setItems((current) => [...current, createDraftItem()])}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => {
              const product = productMap.get(item.productId);

              return (
                <div key={item.key} className="space-y-3 rounded-lg border p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Product</Label>
                      <select
                        className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                        value={item.productId}
                        disabled={disabled || isPending}
                        onChange={(event) =>
                          updateItem(item.key, {
                            productId: event.target.value,
                            modifierOptionIds: [],
                          })
                        }
                      >
                        <option value="">Select product</option>
                        {products.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.label} · {formatCurrency(entry.price)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        disabled={disabled || isPending}
                        onChange={(event) =>
                          updateItem(item.key, {
                            quantity: Math.max(1, Number(event.target.value)),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Item discount</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.discountAmount}
                        disabled={disabled || isPending}
                        onChange={(event) =>
                          updateItem(item.key, { discountAmount: Number(event.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>

                  {product?.modifierGroups.length ? (
                    <div className="space-y-3">
                      {product.modifierGroups.map((group) => (
                        <div key={group.id} className="space-y-2">
                          <p className="text-sm font-medium">
                            {group.name}
                            {group.isRequired ? " *" : ""}
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {group.options.map((option) => {
                              const checked = item.modifierOptionIds.includes(option.id);

                              return (
                                <label
                                  key={option.id}
                                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled || isPending}
                                    onChange={(event) => {
                                      const next = event.target.checked
                                        ? [...item.modifierOptionIds, option.id]
                                        : item.modifierOptionIds.filter((id) => id !== option.id);
                                      updateItem(item.key, { modifierOptionIds: next });
                                    }}
                                  />
                                  <span>
                                    {option.name} ({formatCurrency(option.priceAdjustment)})
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label>Special instructions</Label>
                    <Input
                      value={item.specialInstructions}
                      disabled={disabled || isPending}
                      onChange={(event) =>
                        updateItem(item.key, { specialInstructions: event.target.value })
                      }
                      placeholder="No onions, extra sauce, etc."
                    />
                  </div>

                  {items.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={disabled || isPending}
                      onClick={() =>
                        setItems((current) => current.filter((entry) => entry.key !== item.key))
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove item
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Adjustments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AdjustmentField
              label="Order discount"
              value={discountAmount}
              disabled={disabled || isPending}
              onChange={setDiscountAmount}
            />
            <AdjustmentField
              label="Service charge"
              value={serviceCharge}
              disabled={disabled || isPending}
              onChange={setServiceCharge}
            />
            <AdjustmentField
              label="Delivery charge"
              value={deliveryCharge}
              disabled={disabled || isPending}
              onChange={setDeliveryCharge}
            />
            <AdjustmentField
              label="Tip"
              value={tipAmount}
              disabled={disabled || isPending}
              onChange={setTipAmount}
            />
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment method</Label>
              <select
                id="paymentMethod"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={paymentMethod}
                disabled={disabled || isPending}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod | "")}
              >
                <option value="">Not set</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Preview total</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <SummaryRow label="Subtotal" value={formatCurrency(previewTotals.subtotal)} />
            <SummaryRow label="Tax" value={formatCurrency(previewTotals.taxAmount)} />
            <SummaryRow label="Total" value={formatCurrency(previewTotals.totalAmount)} strong />
          </CardContent>
        </Card>

        <Button className="w-full" disabled={disabled || isPending} onClick={handleSubmit}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function AdjustmentField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        step="0.01"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
