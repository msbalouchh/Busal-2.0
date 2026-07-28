import { SettingsEngineLists } from "@/modules/settings-engine/components/settings-engine-lists";
import { getSettingsEngineDefinitionsContext } from "@/modules/settings-engine/lib/get-settings-context";

export default async function SettingsEngineDefinitionsPage() {
  const { definitions } = await getSettingsEngineDefinitionsContext();
  return <SettingsEngineLists definitions={definitions} />;
}
