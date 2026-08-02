import Link from "next/link";

import { COMMERCIAL_PLATFORM_ROUTES } from "@/modules/commercial-platform/constants/commercial-platform";
import type { CommercialDashboardWidgets } from "@/modules/commercial-platform/types/commercial-platform-types";
import { RevenueInvoicesList } from "@/modules/revops/components/revops-lists";
import { REVENUE_INVOICE_STATUS_LABELS } from "@/modules/revops/constants/routes";
import type { RevopsDashboardView } from "@/modules/revops/utils/revops-utils";
import { formatRevopsMoney } from "@/modules/revops/utils/revops-utils";
import type { RevenueInvoiceData } from "@/services/revops.service";

interface CommercialRevenuePanelProps {
  invoices: RevenueInvoiceData[];
  dashboard: RevopsDashboardView;
  widgets: CommercialDashboardWidgets;
}

export function CommercialRevenuePanel({
  invoices,
  dashboard,
  widgets,
}: CommercialRevenuePanelProps) {
  const overdue = invoices.filter((invoice) => invoice.status === "OVERDUE");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total invoiced</p>
          <p className="text-2xl font-semibold">
            {formatRevopsMoney(dashboard.totalInvoicedPence)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Collected</p>
          <p className="text-2xl font-semibold">
            {formatRevopsMoney(dashboard.totalCollectedPence)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Outstanding</p>
          <p className="text-2xl font-semibold">{formatRevopsMoney(dashboard.outstandingPence)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Overdue invoices</p>
          <p className="text-2xl font-semibold">{dashboard.overdueInvoices}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">MRR</p>
          <p className="text-2xl font-semibold">{formatRevopsMoney(widgets.mrrPence)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">ARR</p>
          <p className="text-2xl font-semibold">{formatRevopsMoney(widgets.arrPence)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Recognized revenue</p>
          <p className="text-2xl font-semibold">
            {formatRevopsMoney(dashboard.recognizedRevenuePence)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Open collections</p>
          <p className="text-2xl font-semibold">{dashboard.openCollections}</p>
        </div>
      </div>

      {overdue.length > 0 ? (
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">Outstanding payments</h2>
          <ul className="space-y-2 text-sm">
            {overdue.slice(0, 5).map((invoice) => (
              <li key={invoice.id}>
                {invoice.invoiceNumber} ·{" "}
                {
                  REVENUE_INVOICE_STATUS_LABELS[
                    invoice.status as keyof typeof REVENUE_INVOICE_STATUS_LABELS
                  ]
                }{" "}
                · {formatRevopsMoney(invoice.totalPence - invoice.amountPaidPence)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <RevenueInvoicesList invoices={invoices.slice(0, 10)} />

      <Link
        href={COMMERCIAL_PLATFORM_ROUTES.revopsModule}
        className="text-primary text-sm hover:underline"
      >
        Open forecasting, profitability, and analytics
      </Link>
    </div>
  );
}
