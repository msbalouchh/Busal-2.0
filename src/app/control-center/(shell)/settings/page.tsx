import { ControlCenterPlatformSettingsHub } from "@/modules/control-center/settings/components/control-center-platform-settings-hub";
import { getControlCenterPlatformSettingsContext } from "@/modules/control-center/settings/lib/get-control-center-platform-settings-context";

export const dynamic = "force-dynamic";

interface ControlCenterPlatformSettingsPageProps {
  searchParams: Promise<{
    search?: string;
    group?: string;
  }>;
}

export default async function ControlCenterPlatformSettingsPage({
  searchParams,
}: ControlCenterPlatformSettingsPageProps) {
  const params = await searchParams;
  const bundle = await getControlCenterPlatformSettingsContext({
    search: params.search,
    groupId: params.group ?? null,
  });

  return <ControlCenterPlatformSettingsHub initialBundle={bundle} />;
}
