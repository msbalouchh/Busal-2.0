"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { PageContainer } from "@/components/common/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  archiveControlCenterPlanAction,
  cancelControlCenterSubscriptionAction,
  duplicateControlCenterPlanAction,
  pauseControlCenterSubscriptionAction,
  queryControlCenterSubscriptionsAction,
  resumeControlCenterSubscriptionAction,
  upgradeControlCenterSubscriptionAction,
} from "@/modules/control-center/billing/actions/control-center-billing-actions";
import {
  BillingStatusBadge,
  billingPaymentBadgeVariant,
} from "@/modules/control-center/billing/components/billing-status-badge";
import { ControlCenterEmptyState } from "@/modules/control-center/components/dashboard/empty-state";
import { PlatformStatCard } from "@/modules/control-center/components/dashboard/platform-stat-card";
import { RevenueCard } from "@/modules/control-center/components/dashboard/revenue-card";
import { SectionHeader } from "@/modules/control-center/components/dashboard/section-header";
import { CONTROL_CENTER_BILLING_ROUTES } from "@/modules/control-center/billing/constants/control-center-billing";
import type { ControlCenterBillingManagementBundle } from "@/modules/control-center/billing/types/control-center-billing-types";
import { TenantConfirmDialog } from "@/modules/control-center/tenants/components/tenant-confirm-dialog";

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

interface ControlCenterBillingHubProps {
  bundle: ControlCenterBillingManagementBundle;
  view?: "full" | "revenue";
}

