import { LocalizationPlatformLists } from "@/modules/localization-platform/components/localization-platform-lists";
import { getLocalizationPlatformVersionsContext } from "@/modules/localization-platform/lib/get-localization-platform-context";

export default async function LocalizationPlatformVersionsPage() {
  const { versions } = await getLocalizationPlatformVersionsContext();
  return <LocalizationPlatformLists versions={versions} />;
}
