import { FinancialReportsPanel } from "@/modules/reporting/components/financial-reports-panel";
import { getReportingFinancialContext } from "@/modules/reporting/lib/get-reporting-context";

export default async function ReportingFinancialPage() {
  const { daily, weekly, monthly } = await getReportingFinancialContext();

  return <FinancialReportsPanel daily={daily} weekly={weekly} monthly={monthly} />;
}
