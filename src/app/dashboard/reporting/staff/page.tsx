import { StaffAnalyticsPanel } from "@/modules/reporting/components/staff-analytics-panel";
import { ExportReportButtons } from "@/modules/reporting/components/export-report-buttons";
import { getReportingStaffContext } from "@/modules/reporting/lib/get-reporting-context";

export default async function ReportingStaffPage() {
  const { analytics } = await getReportingStaffContext();

  return (
    <div className="space-y-4">
      <ExportReportButtons reportType="staff" />
      <StaffAnalyticsPanel analytics={analytics} />
    </div>
  );
}
