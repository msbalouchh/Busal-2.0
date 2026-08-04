import type { PosPaymentType } from "@/modules/pos/constants/pos-status";
import type { PosCartItem, PosRecord } from "@/modules/pos/types/pos-platform";

export function getPosOrderSummary(record: PosRecord): string {
  const items = record.cartItems.map((item) => `${item.quantity}x ${item.name}`).join(", ");
  const table = record.order.tableLabel ? ` — ${record.order.tableLabel}` : "";
  return `#${record.order.orderNumber}${table}: ${items}`;
}

export function getPosOrderLabel(record: PosRecord): string {
  return `#${record.order.orderNumber}`;
}

export function formatCents(cents: number, currency = "GBP"): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
}

export function getCartItemCount(record: PosRecord): number {
  return record.cartItems.reduce((sum, item) => sum + item.quantity, 0);
}

export function isOrderPaid(record: PosRecord): boolean {
  return record.order.status === "paid";
}

export function isOrderOpen(record: PosRecord): boolean {
  return record.order.status === "open" || record.order.status === "held";
}

export function getTotalPaidCents(record: PosRecord): number {
  return record.payments.reduce((sum, payment) => sum + payment.amountCents, 0);
}

export function getRemainingBalanceCents(record: PosRecord): number {
  return Math.max(0, record.order.totalCents - getTotalPaidCents(record));
}

export function getPrimaryPaymentType(record: PosRecord): PosPaymentType | null {
  return record.payments[0]?.paymentType ?? null;
}

export function hasActiveSplit(record: PosRecord): boolean {
  return record.splitBill !== null && record.splitBill.portions.some((p) => !p.isPaid);
}

export function getUnpaidSplitPortions(record: PosRecord): number {
  if (!record.splitBill) {
    return 0;
  }

  return record.splitBill.portions.filter((p) => !p.isPaid).length;
}

export function getItemSubtotal(items: PosCartItem[]): number {
  return items.reduce((sum, item) => sum + item.totalPriceCents, 0);
}
