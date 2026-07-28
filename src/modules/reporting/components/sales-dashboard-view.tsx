import type { SalesDashboardView } from "@/modules/reporting/utils/reporting-utils";
import { formatReportingMoney } from "@/modules/reporting/utils/reporting-utils";
import { KpiCard } from "@/modules/reporting/components/widgets/kpi-card";

interface SalesDashboardViewProps {
  sales: SalesDashboardView;
}

export function SalesDashboardView({ sales }: SalesDashboardViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Today's Sales" value={formatReportingMoney(sales.todaySalesPence)} />
        <KpiCard label="Weekly Sales" value={formatReportingMoney(sales.weeklySalesPence)} />
        <KpiCard label="Monthly Sales" value={formatReportingMoney(sales.monthlySalesPence)} />
        <KpiCard label="Yearly Sales" value={formatReportingMoney(sales.yearlySalesPence)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Gross Revenue (Today)"
          value={formatReportingMoney(sales.grossRevenuePence)}
        />
        <KpiCard label="Net Revenue (Today)" value={formatReportingMoney(sales.netRevenuePence)} />
        <KpiCard
          label="Average Order Value"
          value={formatReportingMoney(sales.averageOrderValuePence)}
        />
        <KpiCard label="Total Orders (Today)" value={String(sales.totalOrders)} />
      </div>
    </div>
  );
}
