import { ControlCenterMonitoringHub } from "@/modules/control-center/monitoring/components/control-center-monitoring-hub";
import { getControlCenterMonitoringContext } from "@/modules/control-center/monitoring/lib/get-control-center-monitoring-context";

export const dynamic = "force-dynamic";

export default async function ControlCenterMonitoringPage() {
  const bundle = await getControlCenterMonitoringContext();

  return <ControlCenterMonitoringHub bundle={bundle} />;
}
