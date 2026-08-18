import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { AiOperationsPanel } from "@/modules/customer-ai/components/ai-operations-panel";
import { getAiOperationsDashboardAction } from "@/modules/customer-ai/actions/ai-operations-actions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";

export default async function AiOperationsPage() {
  const platform = await protectedPage({ permission: PERMISSION_CODES.AI_VIEW });
  const data = await getAiOperationsDashboardAction();
  const canManage =
    platform.isOwner || platform.permissions.includes(PERMISSION_CODES.SETTINGS_EDIT);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">AI Operations</h1>
        <p className="text-muted-foreground text-sm">
          Operate your business through AI — real orders, reservations, inventory, and analytics.
          All actions are permission-checked, confirmed when required, and audit-logged.
        </p>
      </div>
      <AiOperationsPanel
        overview={data.overview}
        actions={data.actions}
        capabilities={data.capabilities}
        tools={data.tools}
        pendingConfirmations={data.pendingConfirmations}
        expiredConfirmations={data.expiredConfirmations}
        canManage={canManage}
      />
    </div>
  );
}
