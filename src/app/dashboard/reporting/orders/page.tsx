import { OrderAnalyticsPanel } from "@/modules/reporting/components/order-analytics-panel";
import { ExportReportButtons } from "@/modules/reporting/components/export-report-buttons";
import { getReportingOrdersContext } from "@/modules/reporting/lib/get-reporting-context";

export default async function ReportingOrdersPage() {
  const { analytics } = await getReportingOrdersContext();

  return (
    <div className="space-y-4">
      <ExportReportButtons reportType="orders" />
      <OrderAnalyticsPanel analytics={analytics} />
    </div>
  );
}
