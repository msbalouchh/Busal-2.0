"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  cancelControlCenterSubscriptionAction,
  downgradeControlCenterSubscriptionAction,
  pauseControlCenterSubscriptionAction,
  resumeControlCenterSubscriptionAction,
  upgradeControlCenterSubscriptionAction,
} from "@/modules/control-center/billing/actions/control-center-billing-actions";
import {
  BillingStatusBadge,
  billingPaymentBadgeVariant,
} from "@/modules/control-center/billing/components/billing-status-badge";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { CONTROL_CENTER_BILLING_ROUTES } from "@/modules/control-center/billing/constants/control-center-billing";
import type { ControlCenterSubscriptionDetailBundle } from "@/modules/control-center/billing/types/control-center-billing-types";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";
import { TenantActivityTimeline } from "@/modules/control-center/tenants/components/tenant-activity-timeline";

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

interface ControlCenterSubscriptionDetailProps {
  bundle: ControlCenterSubscriptionDetailBundle;
}

export function ControlCenterSubscriptionDetail({ bundle }: ControlCenterSubscriptionDetailProps) {
  const { subscription, permissions, invoices, payments, upgradeHistory, usage, plans } = bundle;
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<"cancel" | "pause" | "resume" | null>(null);

  const runConfirmedAction = () => {
    startTransition(async () => {
      try {
        if (confirmAction === "cancel") {
          await cancelControlCenterSubscriptionAction(subscription.businessId);
          toast.success("Subscription cancelled");
        } else if (confirmAction === "pause") {
          await pauseControlCenterSubscriptionAction(subscription.businessId);
          toast.success("Subscription paused");
        } else if (confirmAction === "resume") {
          await resumeControlCenterSubscriptionAction(subscription.businessId);
          toast.success("Subscription resumed");
        }
        setConfirmAction(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  return (
    <PageContainer>
      <Button asChild variant="outline" size="sm">
        <Link href={CONTROL_CENTER_BILLING_ROUTES.overview}>
          <ArrowLeft className="h-4 w-4" />
          Back to billing
        </Link>
      </Button>

      <SectionHeader
        title={subscription.businessName}
        description="Customer subscription, billing history, and usage summary."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Plan</CardTitle>
          </CardHeader>
          <CardContent>{subscription.subscriptionPlan ?? "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Billing Cycle</CardTitle>
          </CardHeader>
          <CardContent>{subscription.billingCycle}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Renewal Date</CardTitle>
          </CardHeader>
          <CardContent>{formatDate(subscription.renewalDate)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>{subscription.paymentStatus}</CardContent>
        </Card>
      </div>

      {permissions.canManageSubscriptions ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await upgradeControlCenterSubscriptionAction(subscription.businessId, "enterprise");
                toast.success("Upgraded to enterprise");
              })
            }
          >
            Upgrade
          </Button>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await downgradeControlCenterSubscriptionAction(subscription.businessId, "starter");
                toast.success("Downgraded to starter");
              })
            }
          >
            Downgrade
          </Button>
          <Button variant="outline" onClick={() => setConfirmAction("pause")}>
            Pause
          </Button>
          <Button variant="outline" onClick={() => setConfirmAction("resume")}>
            Resume
          </Button>
          <Button variant="destructive" onClick={() => setConfirmAction("cancel")}>
            Cancel
          </Button>
        </div>
      ) : null}

      {usage ? (
        <section className="space-y-4">
          <SectionHeader title="Usage Summary" />
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">Users: {usage.activeUsers}</CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                AI Tokens: {usage.aiTokensThisMonth.toLocaleString()}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                API Requests: {usage.apiCallsThisMonth.toLocaleString()}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionHeader title="Payment History" />
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Method</th>
                <th className="px-4 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t">
                  <td className="px-4 py-2">{formatCurrency(payment.amountPence)}</td>
                  <td className="px-4 py-2">
                    <BillingStatusBadge
                      label={payment.status}
                      variant={billingPaymentBadgeVariant(payment.status)}
                    />
                  </td>
                  <td className="px-4 py-2">{payment.method}</td>
                  <td className="px-4 py-2">{formatDate(payment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader title="Invoices" />
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left">Invoice</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Total</th>
                <th className="px-4 py-2 text-left">Due</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t">
                  <td className="px-4 py-2">{invoice.invoiceNumber}</td>
                  <td className="px-4 py-2">{invoice.status}</td>
                  <td className="px-4 py-2">{formatCurrency(invoice.totalPence)}</td>
                  <td className="px-4 py-2">{formatDate(invoice.dueAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader title="Upgrade History" />
        <TenantActivityTimeline
          items={upgradeHistory.map((entry) => ({
            id: entry.id,
            eventType: "SUBSCRIPTION",
            title: entry.title,
            description: null,
            createdAt: entry.createdAt,
          }))}
        />
      </section>

      <section className="space-y-4">
        <SectionHeader title="Available Plans" />
        <div className="grid gap-3 md:grid-cols-2">
          {plans
            .filter((plan) => !plan.archived)
            .map((plan) => (
              <Card key={plan.id}>
                <CardContent className="pt-6 text-sm">
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-muted-foreground">
                    {formatCurrency(plan.mrrPence)} / {plan.billingCycle}
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>
      </section>

      <TenantConfirmDialog
        open={confirmAction != null}
        onOpenChange={() => setConfirmAction(null)}
        title="Confirm subscription change"
        description="This action is audit logged and requires operator confirmation."
        confirmLabel="Confirm"
        destructive={confirmAction === "cancel"}
        loading={isPending}
        onConfirm={runConfirmedAction}
      />
    </PageContainer>
  );
}
