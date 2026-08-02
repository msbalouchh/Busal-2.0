"use client";

import Link from "next/link";
import { CreditCard, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BranchSelector } from "@/modules/branch-management/components/branch-selector";
import { PaymentStatusBadge } from "@/modules/payment-receipt-management/components/payment-status-badge";
import { RefundDialog } from "@/modules/payment-receipt-management/components/refund-dialog";
import { SplitPaymentDialog } from "@/modules/payment-receipt-management/components/split-payment-dialog";
import { TakePaymentDialog } from "@/modules/payment-receipt-management/components/take-payment-dialog";
import {
  PAYMENT_RECEIPT_ROUTES,
  PAYMENT_STATUS_FILTER_OPTIONS,
} from "@/modules/payment-receipt-management/constants/routes";
import { PAYMENT_METHOD_LABELS } from "@/modules/payment-receipt-management/lib/payment-validation";
import type { PaymentReceiptContext } from "@/modules/payment-receipt-management/lib/get-payment-receipt-context";
import type {
  OrderPaymentRecord,
  OrderPaymentSummary,
  PaymentDashboardStats,
  UnpaidOrderOption,
} from "@/modules/payment-receipt-management/types/payment-receipt-types";
import { loadOrderPaymentSummaryAction } from "@/modules/payment-receipt-management/actions/payment-receipt-actions";

interface PaymentDashboardPanelProps {
  context: PaymentReceiptContext;
  payments: OrderPaymentRecord[];
  stats: PaymentDashboardStats;
  unpaidOrders: UnpaidOrderOption[];
  initialSearch?: string;
  initialStatus?: string;
}

export function PaymentDashboardPanel({
  context,
  payments,
  stats,
  unpaidOrders,
  initialSearch = "",
  initialStatus = "ALL",
}: PaymentDashboardPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [takePaymentOpen, setTakePaymentOpen] = useState(false);
  const [splitPaymentOpen, setSplitPaymentOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [activeSummary, setActiveSummary] = useState<OrderPaymentSummary | null>(null);
  const [refundPayment, setRefundPayment] = useState<OrderPaymentRecord | null>(null);
  const branchId = context.selectedBranchId;

  const refresh = () => startTransition(() => router.refresh());

  const applyFilters = () => {
    if (!branchId) return;
    const params = new URLSearchParams({ branchId });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    startTransition(() => {
      router.push(`${PAYMENT_RECEIPT_ROUTES.dashboard()}?${params.toString()}`);
    });
  };

  const openTakePayment = async (orderId: string) => {
    if (!branchId) return;
    startTransition(async () => {
      try {
        const summary = await loadOrderPaymentSummaryAction(branchId, orderId);
        setActiveSummary(summary);
        setTakePaymentOpen(true);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load order");
      }
    });
  };

  const openSplitPayment = async (orderId: string) => {
    if (!branchId) return;
    startTransition(async () => {
      try {
        const summary = await loadOrderPaymentSummaryAction(branchId, orderId);
        setActiveSummary(summary);
        setSplitPaymentOpen(true);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load order");
      }
    });
  };

  const statCards = [
    { label: "Payments today", value: stats.paymentsToday },
    { label: "Revenue today", value: `£${stats.revenueToday.toFixed(2)}` },
    { label: "Refunds today", value: `£${stats.refundsToday.toFixed(2)}` },
    { label: "Unpaid orders", value: stats.unpaidOrders },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xs space-y-2">
          <p className="text-sm font-medium">Branch</p>
          <BranchSelector
            branches={context.branches}
            value={branchId ?? undefined}
            onValueChange={(nextBranchId) => {
              startTransition(() => {
                router.push(PAYMENT_RECEIPT_ROUTES.dashboardForBranch(nextBranchId));
              });
            }}
            placeholder="Select branch"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <CreditCard className="h-4 w-4" />
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {branchId && unpaidOrders.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Awaiting payment</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {unpaidOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-muted-foreground text-sm">
                      {order.orderType}
                      {order.tableLabel ? ` · ${order.tableLabel}` : ""} · £
                      {order.remainingBalance.toFixed(2)} due
                    </p>
                  </div>
                  {context.permissionsFlags.canCreate ? (
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={() => openTakePayment(order.id)}>
                        Pay
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openSplitPayment(order.id)}
                      >
                        Split
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Payment history</h2>
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search payment or order"
              className="pl-9"
            />
          </div>
          <select
            className="border-input bg-background flex h-10 rounded-md border px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {PAYMENT_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button type="button" onClick={applyFilters} disabled={isPending}>
            Apply filters
          </Button>
        </div>

        <div className="relative overflow-x-auto rounded-lg border">
          {isPending ? (
            <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : null}
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="bg-muted/40 border-b text-left">
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{payment.paymentNumber}</td>
                    <td className="px-4 py-3">{payment.orderNumber}</td>
                    <td className="px-4 py-3">{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</td>
                    <td className="px-4 py-3">£{payment.amountPaid.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <Link href={PAYMENT_RECEIPT_ROUTES.details(payment.id, branchId!)}>
                            View
                          </Link>
                        </Button>
                        {context.permissionsFlags.canRefund && payment.status === "PAID" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRefundPayment(payment);
                              setRefundOpen(true);
                            }}
                          >
                            Refund
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <TakePaymentDialog
        open={takePaymentOpen}
        onOpenChange={setTakePaymentOpen}
        branchId={branchId ?? ""}
        summary={activeSummary}
        onComplete={refresh}
      />
      <SplitPaymentDialog
        open={splitPaymentOpen}
        onOpenChange={setSplitPaymentOpen}
        branchId={branchId ?? ""}
        summary={activeSummary}
        onComplete={refresh}
      />
      <RefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        branchId={branchId ?? ""}
        payment={refundPayment}
        onComplete={refresh}
      />
    </div>
  );
}
