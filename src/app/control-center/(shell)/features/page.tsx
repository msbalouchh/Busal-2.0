import { ControlCenterFeatureManagementHub } from "@/modules/control-center/features/components/control-center-feature-management-hub";
import { getControlCenterFeatureManagementContext } from "@/modules/control-center/features/lib/get-control-center-feature-management-context";

export const dynamic = "force-dynamic";

interface ControlCenterFeaturesPageProps {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    scope?: string;
    category?: string;
    module?: string;
    page?: string;
  }>;
}

export default async function ControlCenterFeaturesPage({
  searchParams,
}: ControlCenterFeaturesPageProps) {
  const params = (await searchParams) ?? {};
  const page = params.page ? Number(params.page) : 1;

  const bundle = await getControlCenterFeatureManagementContext({
    search: params.search,
    status: params.status as never,
    scope: params.scope as never,
    category: params.category as never,
    module: params.module,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  return <ControlCenterFeatureManagementHub initialBundle={bundle} />;
}
