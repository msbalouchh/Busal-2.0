"use client";

import Link from "next/link";
import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  applyOrderAdjustmentsAction,
  cancelOrderManagementAction,
  completeOrderManagementAction,
  confirmOrderManagementAction,
  deleteOrderManagementAction,
  markReadyOrderManagementAction,
  markServedOrderManagementAction,
  mergeOrdersManagementAction,
  splitOrderManagementAction,
  startPreparingOrderManagementAction,
  transferOrderTableAction,
} from "@/modules/order-management/actions/order-management-actions";
import { OrderItemsList } from "@/modules/order-management/components/order-items-list";
import { OrderStatusBadge } from "@/modules/order-management/components/order-status-badge";
import { OrderSummaryCard } from "@/modules/order-management/components/order-summary-card";
import { OrderTimelineView } from "@/modules/order-management/components/order-timeline-view";
import { ORDER_MANAGEMENT_ROUTES } from "@/modules/order-management/constants/routes";
import { PAYMENT_RECEIPT_ROUTES } from "@/modules/payment-receipt-management/constants/routes";
import type { OrderManagementPermissions } from "@/modules/order-management/lib/get-order-management-context";
import type { OrderManagementRecord } from "@/modules/order-management/types/order-management-types";

interface OrderDetailsPanelProps {
  branchId: string;
  order: OrderManagementRecord;
  permissionsFlags: OrderManagementPermissions;
  tables: { id: string; label: string }[];
  mergeCandidates: OrderManagementRecord[];
}

