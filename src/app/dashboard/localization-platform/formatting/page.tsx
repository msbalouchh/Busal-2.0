import { LocalizationPlatformLists } from "@/modules/localization-platform/components/localization-platform-lists";
import { getLocalizationPlatformFormattingContext } from "@/modules/localization-platform/lib/get-localization-platform-context";

export default async function LocalizationPlatformFormattingPage() {
  const { formatted } = await getLocalizationPlatformFormattingContext();
  return <LocalizationPlatformLists formatted={formatted} />;
}
