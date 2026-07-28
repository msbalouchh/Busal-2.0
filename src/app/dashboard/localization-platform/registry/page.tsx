import { LocalizationPlatformLists } from "@/modules/localization-platform/components/localization-platform-lists";
import { getLocalizationPlatformRegistryContext } from "@/modules/localization-platform/lib/get-localization-platform-context";

export default async function LocalizationPlatformRegistryPage() {
  const { registrations } = await getLocalizationPlatformRegistryContext();
  return <LocalizationPlatformLists registrations={registrations} />;
}
