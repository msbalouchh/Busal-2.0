"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SplitPaymentDialog } from "@/modules/payment-receipt-management/components/split-payment-dialog";
import { TakePaymentDialog } from "@/modules/payment-receipt-management/components/take-payment-dialog";
import { PAYMENT_RECEIPT_ROUTES } from "@/modules/payment-receipt-management/constants/routes";
import type { OrderPaymentSummary } from "@/modules/payment-receipt-management/types/payment-receipt-types";

interface TakePaymentPageClientProps {
  branchId: string;
  summary: OrderPaymentSummary;
}

export function TakePaymentPageClient({ branchId, summary }: TakePaymentPageClientProps) {
  const router = useRouter();
  const [takeOpen, setTakeOpen] = useState(true);
  const [splitOpen, setSplitOpen] = useState(false);

  const onComplete = () => {
    router.push(PAYMENT_RECEIPT_ROUTES.dashboardForBranch(branchId));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Button type="button" variant="ghost" size="sm" asChild>
        <Link href={PAYMENT_RECEIPT_ROUTES.dashboardForBranch(branchId)}>← Back to payments</Link>
      </Button>

      <div className="rounded-xl border p-4">
        <h1 className="text-xl font-semibold">{summary.orderNumber}</h1>
        <p className="text-muted-foreground text-sm">
          Remaining balance: £{summary.remainingBalance.toFixed(2)}
        </p>
        <div className="mt-4 flex gap-2">
          <Button type="button" onClick={() => setTakeOpen(true)}>
            Take payment
          </Button>
          <Button type="button" variant="outline" onClick={() => setSplitOpen(true)}>
            Split payment
          </Button>
        </div>
      </div>

      <TakePaymentDialog
        open={takeOpen}
        onOpenChange={setTakeOpen}
        branchId={branchId}
        summary={summary}
        onComplete={onComplete}
      />
      <SplitPaymentDialog
        open={splitOpen}
        onOpenChange={setSplitOpen}
        branchId={branchId}
        summary={summary}
        onComplete={onComplete}
      />
    </div>
  );
}
