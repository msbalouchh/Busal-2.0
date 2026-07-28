import { SettingsEngineDashboard } from "@/modules/settings-engine/components/settings-engine-dashboard";
import { getSettingsEngineOverviewContext } from "@/modules/settings-engine/lib/get-settings-context";

export default async function SettingsEngineOverviewPage() {
  const { dashboard } = await getSettingsEngineOverviewContext();
  return <SettingsEngineDashboard dashboard={dashboard} />;
}
