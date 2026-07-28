import type { CustomerAnalyticsView } from "@/modules/reporting/utils/reporting-utils";
import { formatReportingMoney } from "@/modules/reporting/utils/reporting-utils";
import { DataTableWidget } from "@/modules/reporting/components/widgets/data-table-widget";
import { KpiCard } from "@/modules/reporting/components/widgets/kpi-card";

interface CustomerAnalyticsPanelProps {
  analytics: CustomerAnalyticsView;
}

export function CustomerAnalyticsPanel({ analytics }: CustomerAnalyticsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="New Customers" value={String(analytics.newCustomers)} />
        <KpiCard label="Returning Customers" value={String(analytics.returningCustomers)} />
        <KpiCard label="Retention Rate" value={`${analytics.retentionRatePercent}%`} />
      </div>

      <DataTableWidget
        title="Top Spending Customers"
        headers={["Customer", "Total Spent"]}
        rows={analytics.topSpendingCustomers.map((customer) => [
          customer.name,
          formatReportingMoney(customer.totalSpentPence),
        ])}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Outstanding Points"
          value={String(analytics.loyaltyUsage.totalPointsOutstanding)}
        />
        <KpiCard
          label="Reward Redemptions"
          value={String(analytics.loyaltyUsage.totalRedemptions)}
        />
        <KpiCard
          label="Point Transactions"
          value={String(analytics.loyaltyUsage.totalPointTransactions)}
        />
      </section>
    </div>
  );
}
