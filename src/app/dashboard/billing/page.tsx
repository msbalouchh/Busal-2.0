import { Suspense } from "react";
import type { Metadata } from "next";

import { DashboardBillingPanel } from "@/modules/billing/components/dashboard-billing-panel";

export const metadata: Metadata = {
  title: "Billing",
};

export default function DashboardBillingPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground text-sm">
          Manage your subscription, trial, and payment method.
        </p>
      </div>
      <Suspense fallback={<p className="text-muted-foreground text-sm">Loading billing…</p>}>
        <DashboardBillingPanel />
      </Suspense>
    </div>
  );
}
