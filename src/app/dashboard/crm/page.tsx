import { CrmDashboard } from "@/modules/crm/components/crm-dashboard";
import { getCrmOverviewContext } from "@/modules/crm/lib/get-crm-context";

export default async function CrmOverviewPage() {
  const data = await getCrmOverviewContext();

  return <CrmDashboard dashboard={data.dashboard} />;
}
