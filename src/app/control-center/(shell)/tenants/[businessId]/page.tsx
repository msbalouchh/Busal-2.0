import { notFound } from "next/navigation";

import { ControlCenterTenantDetail } from "@/modules/control-center/tenants/components/control-center-tenant-detail";
import { getControlCenterTenantDetailContext } from "@/modules/control-center/tenants/lib/get-control-center-tenants-context";

export const dynamic = "force-dynamic";

interface ControlCenterTenantDetailPageProps {
  params: Promise<{ businessId: string }>;
}

export default async function ControlCenterTenantDetailPage({
  params,
}: ControlCenterTenantDetailPageProps) {
  const { businessId } = await params;

  try {
    const bundle = await getControlCenterTenantDetailContext(businessId);
    return <ControlCenterTenantDetail bundle={bundle} />;
  } catch {
    notFound();
  }
}
