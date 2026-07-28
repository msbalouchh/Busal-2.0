import type { StaffAnalyticsView } from "@/modules/reporting/utils/reporting-utils";
import { formatReportingMoney } from "@/modules/reporting/utils/reporting-utils";
import { DataTableWidget } from "@/modules/reporting/components/widgets/data-table-widget";

interface StaffAnalyticsPanelProps {
  analytics: StaffAnalyticsView;
}

export function StaffAnalyticsPanel({ analytics }: StaffAnalyticsPanelProps) {
  return (
    <DataTableWidget
      title="Staff Performance"
      headers={["Staff", "Orders", "Sales Processed", "Avg Processing (min)"]}
      rows={analytics.staff.map((entry) => [
        entry.staffName,
        String(entry.ordersHandled),
        formatReportingMoney(entry.salesProcessedPence),
        entry.averageProcessingMinutes === null ? "—" : String(entry.averageProcessingMinutes),
      ])}
    />
  );
}
