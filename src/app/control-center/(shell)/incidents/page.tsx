import { ControlCenterSupportHub } from "@/modules/control-center/support/components/control-center-support-hub";
import { getControlCenterSupportContext } from "@/modules/control-center/support/lib/get-control-center-support-context";

export const dynamic = "force-dynamic";

export default async function ControlCenterIncidentsPage() {
  const bundle = await getControlCenterSupportContext({}, { active: true });

  return <ControlCenterSupportHub bundle={bundle} defaultView="incidents" />;
}
