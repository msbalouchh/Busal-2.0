import { REVENUE_INVOICE_STATUS_LABELS } from "@/modules/revops/constants/routes";
import { REVOPS_PAYMENT_PROVIDERS } from "@/modules/revops/constants/payment-providers";
import type { RevenueInvoiceView } from "@/modules/revops/utils/revops-utils";
import { formatRevopsMoney } from "@/modules/revops/utils/revops-utils";
import type { ProfitabilitySlice, RevenueForecastData } from "@/services/revops.service";

export function RevenueInvoicesList({ invoices }: { invoices: RevenueInvoiceView[] }) {
  if (invoices.length === 0) {
    return <p className="text-muted-foreground text-sm">No invoices yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {invoices.map((invoice) => (
        <li key={invoice.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{invoice.invoiceNumber}</span>
            <span className="text-muted-foreground">
              {REVENUE_INVOICE_STATUS_LABELS[
                invoice.status as keyof typeof REVENUE_INVOICE_STATUS_LABELS
              ] ?? invoice.status}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {invoice.customerName ?? "No customer"} · {invoice.sourceType} ·{" "}
            {formatRevopsMoney(invoice.totalPence)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function RevenuePaymentsList({
  payments,
}: {
  payments: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string | null;
    amountPence: number;
    paymentMethod: string;
    status: string;
  }>;
}) {
  if (payments.length === 0) {
    return <p className="text-muted-foreground text-sm">No payments recorded yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {payments.map((payment) => (
        <li key={payment.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{payment.invoiceNumber}</span>
            <span>{formatRevopsMoney(payment.amountPence)}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {payment.customerName ?? "Unknown"} · {payment.paymentMethod} · {payment.status}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function PaymentProvidersList() {
  return (
    <ul className="space-y-2 text-sm">
      {Object.values(REVOPS_PAYMENT_PROVIDERS).map((provider) => (
        <li key={provider.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{provider.label}</span>
            <span className="text-muted-foreground">
              {provider.integrationReady ? "Ready" : "Planned"}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">{provider.description}</p>
        </li>
      ))}
    </ul>
  );
}

export function RevenueRecognitionList({
  recognition,
}: {
  recognition: Array<{
    id: string;
    invoiceNumber: string;
    amountPence: number;
    status: string;
  }>;
}) {
  if (recognition.length === 0) {
    return <p className="text-muted-foreground text-sm">No recognition entries yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {recognition.map((entry) => (
        <li key={entry.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{entry.invoiceNumber}</span>
            <span>{formatRevopsMoney(entry.amountPence)}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">{entry.status}</p>
        </li>
      ))}
    </ul>
  );
}

export function RevenueExpensesList({
  expenses,
}: {
  expenses: Array<{ id: string; category: string; description: string; amountPence: number }>;
}) {
  if (expenses.length === 0) {
    return <p className="text-muted-foreground text-sm">No expenses recorded yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {expenses.map((expense) => (
        <li key={expense.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{expense.description}</span>
            <span>{formatRevopsMoney(expense.amountPence)}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">{expense.category}</p>
        </li>
      ))}
    </ul>
  );
}

function ProfitabilityList({ title, slices }: { title: string; slices: ProfitabilitySlice[] }) {
  if (slices.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium">{title}</h2>
      <ul className="space-y-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.key} className="rounded-md border p-3">
            <div className="flex justify-between gap-3">
              <span className="font-medium">{slice.label}</span>
              <span>{formatRevopsMoney(slice.profitPence)}</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Revenue {formatRevopsMoney(slice.revenuePence)} · Expenses{" "}
              {formatRevopsMoney(slice.expensePence)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProfitabilityReport({
  profitability,
}: {
  profitability: {
    byCustomer: ProfitabilitySlice[];
    byProject: ProfitabilitySlice[];
    byService: ProfitabilitySlice[];
    byIndustry: ProfitabilitySlice[];
  };
}) {
  return (
    <div className="space-y-6">
      <ProfitabilityList title="By Customer" slices={profitability.byCustomer} />
      <ProfitabilityList title="By Project" slices={profitability.byProject} />
      <ProfitabilityList title="By Service" slices={profitability.byService} />
      <ProfitabilityList title="By Industry" slices={profitability.byIndustry} />
    </div>
  );
}

export function RevenueForecastList({ forecast }: { forecast: RevenueForecastData[] }) {
  if (forecast.length === 0) {
    return <p className="text-muted-foreground text-sm">No forecast data yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {forecast.map((month) => (
        <li key={month.month} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{month.month}</span>
            <span>{formatRevopsMoney(month.totalProjectedPence)}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Contracts {formatRevopsMoney(month.activeContractsPence)} · Renewals{" "}
            {formatRevopsMoney(month.renewalsPence)} · Pipeline{" "}
            {formatRevopsMoney(month.pipelinePence)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function RevenueAnalyticsView({
  analytics,
}: {
  analytics: {
    invoicesByStatus: Array<{ status: string; count: number; totalPence: number }>;
    revenueBySource: Array<{ sourceType: string; totalPence: number }>;
  };
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Invoices by Status</h2>
        <ul className="space-y-2 text-sm">
          {analytics.invoicesByStatus.map((item) => (
            <li key={item.status} className="rounded-md border p-3">
              <div className="flex justify-between gap-3">
                <span>{item.status}</span>
                <span>{item.count}</span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {formatRevopsMoney(item.totalPence)}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Revenue by Source</h2>
        <ul className="space-y-2 text-sm">
          {analytics.revenueBySource.map((item) => (
            <li key={item.sourceType} className="rounded-md border p-3">
              <div className="flex justify-between gap-3">
                <span>{item.sourceType}</span>
                <span>{formatRevopsMoney(item.totalPence)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function CollectionsList({
  collections,
}: {
  collections: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string | null;
    status: string;
    outstandingPence: number;
  }>;
}) {
  if (collections.length === 0) {
    return <p className="text-muted-foreground text-sm">No collection cases yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {collections.map((collectionCase) => (
        <li key={collectionCase.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-3">
            <span className="font-medium">{collectionCase.invoiceNumber}</span>
            <span className="text-muted-foreground">{collectionCase.status}</span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            {collectionCase.customerName ?? "Unknown"} · Outstanding{" "}
            {formatRevopsMoney(collectionCase.outstandingPence)}
          </p>
        </li>
      ))}
    </ul>
  );
}
