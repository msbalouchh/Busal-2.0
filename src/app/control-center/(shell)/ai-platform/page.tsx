import { ControlCenterMonitoringHub } from "@/modules/control-center/monitoring/components/control-center-monitoring-hub";
import { getControlCenterAiPlatformContext } from "@/modules/control-center/monitoring/lib/get-control-center-ai-platform-context";

export const dynamic = "force-dynamic";

export default async function ControlCenterAiPlatformPage() {
  const bundle = await getControlCenterAiPlatformContext();

  return <ControlCenterMonitoringHub bundle={bundle} view="ai" />;
}
