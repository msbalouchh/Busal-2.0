import { CustomerSuccessDashboard } from "@/modules/customer-success/components/customer-success-dashboard";
import { getCustomerSuccessOverviewContext } from "@/modules/customer-success/lib/get-customer-success-context";

export default async function CustomerSuccessOverviewPage() {
  const { dashboard } = await getCustomerSuccessOverviewContext();

  return <CustomerSuccessDashboard dashboard={dashboard} />;
}
