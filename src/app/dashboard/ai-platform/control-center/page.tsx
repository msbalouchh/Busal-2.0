import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AiControlCenterPanel } from "@/modules/customer-ai/components/ai-control-center-panel";
import { getCustomerAiControlCenterAction } from "@/modules/customer-ai/actions/customer-ai-actions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";

export default async function AiControlCenterPage() {
  const platform = await protectedPage({ permission: PERMISSION_CODES.AI_VIEW });
  const data = await getCustomerAiControlCenterAction();
  const canManage =
    platform.isOwner ||
    platform.permissions.includes(PERMISSION_CODES.AI_AGENT_EDIT);

  const canManageSettings =
    platform.isOwner ||
    platform.permissions.includes(PERMISSION_CODES.SETTINGS_EDIT);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">AI Control Center</h1>
        <p className="text-muted-foreground text-sm">
          Configure your business AI identity, knowledge, capabilities, and customer conversations.
        </p>
      </div>
      <AiControlCenterPanel
        identity={data.identity}
        capabilities={data.capabilities}
        operationsCapabilities={data.operationsCapabilities}
        analytics={data.analytics}
        conversations={data.conversations}
        channels={data.channels}
        knowledge={data.knowledge}
        canManage={canManage}
        canManageSettings={canManageSettings}
        businessId={platform.business.id}
      />
    </div>
  );
}
