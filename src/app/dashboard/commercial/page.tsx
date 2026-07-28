import { CommercialDashboard } from "@/modules/commercial/components/commercial-dashboard";
import { getCommercialOverviewContext } from "@/modules/commercial/lib/get-commercial-context";

export default async function CommercialOverviewPage() {
  const { dashboard } = await getCommercialOverviewContext();

  return <CommercialDashboard dashboard={dashboard} />;
}
