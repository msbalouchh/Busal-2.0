import { LocalizationPlatformLists } from "@/modules/localization-platform/components/localization-platform-lists";
import { getLocalizationPlatformLanguagesContext } from "@/modules/localization-platform/lib/get-localization-platform-context";

export default async function LocalizationPlatformLanguagesPage() {
  const { languages } = await getLocalizationPlatformLanguagesContext();
  return <LocalizationPlatformLists languages={languages} />;
}
