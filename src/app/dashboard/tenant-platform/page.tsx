import { TenantPlatformDashboard } from "@/modules/tenant-platform/components/tenant-platform-dashboard";
import { getTenantPlatformOverviewContext } from "@/modules/tenant-platform/lib/get-tenant-platform-context";

export default async function TenantPlatformOverviewPage() {
  const { dashboard } = await getTenantPlatformOverviewContext();
  return <TenantPlatformDashboard dashboard={dashboard} />;
}
