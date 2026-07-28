import { SettingsEngineLists } from "@/modules/settings-engine/components/settings-engine-lists";
import { getSettingsEngineAuditContext } from "@/modules/settings-engine/lib/get-settings-context";

export default async function SettingsEngineAuditPage() {
  const { auditLogs } = await getSettingsEngineAuditContext();
  return <SettingsEngineLists auditLogs={auditLogs} />;
}
