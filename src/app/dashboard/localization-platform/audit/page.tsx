import { LocalizationPlatformLists } from "@/modules/localization-platform/components/localization-platform-lists";
import { getLocalizationPlatformAuditContext } from "@/modules/localization-platform/lib/get-localization-platform-context";

export default async function LocalizationPlatformAuditPage() {
  const { auditLogs } = await getLocalizationPlatformAuditContext();
  return <LocalizationPlatformLists auditLogs={auditLogs} />;
}
