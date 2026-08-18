import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { CustomerAiConversationsPanel } from "@/modules/customer-ai/components/customer-ai-conversations-panel";
import { listCustomerConversations } from "@/modules/customer-ai/services/customer-ai-analytics.service";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";

export default async function CustomerAiConversationsPage() {
  const platform = await protectedPage({ permission: PERMISSION_CODES.AI_VIEW });
  const conversations = await listCustomerConversations(platform.business.id);
  const canManage =
    platform.isOwner || platform.permissions.includes(PERMISSION_CODES.AI_AGENT_EDIT);

  return (
    <CustomerAiConversationsPanel conversations={conversations} canManage={canManage} />
  );
}
