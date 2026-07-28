import { CentralBranchDashboard } from "@/modules/branches/components/central-branch-dashboard";
import { getBranchesOverviewContext } from "@/modules/branches/lib/get-branch-context";

export default async function BranchesOverviewPage() {
  const { dashboard } = await getBranchesOverviewContext();

  return <CentralBranchDashboard dashboard={dashboard} />;
}
