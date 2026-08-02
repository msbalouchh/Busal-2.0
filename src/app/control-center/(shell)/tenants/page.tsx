import { ControlCenterTenantDirectory } from "@/modules/control-center/tenants/components/control-center-tenant-directory";
import { getControlCenterTenantsContext } from "@/modules/control-center/tenants/lib/get-control-center-tenants-context";

export const dynamic = "force-dynamic";

interface ControlCenterTenantsPageProps {
  searchParams: Promise<{
    search?: string;
    lifecycleStatus?: string;
    healthStatus?: string;
    subscriptionPlan?: string;
    country?: string;
    sortBy?: string;
    page?: string;
  }>;
}

export default async function ControlCenterTenantsPage({
  searchParams,
}: ControlCenterTenantsPageProps) {
  const params = await searchParams;
  const { directory } = await getControlCenterTenantsContext({
    search: params.search,
    lifecycleStatus: params.lifecycleStatus as never,
    healthStatus: params.healthStatus as never,
    subscriptionPlan: params.subscriptionPlan,
    country: params.country,
    sortBy: params.sortBy as never,
    page: params.page ? Number(params.page) : 1,
  });

  return <ControlCenterTenantDirectory initialDirectory={directory} />;
}
