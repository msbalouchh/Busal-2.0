import { LocalizationPlatformDashboard } from "@/modules/localization-platform/components/localization-platform-dashboard";
import { getLocalizationPlatformOverviewContext } from "@/modules/localization-platform/lib/get-localization-platform-context";

export default async function LocalizationPlatformOverviewPage() {
  const { dashboard } = await getLocalizationPlatformOverviewContext();
  return <LocalizationPlatformDashboard dashboard={dashboard} />;
}
