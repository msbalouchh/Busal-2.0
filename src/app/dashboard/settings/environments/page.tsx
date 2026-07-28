import { SettingsEngineLists } from "@/modules/settings-engine/components/settings-engine-lists";
import { getSettingsEngineEnvironmentsContext } from "@/modules/settings-engine/lib/get-settings-context";

export default async function SettingsEngineEnvironmentsPage() {
  const { values } = await getSettingsEngineEnvironmentsContext();
  return <SettingsEngineLists values={values} />;
}