export function OrderDetailsPanel({
  branchId,
  order,
  permissionsFlags,
  tables,
  mergeCandidates,
}: OrderDetailsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTableId, setSelectedTableId] = useState(order.restaurantTableId ?? "");
  const [selectedSplitItems, setSelectedSplitItems] = useState<string[]>([]);
  const [selectedMergeIds, setSelectedMergeIds] = useState<string[]>([]);
  const [discountAmount, setDiscountAmount] = useState(String(order.discountAmount));
  const [serviceCharge, setServiceCharge] = useState(String(order.serviceCharge));
  const [deliveryCharge, setDeliveryCharge] = useState(String(order.deliveryCharge));
  const [tipAmount, setTipAmount] = useState(String(order.tipAmount));

  const runAction = (action: () => Promise<{ success: boolean }>, successMessage: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  const toggleSplitItem = (itemId: string) => {
    setSelectedSplitItems((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  };

  const toggleMergeOrder = (orderId: string) => {
    setSelectedMergeIds((current) =>
      current.includes(orderId) ? current.filter((id) => id !== orderId) : [...current, orderId],
    );
  };

  const isEditable = !["COMPLETED", "CANCELLED"].includes(order.status);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle>{order.orderNumber}</CardTitle>
              <p className="text-muted-foreground text-sm capitalize">
                {order.orderType.toLowerCase().replace("_", " ")}
                {order.tableLabel ? ` · ${order.tableLabel}` : ""}
              </p>
              <OrderStatusBadge status={order.status} />
            </div>
            {permissionsFlags.canUpdate && isEditable ? (
              <Button asChild variant="outline" size="sm">
                <Link href={ORDER_MANAGEMENT_ROUTES.edit(order.id, branchId)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Customer" value={order.customerName ?? "Walk-in guest"} />
            <DetailItem label="Staff" value={order.staffName ?? "Unassigned"} />
            <DetailItem label="Reservation" value={order.reservationNumber ?? "—"} />
            <DetailItem label="Placed" value={new Date(order.placedAt).toLocaleString()} />
            <DetailItem label="Notes" value={order.notes ?? "—"} />
            <DetailItem
              label="Payment"
              value={`${order.paymentStatus.replace("_", " ")}${order.paymentMethod ? ` · ${order.paymentMethod}` : ""}`}
            />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Items</h2>
          <OrderItemsList items={order.items} />
        </div>
      </div>

      <div className="space-y-4">
        <OrderSummaryCard order={order} />

        {order.paymentStatus !== "PAID" && order.status !== "CANCELLED" ? (
          <Button asChild className="w-full">
            <Link href={PAYMENT_RECEIPT_ROUTES.takePayment(order.id, branchId)}>Take payment</Link>
          </Button>
        ) : null}

        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimelineView
              status={order.status}
              placedAt={order.placedAt}
              completedAt={order.completedAt}
              cancelledAt={order.cancelledAt}
            />
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {permissionsFlags.canUpdate && order.status === "PENDING" ? (
              <Button
                className="w-full"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => confirmOrderManagementAction(branchId, order.id),
                    "Order confirmed",
                  )
                }
              >
                Confirm
              </Button>
            ) : null}
            {permissionsFlags.canUpdate && ["PENDING", "CONFIRMED"].includes(order.status) ? (
              <Button
                className="w-full"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => startPreparingOrderManagementAction(branchId, order.id),
                    "Kitchen started preparing",
                  )
                }
              >
                Start preparing
              </Button>
            ) : null}
            {permissionsFlags.canUpdate && order.status === "PREPARING" ? (
              <Button
                className="w-full"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => markReadyOrderManagementAction(branchId, order.id),
                    "Order marked ready",
                  )
                }
              >
                Mark ready
              </Button>
            ) : null}
            {permissionsFlags.canUpdate && order.status === "READY" ? (
              <Button
                className="w-full"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => markServedOrderManagementAction(branchId, order.id),
                    "Order served",
                  )
                }
              >
                Mark served
              </Button>
            ) : null}
            {permissionsFlags.canUpdate && order.status === "SERVED" ? (
              <Button
                className="w-full"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => completeOrderManagementAction(branchId, order.id),
                    "Order completed",
                  )
                }
              >
                Complete
              </Button>
            ) : null}
            {permissionsFlags.canCancel && isEditable ? (
              <Button
                className="w-full"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => cancelOrderManagementAction(branchId, order.id),
                    "Order cancelled",
                  )
                }
              >
                Cancel
              </Button>
            ) : null}
            {permissionsFlags.canDelete ? (
              <Button
                className="w-full"
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  runAction(async () => {
                    await deleteOrderManagementAction(branchId, order.id);
                    router.push(ORDER_MANAGEMENT_ROUTES.listForBranch(branchId));
                    return { success: true };
                  }, "Order deleted")
                }
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
              </Button>
            ) : null}
          </CardContent>
        </Card>

        {permissionsFlags.canDiscount && isEditable ? (
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Adjustments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AdjustmentInput
                label="Discount"
                value={discountAmount}
                onChange={setDiscountAmount}
              />
              <AdjustmentInput
                label="Service charge"
                value={serviceCharge}
                onChange={setServiceCharge}
              />
              <AdjustmentInput
                label="Delivery charge"
                value={deliveryCharge}
                onChange={setDeliveryCharge}
              />
              <AdjustmentInput label="Tip" value={tipAmount} onChange={setTipAmount} />
              <Button
                className="w-full"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () =>
                      applyOrderAdjustmentsAction({
                        branchId,
                        orderId: order.id,
                        discountAmount: Number(discountAmount) || 0,
                        serviceCharge: Number(serviceCharge) || 0,
                        deliveryCharge: Number(deliveryCharge) || 0,
                        tipAmount: Number(tipAmount) || 0,
                      }),
                    "Adjustments applied",
                  )
                }
              >
                Apply adjustments
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {permissionsFlags.canTransfer && order.orderType === "DINE_IN" && isEditable ? (
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Transfer table</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={selectedTableId}
                onChange={(event) => setSelectedTableId(event.target.value)}
                disabled={isPending}
              >
                <option value="">Select table</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.label}
                  </option>
                ))}
              </select>
              <Button
                className="w-full"
                disabled={isPending || !selectedTableId}
                onClick={() =>
                  runAction(
                    () =>
                      transferOrderTableAction({
                        branchId,
                        orderId: order.id,
                        restaurantTableId: selectedTableId,
                      }),
                    "Table transferred",
                  )
                }
              >
                Transfer
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {permissionsFlags.canUpdate && isEditable && order.items.length > 1 ? (
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Split order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedSplitItems.includes(item.id)}
                    onChange={() => toggleSplitItem(item.id)}
                    disabled={isPending}
                  />
                  <span>
                    {item.productNameSnapshot} × {item.quantity}
                  </span>
                </label>
              ))}
              <Button
                className="w-full"
                variant="outline"
                disabled={isPending || selectedSplitItems.length === 0}
                onClick={() =>
                  runAction(
                    () =>
                      splitOrderManagementAction({
                        branchId,
                        orderId: order.id,
                        itemIds: selectedSplitItems,
                      }),
                    "Order split",
                  )
                }
              >
                Split selected items
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {permissionsFlags.canUpdate && isEditable && mergeCandidates.length > 0 ? (
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Merge orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mergeCandidates.map((candidate) => (
                <label key={candidate.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedMergeIds.includes(candidate.id)}
                    onChange={() => toggleMergeOrder(candidate.id)}
                    disabled={isPending}
                  />
                  <span>
                    {candidate.orderNumber} · {candidate.items.length} items
                  </span>
                </label>
              ))}
              <Button
                className="w-full"
                variant="outline"
                disabled={isPending || selectedMergeIds.length === 0}
                onClick={() =>
                  runAction(
                    () =>
                      mergeOrdersManagementAction({
                        branchId,
                        targetOrderId: order.id,
                        sourceOrderIds: selectedMergeIds,
                      }),
                    "Orders merged",
                  )
                }
              >
                Merge into this order
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function AdjustmentInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <Input
        type="number"
        min={0}
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
