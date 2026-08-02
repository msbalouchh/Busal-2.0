import { ControlCenterPlatformAdminHub } from "@/modules/control-center/platform-admin/components/control-center-platform-admin-hub";
import { getControlCenterPlatformAdminContext } from "@/modules/control-center/platform-admin/lib/get-control-center-platform-admin-context";

export const dynamic = "force-dynamic";

export default async function ControlCenterFeatureFlagsPage() {
  const bundle = await getControlCenterPlatformAdminContext("feature-flags");
  return <ControlCenterPlatformAdminHub bundle={bundle} defaultView="feature-flags" />;
}
