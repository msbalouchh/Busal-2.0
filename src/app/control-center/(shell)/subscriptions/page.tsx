import { ControlCenterBillingHub } from "@/modules/control-center/billing/components/control-center-billing-hub";
import { getControlCenterBillingContext } from "@/modules/control-center/billing/lib/get-control-center-billing-context";

export const dynamic = "force-dynamic";

interface ControlCenterSubscriptionsPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function ControlCenterSubscriptionsPage({
  searchParams,
}: ControlCenterSubscriptionsPageProps) {
  const params = await searchParams;
  const bundle = await getControlCenterBillingContext({
    search: params.search,
    page: params.page ? Number(params.page) : 1,
  });

  return <ControlCenterBillingHub bundle={bundle} />;
}
