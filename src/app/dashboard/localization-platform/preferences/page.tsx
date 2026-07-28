import { LocalizationPlatformLists } from "@/modules/localization-platform/components/localization-platform-lists";
import { getLocalizationPlatformPreferencesContext } from "@/modules/localization-platform/lib/get-localization-platform-context";

export default async function LocalizationPlatformPreferencesPage() {
  const { settings } = await getLocalizationPlatformPreferencesContext();
  return <LocalizationPlatformLists settings={settings} />;
}
