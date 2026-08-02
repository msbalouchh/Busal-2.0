"use client";

import Link from "next/link";
import { Loader2, Mail, MessageSquare, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  emailOrderReceiptAction,
  smsOrderReceiptAction,
  voidOrderPaymentAction,
} from "@/modules/payment-receipt-management/actions/payment-receipt-actions";
import { RefundDialog } from "@/modules/payment-receipt-management/components/refund-dialog";
import { PaymentStatusBadge } from "@/modules/payment-receipt-management/components/payment-status-badge";
import { ReceiptPrintLayout } from "@/modules/payment-receipt-management/components/receipt-print-layout";
import {
  ORDER_RECEIPT_PRINT_API,
  PAYMENT_RECEIPT_ROUTES,
} from "@/modules/payment-receipt-management/constants/routes";
import {
  PAYMENT_METHOD_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "@/modules/payment-receipt-management/lib/payment-validation";
import type { PaymentReceiptPermissions } from "@/modules/payment-receipt-management/lib/get-payment-receipt-context";
import type { OrderPaymentRecord } from "@/modules/payment-receipt-management/types/payment-receipt-types";

interface PaymentDetailsPanelProps {
  branchId: string;
  payment: OrderPaymentRecord;
  permissions: PaymentReceiptPermissions;
}

export function PaymentDetailsPanel({ branchId, payment, permissions }: PaymentDetailsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [refundOpen, setRefundOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const refresh = () => startTransition(() => router.refresh());

  const handleVoid = () => {
    startTransition(async () => {
      try {
        await voidOrderPaymentAction({ branchId, paymentId: payment.id });
        toast.success("Payment voided");
        refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Void failed");
      }
    });
  };

  const handleEmail = () => {
    if (!payment.receipt) return;
    startTransition(async () => {
      try {
        await emailOrderReceiptAction({ branchId, receiptId: payment.receipt!.id, email });
        toast.success("Receipt emailed");
        refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Email failed");
      }
    });
  };

  const handleSms = () => {
    if (!payment.receipt) return;
    startTransition(async () => {
      try {
        await smsOrderReceiptAction({ branchId, receiptId: payment.receipt!.id, phone });
        toast.success("Receipt SMS queued");
        refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "SMS failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Payment details</p>
          <h1 className="text-2xl font-semibold">{payment.paymentNumber}</h1>
          <p className="text-muted-foreground text-sm">
            Order {payment.orderNumber} · {payment.orderType}
          </p>
        </div>
        <PaymentStatusBadge status={payment.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Amount paid</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">£{payment.amountPaid.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Method</CardTitle>
          </CardHeader>
          <CardContent>{PAYMENT_METHOD_LABELS[payment.paymentMethod]}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Order total</CardTitle>
          </CardHeader>
          <CardContent>£{payment.orderTotal.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tip</CardTitle>
          </CardHeader>
          <CardContent>£{payment.tipAmount.toFixed(2)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {payment.transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {TRANSACTION_TYPE_LABELS[transaction.transactionType]}
                </p>
                <p className="text-muted-foreground">{transaction.reference ?? "—"}</p>
              </div>
              <div className="text-right">
                <p>£{transaction.amount.toFixed(2)}</p>
                <PaymentStatusBadge status={transaction.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {payment.receipt ? <ReceiptPrintLayout payment={payment} receipt={payment.receipt} /> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href={PAYMENT_RECEIPT_ROUTES.dashboardForBranch(branchId)}>Back</Link>
        </Button>
        {permissions.canRefund && payment.status === "PAID" ? (
          <Button type="button" variant="outline" onClick={() => setRefundOpen(true)}>
            Refund
          </Button>
        ) : null}
        {permissions.canVoid && payment.status === "PAID" ? (
          <Button type="button" variant="outline" onClick={handleVoid} disabled={isPending}>
            Void
          </Button>
        ) : null}
        {permissions.canPrintReceipt && payment.receipt ? (
          <Button type="button" variant="outline" asChild>
            <a href={ORDER_RECEIPT_PRINT_API(payment.receipt.id)} target="_blank" rel="noreferrer">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </a>
          </Button>
        ) : null}
      </div>

      {payment.receipt && permissions.canEmailReceipt ? (
        <Card>
          <CardHeader>
            <CardTitle>Deliver receipt</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-2">
              <Input
                placeholder="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Button type="button" onClick={handleEmail} disabled={isPending}>
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Phone number"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              <Button type="button" variant="outline" onClick={handleSms} disabled={isPending}>
                <MessageSquare className="mr-2 h-4 w-4" />
                SMS
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isPending ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Updating…
        </div>
      ) : null}

      <RefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        branchId={branchId}
        payment={payment}
        onComplete={refresh}
      />
    </div>
  );
}
