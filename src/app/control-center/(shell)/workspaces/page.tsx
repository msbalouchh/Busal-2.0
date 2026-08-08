import { ControlCenterWorkspaceDirectory } from "@/modules/control-center/workspaces/components/control-center-workspace-directory";
import { getControlCenterWorkspacesContext } from "@/modules/control-center/workspaces/lib/get-control-center-workspaces-context";

export const dynamic = "force-dynamic";

interface ControlCenterWorkspacesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    healthStatus?: string;
    subscriptionPlan?: string;
    country?: string;
    industry?: string;
    sortBy?: string;
    sortDirection?: string;
    page?: string;
  }>;
}

export default async function ControlCenterWorkspacesPage({
  searchParams,
}: ControlCenterWorkspacesPageProps) {
  const params = await searchParams;
  const { directory, permissions } = await getControlCenterWorkspacesContext({
    search: params.search,
    status: params.status as never,
    healthStatus: params.healthStatus as never,
    subscriptionPlan: params.subscriptionPlan,
    country: params.country,
    industry: params.industry,
    sortBy: params.sortBy as never,
    sortDirection: params.sortDirection as never,
    page: params.page ? Number(params.page) : 1,
  });

  return (
    <ControlCenterWorkspaceDirectory initialDirectory={directory} permissions={permissions} />
  );
}
