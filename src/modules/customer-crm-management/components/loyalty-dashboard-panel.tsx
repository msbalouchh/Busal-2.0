"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adjustLoyaltyPointsAction,
  redeemLoyaltyPointsAction,
} from "@/modules/customer-crm-management/actions/customer-crm-actions";
import { MembershipCard } from "@/modules/customer-crm-management/components/membership-card";
import { CUSTOMER_CRM_ROUTES } from "@/modules/customer-crm-management/constants/routes";
import { LOYALTY_TRANSACTION_LABELS } from "@/modules/customer-crm-management/lib/customer-crm-validation";
import type { CustomerCrmPermissions } from "@/modules/customer-crm-management/lib/get-customer-crm-context";
import type {
  CustomerCrmRecord,
  LoyaltyTransactionRecord,
} from "@/modules/customer-crm-management/types/customer-crm-types";

interface LoyaltyDashboardPanelProps {
  customer: CustomerCrmRecord;
  loyaltyTransactions: LoyaltyTransactionRecord[];
  permissionsFlags: CustomerCrmPermissions;
}

export function LoyaltyDashboardPanel({
  customer,
  loyaltyTransactions,
  permissionsFlags,
}: LoyaltyDashboardPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [points, setPoints] = useState("");
  const [notes, setNotes] = useState("");

  const account = customer.loyaltyAccount;

  const runPointsAction = (mode: "redeem" | "adjust") => {
    const parsedPoints = Number(points);
    if (!Number.isInteger(parsedPoints) || parsedPoints === 0) {
      toast.error("Enter a valid points amount");
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "redeem") {
          await redeemLoyaltyPointsAction({
            customerId: customer.id,
            points: parsedPoints,
            notes: notes || null,
          });
          toast.success("Points redeemed");
        } else {
          await adjustLoyaltyPointsAction({
            customerId: customer.id,
            points: parsedPoints,
            notes: notes || null,
          });
          toast.success("Points adjusted");
        }
        setPoints("");
        setNotes("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update points");
      }
    });
  };

  if (!account) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">No loyalty account found for this customer.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href={CUSTOMER_CRM_ROUTES.profile(customer.id)}>Back to profile</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <MembershipCard
          customerName={customer.name}
          customerCode={customer.customerCode}
          account={account}
        />

        {permissionsFlags.canManageLoyalty ? (
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle>Manage points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="Enter points amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional note"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => runPointsAction("redeem")} disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Redeem points
                </Button>
                <Button
                  variant="outline"
                  onClick={() => runPointsAction("adjust")}
                  disabled={isPending}
                >
                  Adjust points
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Points history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loyaltyTransactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No loyalty transactions yet.</p>
          ) : (
            loyaltyTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between border-b py-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{LOYALTY_TRANSACTION_LABELS[transaction.type]}</p>
                  <p className="text-muted-foreground text-sm">
                    {transaction.notes ?? transaction.reference ?? "—"} ·{" "}
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={transaction.points >= 0 ? "text-green-600" : "text-red-600"}>
                  {transaction.points >= 0 ? "+" : ""}
                  {transaction.points}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
