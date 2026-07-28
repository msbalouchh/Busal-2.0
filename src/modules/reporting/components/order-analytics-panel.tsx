import type { OrderAnalyticsView } from "@/modules/reporting/utils/reporting-utils";
import { formatReportingMoney } from "@/modules/reporting/utils/reporting-utils";
import { ChartCard } from "@/modules/reporting/components/widgets/chart-card";
import { DataTableWidget } from "@/modules/reporting/components/widgets/data-table-widget";
import { KpiCard } from "@/modules/reporting/components/widgets/kpi-card";
import { TrendChart } from "@/modules/reporting/components/widgets/trend-chart";

interface OrderAnalyticsPanelProps {
  analytics: OrderAnalyticsView;
}

export function OrderAnalyticsPanel({ analytics }: OrderAnalyticsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Cancelled Orders" value={String(analytics.cancelledOrders)} />
        <KpiCard label="Refunds" value={formatReportingMoney(analytics.refundsPence)} />
        <KpiCard label="Refund Count" value={String(analytics.refundCount)} />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Orders by Hour"
          isEmpty={analytics.ordersByHour.every((entry) => entry.count === 0)}
        >
          <TrendChart
            data={analytics.ordersByHour.map((entry) => ({
              label: entry.label,
              value: entry.count,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Orders by Day"
          isEmpty={analytics.ordersByDay.every((entry) => entry.count === 0)}
        >
          <TrendChart
            variant="line"
            data={analytics.ordersByDay.map((entry) => ({
              label: entry.day,
              value: entry.count,
            }))}
          />
        </ChartCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <DataTableWidget
          title="Payment Methods"
          headers={["Method", "Count", "Total"]}
          rows={analytics.ordersByPaymentMethod.map((entry) => [
            entry.method,
            String(entry.count),
            formatReportingMoney(entry.totalPence),
          ])}
        />

        <DataTableWidget
          title="Fulfilment Types"
          headers={["Type", "Orders"]}
          rows={analytics.ordersByFulfilmentType.map((entry) => [entry.type, String(entry.count)])}
        />
      </section>
    </div>
  );
}
