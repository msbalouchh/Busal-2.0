import { ControlCenterPlatformAdminHub } from "@/modules/control-center/platform-admin/components/control-center-platform-admin-hub";
import { getControlCenterPlatformAdminContext } from "@/modules/control-center/platform-admin/lib/get-control-center-platform-admin-context";

export const dynamic = "force-dynamic";

export default async function ControlCenterPlatformSettingsPage() {
  const bundle = await getControlCenterPlatformAdminContext("settings");
  return <ControlCenterPlatformAdminHub bundle={bundle} defaultView="settings" />;
}
