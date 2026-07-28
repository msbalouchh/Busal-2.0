import { SettingsEngineLists } from "@/modules/settings-engine/components/settings-engine-lists";
import { getSettingsEngineVersionsContext } from "@/modules/settings-engine/lib/get-settings-context";

export default async function SettingsEngineVersionsPage() {
  const { versions } = await getSettingsEngineVersionsContext();
  return <SettingsEngineLists versions={versions} />;
}
