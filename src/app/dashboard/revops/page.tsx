import { RevopsDashboard } from "@/modules/revops/components/revops-dashboard";
import { getRevopsOverviewContext } from "@/modules/revops/lib/get-revops-context";

export default async function RevopsOverviewPage() {
  const { dashboard } = await getRevopsOverviewContext();

  return <RevopsDashboard dashboard={dashboard} />;
}