export function ControlCenterBillingHub({ bundle, view = "full" }: ControlCenterBillingHubProps) {
  const isRevenueView = view === "revenue";
  const [isPending, startTransition] = useTransition();
  const [directory, setDirectory] = useState(bundle.directory);
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "cancel" | "pause" | "resume";
    businessId: string;
  } | null>(null);

  const {
    widgets,
    permissions,
    recentPayments,
    outstandingInvoices,
    failedPayments,
    plans,
    promotions,
    usageSummaries,
    analytics,
  } = bundle;

  const loadDirectory = (page = directory.page) => {
    startTransition(async () => {
      try {
        const result = await queryControlCenterSubscriptionsAction({
          search: search || undefined,
          page,
        });
        setDirectory(result);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load subscriptions");
      }
    });
  };

  const runConfirmedAction = () => {
    if (!confirmAction) return;
    startTransition(async () => {
      try {
        if (confirmAction.type === "cancel") {
          await cancelControlCenterSubscriptionAction(confirmAction.businessId);
          toast.success("Subscription cancelled");
        } else if (confirmAction.type === "pause") {
          await pauseControlCenterSubscriptionAction(confirmAction.businessId);
          toast.success("Subscription paused");
        } else {
          await resumeControlCenterSubscriptionAction(confirmAction.businessId);
          toast.success("Subscription resumed");
        }
        setConfirmAction(null);
        loadDirectory();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  return (
    <PageContainer className="gap-10">
      <SectionHeader
        title={isRevenueView ? "Revenue Analytics" : "Subscription & Billing"}
        description={
          isRevenueView
            ? "Platform revenue, billing performance, and financial analytics for super admins."
            : "Platform-wide subscription, billing, and revenue management for super admins."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!isRevenueView ? (
          <>
            <PlatformStatCard title="Total Subscribers" value={widgets.totalSubscribers} />
            <PlatformStatCard title="Active Plans" value={widgets.activePlans} />
            <PlatformStatCard title="Trial Accounts" value={widgets.trialAccounts} />
            <PlatformStatCard
              title="Expiring Subscriptions"
              value={widgets.expiringSubscriptions}
            />
            <PlatformStatCard title="Cancelled Plans" value={widgets.cancelledPlans} />
          </>
        ) : null}
        {permissions.canViewAnalytics ? (
          <>
            <RevenueCard title="MRR" amountPence={widgets.mrrPence} />
            <RevenueCard title="ARR" amountPence={widgets.arrPence} />
            <PlatformStatCard
              title="Revenue Growth"
              value={`${widgets.revenueGrowthPct.toFixed(1)}%`}
            />
            <PlatformStatCard title="Churn Rate" value={`${widgets.churnRatePct.toFixed(1)}%`} />
          </>
        ) : null}
      </div>

      <section className="space-y-4">
        <SectionHeader title="Recent Payments" />
        {recentPayments.length === 0 ? (
          <ControlCenterEmptyState
            title="No payments yet"
            description="Recent platform payments will appear here."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Business</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Method</th>
                  <th className="px-4 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment) => (
                  <tr key={payment.id} className="border-t">
                    <td className="px-4 py-2">{payment.businessName}</td>
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
        )}
      </section>

      {permissions.canManagePlans && !isRevenueView ? (
        <section className="space-y-4">
          <SectionHeader
            title="Subscription Plans"
            description="Create, edit, archive, and duplicate platform plans."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} data-component="subscription-plan-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    {plan.name}
                    {plan.archived ? <BillingStatusBadge label="Archived" /> : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">{plan.description}</p>
                  <p className="font-medium">
                    {formatCurrency(plan.mrrPence)} / {plan.billingCycle}
                  </p>
                  <p>
                    Users: {plan.limits.maxUsers} · Branches: {plan.limits.maxBranches}
                  </p>
                  <p>AI tokens: {plan.limits.maxAiTokensPerMonth.toLocaleString()}</p>
                  <div className="flex flex-wrap gap-2">
                    {!plan.archived ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await archiveControlCenterPlanAction(plan.slug);
                            toast.success("Plan archived");
                          })
                        }
                      >
                        Archive
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await duplicateControlCenterPlanAction(plan.slug, `${plan.slug}-copy`);
                          toast.success("Plan duplicated");
                        })
                      }
                    >
                      Duplicate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {!isRevenueView ? (
        <section className="space-y-4">
          <SectionHeader title="Customer Subscriptions" />
          <div className="flex flex-wrap gap-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search business or owner email"
              className="max-w-sm"
            />
            <Button onClick={() => loadDirectory(1)} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
          {directory.items.length === 0 ? (
            <ControlCenterEmptyState title="No subscriptions found" />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left">Business</th>
                    <th className="px-4 py-2 text-left">Plan</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">MRR</th>
                    <th className="px-4 py-2 text-left">Renewal</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {directory.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-2">
                        <div>
                          <p className="font-medium">{item.businessName}</p>
                          <p className="text-muted-foreground text-xs">{item.ownerEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2">{item.subscriptionPlan ?? "—"}</td>
                      <td className="px-4 py-2">{item.subscriptionStatus}</td>
                      <td className="px-4 py-2">{formatCurrency(item.mrrPence)}</td>
                      <td className="px-4 py-2">{formatDate(item.renewalDate)}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={CONTROL_CENTER_BILLING_ROUTES.detail(item.businessId)}>
                              Details
                            </Link>
                          </Button>
                          {permissions.canManageSubscriptions ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() =>
                                  startTransition(async () => {
                                    await upgradeControlCenterSubscriptionAction(
                                      item.businessId,
                                      "growth",
                                    );
                                    toast.success("Subscription upgraded");
                                    loadDirectory();
                                  })
                                }
                              >
                                Upgrade
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setConfirmAction({ type: "pause", businessId: item.businessId })
                                }
                              >
                                Pause
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  setConfirmAction({ type: "cancel", businessId: item.businessId })
                                }
                              >
                                Cancel
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {permissions.canManageInvoices ? (
        <section className="space-y-4">
          <SectionHeader title="Billing Management" />
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Outstanding Invoices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {outstandingInvoices.length === 0 ? (
                  <p className="text-muted-foreground">No outstanding invoices.</p>
                ) : (
                  outstandingInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex justify-between border-b pb-2 last:border-0"
                    >
                      <span>
                        {invoice.invoiceNumber} · {invoice.businessName}
                      </span>
                      <span>{formatCurrency(invoice.totalPence - invoice.amountPaidPence)}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Failed Payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {failedPayments.length === 0 ? (
                  <p className="text-muted-foreground">No failed payments.</p>
                ) : (
                  failedPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex justify-between border-b pb-2 last:border-0"
                    >
                      <span>{payment.businessName}</span>
                      <span>{formatCurrency(payment.amountPence)}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {!isRevenueView ? (
        <section className="space-y-4">
          <SectionHeader title="Usage Monitoring" />
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left">Business</th>
                  <th className="px-4 py-2 text-left">Users</th>
                  <th className="px-4 py-2 text-left">Branches</th>
                  <th className="px-4 py-2 text-left">AI Tokens</th>
                  <th className="px-4 py-2 text-left">API Requests</th>
                  <th className="px-4 py-2 text-left">Marketplace</th>
                </tr>
              </thead>
              <tbody>
                {usageSummaries.map((usage) => (
                  <tr key={usage.businessId} className="border-t">
                    <td className="px-4 py-2">{usage.businessName}</td>
                    <td className="px-4 py-2">{usage.activeUsers}</td>
                    <td className="px-4 py-2">{usage.branchCount}</td>
                    <td className="px-4 py-2">{usage.aiTokensThisMonth.toLocaleString()}</td>
                    <td className="px-4 py-2">{usage.apiCallsThisMonth.toLocaleString()}</td>
                    <td className="px-4 py-2">{usage.marketplaceLicenses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {permissions.canManagePromotions && !isRevenueView ? (
        <section className="space-y-4">
          <SectionHeader title="Promotions" />
          <div className="grid gap-4 md:grid-cols-2">
            {promotions.map((promo) => (
              <Card key={promo.id}>
                <CardHeader>
                  <CardTitle className="text-base">{promo.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-mono">{promo.code}</p>
                  <p className="text-muted-foreground">{promo.description}</p>
                  <p>
                    {promo.discountPercent}% discount · {promo.trialExtensionDays} trial days
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {permissions.canViewAnalytics ? (
        <section className="space-y-4">
          <SectionHeader title="Revenue Analytics" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Success Rate</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {analytics.paymentSuccessRatePct}%
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Customers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {analytics.topCustomers.map((customer) => (
                  <div key={customer.businessId} className="flex justify-between">
                    <span>{customer.businessName}</span>
                    <span>{formatCurrency(customer.mrrPence)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plan Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {analytics.planDistribution.map((entry) => (
                  <div key={entry.plan} className="flex justify-between">
                    <span>{entry.plan}</span>
                    <span>
                      {entry.count} tenants · {formatCurrency(entry.mrrPence)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      <TenantConfirmDialog
        open={confirmAction != null}
        onOpenChange={() => setConfirmAction(null)}
        title={
          confirmAction?.type === "cancel"
            ? "Cancel subscription"
            : confirmAction?.type === "pause"
              ? "Pause subscription"
              : "Resume subscription"
        }
        description="This action is audit logged and requires operator confirmation."
        confirmLabel="Confirm"
        destructive={confirmAction?.type === "cancel"}
        loading={isPending}
        onConfirm={runConfirmedAction}
      />
    </PageContainer>
  );
}
