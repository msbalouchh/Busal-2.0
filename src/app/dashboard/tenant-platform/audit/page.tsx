import { TenantPlatformLists } from "@/modules/tenant-platform/components/tenant-platform-lists";
import { getTenantPlatformAuditContext } from "@/modules/tenant-platform/lib/get-tenant-platform-context";

export default async function TenantPlatformAuditPage() {
  const { auditLogs } = await getTenantPlatformAuditContext();
  return <TenantPlatformLists auditLogs={auditLogs} />;
}
