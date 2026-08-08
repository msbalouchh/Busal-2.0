import { notFound } from "next/navigation";

import { ControlCenterBusinessDetail } from "@/modules/control-center/businesses/components/control-center-business-detail";
import { getControlCenterBusinessDetailContext } from "@/modules/control-center/businesses/lib/get-control-center-businesses-context";

export const dynamic = "force-dynamic";

interface ControlCenterBusinessDetailPageProps {
  params: Promise<{ businessId: string }>;
}

export default async function ControlCenterBusinessDetailPage({
  params,
}: ControlCenterBusinessDetailPageProps) {
  const { businessId } = await params;

  try {
    const bundle = await getControlCenterBusinessDetailContext(businessId);
    return <ControlCenterBusinessDetail bundle={bundle} />;
  } catch {
    notFound();
  }
}
