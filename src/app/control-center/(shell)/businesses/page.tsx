import { ControlCenterBusinessDirectory } from "@/modules/control-center/businesses/components/control-center-business-directory";
import { getControlCenterBusinessesContext } from "@/modules/control-center/businesses/lib/get-control-center-businesses-context";

export const dynamic = "force-dynamic";

interface ControlCenterBusinessesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    healthStatus?: string;
    subscriptionPlan?: string;
    businessType?: string;
    country?: string;
    industry?: string;
    sortBy?: string;
    sortDirection?: string;
    page?: string;
  }>;
}

export default async function ControlCenterBusinessesPage({
  searchParams,
}: ControlCenterBusinessesPageProps) {
  const params = await searchParams;
  const { directory, permissions } = await getControlCenterBusinessesContext({
    search: params.search,
    status: params.status as never,
    healthStatus: params.healthStatus as never,
    subscriptionPlan: params.subscriptionPlan,
    businessType: params.businessType,
    country: params.country,
    industry: params.industry,
    sortBy: params.sortBy as never,
    sortDirection: params.sortDirection as never,
    page: params.page ? Number(params.page) : 1,
  });

  return (
    <ControlCenterBusinessDirectory initialDirectory={directory} permissions={permissions} />
  );
}
