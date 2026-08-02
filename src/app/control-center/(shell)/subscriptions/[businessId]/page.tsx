import { notFound } from "next/navigation";

import { ControlCenterSubscriptionDetail } from "@/modules/control-center/billing/components/control-center-subscription-detail";
import { getControlCenterSubscriptionDetailContext } from "@/modules/control-center/billing/lib/get-control-center-billing-context";

export const dynamic = "force-dynamic";

interface ControlCenterSubscriptionDetailPageProps {
  params: Promise<{ businessId: string }>;
}

export default async function ControlCenterSubscriptionDetailPage({
  params,
}: ControlCenterSubscriptionDetailPageProps) {
  const { businessId } = await params;

  try {
    const bundle = await getControlCenterSubscriptionDetailContext(businessId);
    return <ControlCenterSubscriptionDetail bundle={bundle} />;
  } catch {
    notFound();
  }
}
