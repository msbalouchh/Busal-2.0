import { SettingsEngineLists } from "@/modules/settings-engine/components/settings-engine-lists";
import { getSettingsEngineValuesContext } from "@/modules/settings-engine/lib/get-settings-context";

export default async function SettingsEngineValuesPage() {
  const { values } = await getSettingsEngineValuesContext();
  return <SettingsEngineLists values={values} />;
}
