import { SalesCrmDashboard } from "@/modules/sales-crm/components/sales-crm-dashboard";
import { getSalesOverviewContext } from "@/modules/sales-crm/lib/get-sales-crm-context";

export default async function SalesCrmOverviewPage() {
  const { dashboard } = await getSalesOverviewContext();

  return <SalesCrmDashboard dashboard={dashboard} />;
}
