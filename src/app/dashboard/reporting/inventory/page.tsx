import { InventoryAnalyticsPanel } from "@/modules/reporting/components/inventory-analytics-panel";
import { ExportReportButtons } from "@/modules/reporting/components/export-report-buttons";
import { getReportingInventoryContext } from "@/modules/reporting/lib/get-reporting-context";

export default async function ReportingInventoryPage() {
  const { analytics } = await getReportingInventoryContext();

  return (
    <div className="space-y-4">
      <ExportReportButtons reportType="inventory" />
      <InventoryAnalyticsPanel analytics={analytics} />
    </div>
  );
}
