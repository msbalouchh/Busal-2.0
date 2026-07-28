import type { FinancialReportView } from "@/modules/reporting/utils/reporting-utils";
import { formatReportingMoney } from "@/modules/reporting/utils/reporting-utils";
import { DataTableWidget } from "@/modules/reporting/components/widgets/data-table-widget";
import { KpiCard } from "@/modules/reporting/components/widgets/kpi-card";
import { ExportReportButtons } from "@/modules/reporting/components/export-report-buttons";

interface FinancialReportsPanelProps {
  daily: FinancialReportView;
  weekly: FinancialReportView;
  monthly: FinancialReportView;
}

export function FinancialReportsPanel({ daily, weekly, monthly }: FinancialReportsPanelProps) {
  const active = monthly;

  return (
    <div className="space-y-6">
      <ExportReportButtons reportType="financial" />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Daily Net Revenue"
          value={formatReportingMoney(daily.netRevenuePence)}
          hint={`${daily.totalOrders} orders`}
        />
        <KpiCard
          label="Weekly Net Revenue"
          value={formatReportingMoney(weekly.netRevenuePence)}
          hint={`${weekly.totalOrders} orders`}
        />
        <KpiCard
          label="Monthly Net Revenue"
          value={formatReportingMoney(monthly.netRevenuePence)}
          hint={`${monthly.totalOrders} orders`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Gross Revenue" value={formatReportingMoney(active.grossRevenuePence)} />
        <KpiCard label="Net Revenue" value={formatReportingMoney(active.netRevenuePence)} />
        <KpiCard label="Tax Summary" value={formatReportingMoney(active.taxPence)} />
        <KpiCard label="Discount Summary" value={formatReportingMoney(active.discountPence)} />
      </div>

      <DataTableWidget
        title="Payment Method Summary (Monthly)"
        headers={["Method", "Count", "Total"]}
        rows={active.paymentMethodSummary.map((entry) => [
          entry.method,
          String(entry.count),
          formatReportingMoney(entry.totalPence),
        ])}
      />
    </div>
  );
}
