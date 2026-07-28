import type { RevopsDashboardView } from "@/modules/revops/utils/revops-utils";
import { formatRevopsMoney } from "@/modules/revops/utils/revops-utils";
import { REVOPS_PAYMENT_PROVIDERS } from "@/modules/revops/constants/payment-providers";

interface RevopsDashboardProps {
  dashboard: RevopsDashboardView;
}

export function RevopsDashboard({ dashboard }: RevopsDashboardProps) {
  const providerCount = Object.keys(REVOPS_PAYMENT_PROVIDERS).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Total Invoiced</p>
          <p className="text-2xl font-semibold">
            {formatRevopsMoney(dashboard.totalInvoicedPence)}
          </p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Collected</p>
          <p className="text-2xl font-semibold">
            {formatRevopsMoney(dashboard.totalCollectedPence)}
          </p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Outstanding</p>
          <p className="text-2xl font-semibold">{formatRevopsMoney(dashboard.outstandingPence)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Net Profit</p>
          <p className="text-2xl font-semibold">{formatRevopsMoney(dashboard.netProfitPence)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Recognized Revenue</p>
          <p className="text-2xl font-semibold">
            {formatRevopsMoney(dashboard.recognizedRevenuePence)}
          </p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Expenses</p>
          <p className="text-2xl font-semibold">
            {formatRevopsMoney(dashboard.totalExpensesPence)}
          </p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Overdue Invoices</p>
          <p className="text-2xl font-semibold">{dashboard.overdueInvoices}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <p className="text-muted-foreground text-sm">Open Collections</p>
          <p className="text-2xl font-semibold">{dashboard.openCollections}</p>
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        Payment provider architecture prepared for {providerCount} providers (Stripe, GoCardless,
        Bank Transfer, PayPal, Manual).
      </p>
    </div>
  );
}
