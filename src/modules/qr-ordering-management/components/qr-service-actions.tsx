"use client";

import { BellRing, Receipt } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  requestQrBillAction,
  requestQrWaiterAction,
} from "@/modules/qr-ordering-management/actions/qr-public-actions";

interface QrServiceActionsProps {
  sessionToken: string;
  waiterRequestedAt: string | null;
  billRequestedAt: string | null;
}

export function QrServiceActions({
  sessionToken,
  waiterRequestedAt,
  billRequestedAt,
}: QrServiceActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleWaiter = () => {
    startTransition(async () => {
      try {
        await requestQrWaiterAction(sessionToken);
        toast.success("Waiter notified");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to call waiter");
      }
    });
  };

  const handleBill = () => {
    startTransition(async () => {
      try {
        await requestQrBillAction(sessionToken);
        toast.success("Bill requested");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to request bill");
      }
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        type="button"
        variant="outline"
        className="h-12"
        onClick={handleWaiter}
        disabled={isPending || Boolean(waiterRequestedAt)}
      >
        <BellRing className="mr-2 h-4 w-4" />
        {waiterRequestedAt ? "Waiter called" : "Call waiter"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-12"
        onClick={handleBill}
        disabled={isPending || Boolean(billRequestedAt)}
      >
        <Receipt className="mr-2 h-4 w-4" />
        {billRequestedAt ? "Bill requested" : "Request bill"}
      </Button>
    </div>
  );
}
