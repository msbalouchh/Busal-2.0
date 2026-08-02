import { ControlCenterDashboard } from "@/modules/control-center/components/control-center-dashboard";
import { getControlCenterShellContext } from "@/modules/control-center/lib/get-control-center-context";
import { getControlCenterPlatformBundle } from "@/services/control-center-module.service";

export const dynamic = "force-dynamic";

export default async function ControlCenterPage() {
  const { operator } = await getControlCenterShellContext();
  const bundle = await getControlCenterPlatformBundle();

  return <ControlCenterDashboard bundle={bundle} operatorName={operator.fullName} />;
}
