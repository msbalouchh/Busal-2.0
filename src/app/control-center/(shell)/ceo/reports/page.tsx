import { PlatformCeoReportsHub } from "@/modules/control-center/platform-ceo/components/platform-ceo-reports-hub";
import { getPlatformCeoReportsContext } from "@/modules/control-center/platform-ceo/lib/get-platform-ceo-reports-context";

export const dynamic = "force-dynamic";

export default async function ControlCenterCeoReportsPage() {
  const bundle = await getPlatformCeoReportsContext();
  return <PlatformCeoReportsHub initialBundle={bundle} />;
}
