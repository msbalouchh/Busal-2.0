import { ControlCenterBillingHub } from "@/modules/control-center/billing/components/control-center-billing-hub";
import { getControlCenterRevenueContext } from "@/modules/control-center/billing/lib/get-control-center-revenue-context";

export const dynamic = "force-dynamic";

export default async function ControlCenterRevenuePage() {
  const bundle = await getControlCenterRevenueContext();

  return <ControlCenterBillingHub bundle={bundle} view="revenue" />;
}
