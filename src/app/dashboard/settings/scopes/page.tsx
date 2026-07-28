import { SettingsEngineLists } from "@/modules/settings-engine/components/settings-engine-lists";
import { getSettingsEngineScopesContext } from "@/modules/settings-engine/lib/get-settings-context";

export default async function SettingsEngineScopesPage() {
  const { values } = await getSettingsEngineScopesContext();
  return <SettingsEngineLists values={values} />;
}
