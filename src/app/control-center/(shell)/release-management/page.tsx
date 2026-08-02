import { ControlCenterPlatformAdminHub } from "@/modules/control-center/platform-admin/components/control-center-platform-admin-hub";
import { getControlCenterPlatformAdminContext } from "@/modules/control-center/platform-admin/lib/get-control-center-platform-admin-context";

export const dynamic = "force-dynamic";

export default async function ControlCenterReleaseManagementPage() {
  const bundle = await getControlCenterPlatformAdminContext("releases");
  return <ControlCenterPlatformAdminHub bundle={bundle} defaultView="releases" />;
}
