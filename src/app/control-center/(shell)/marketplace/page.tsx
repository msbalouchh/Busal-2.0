import { ControlCenterMarketplaceHub } from "@/modules/control-center/marketplace/components/control-center-marketplace-hub";
import { getControlCenterMarketplaceContext } from "@/modules/control-center/marketplace/lib/get-control-center-marketplace-context";

export const dynamic = "force-dynamic";

interface ControlCenterMarketplacePageProps {
  searchParams: Promise<{ search?: string; page?: string; category?: string; status?: string }>;
}

export default async function ControlCenterMarketplacePage({
  searchParams,
}: ControlCenterMarketplacePageProps) {
  const params = await searchParams;
  const bundle = await getControlCenterMarketplaceContext({
    search: params.search,
    page: params.page ? Number(params.page) : 1,
    category: (params.category as never) ?? undefined,
    status: (params.status as never) ?? undefined,
  });

  return <ControlCenterMarketplaceHub bundle={bundle} />;
}
