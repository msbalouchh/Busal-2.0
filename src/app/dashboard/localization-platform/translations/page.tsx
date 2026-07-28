import { LocalizationPlatformLists } from "@/modules/localization-platform/components/localization-platform-lists";
import { getLocalizationPlatformTranslationsContext } from "@/modules/localization-platform/lib/get-localization-platform-context";

export default async function LocalizationPlatformTranslationsPage() {
  const { keys, translations } = await getLocalizationPlatformTranslationsContext();
  return <LocalizationPlatformLists keys={keys} translations={translations} />;
}
