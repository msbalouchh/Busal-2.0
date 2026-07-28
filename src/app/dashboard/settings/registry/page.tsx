import { SettingsEngineLists } from "@/modules/settings-engine/components/settings-engine-lists";
import { getSettingsEngineRegistryContext } from "@/modules/settings-engine/lib/get-settings-context";

export default async function SettingsEngineRegistryPage() {
  const { registrations } = await getSettingsEngineRegistryContext();
  return <SettingsEngineLists registrations={registrations} />;
}
