import { BranchDashboardPanel } from "@/modules/branches/components/branch-dashboard-panel";
import { getBranchDetailContext } from "@/modules/branches/lib/get-branch-context";

interface BranchDetailPageProps {
  params: Promise<{ branchId: string }>;
}

export default async function BranchDetailPage({ params }: BranchDetailPageProps) {
  const { branchId } = await params;
  const { dashboard } = await getBranchDetailContext(branchId);

  return <BranchDashboardPanel dashboard={dashboard} />;
}
