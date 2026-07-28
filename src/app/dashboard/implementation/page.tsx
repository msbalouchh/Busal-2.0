import { ImplementationDashboard } from "@/modules/implementation/components/implementation-dashboard";
import { getImplementationOverviewContext } from "@/modules/implementation/lib/get-implementation-context";

export default async function ImplementationOverviewPage() {
  const { dashboard } = await getImplementationOverviewContext();

  return <ImplementationDashboard dashboard={dashboard} />;
}
