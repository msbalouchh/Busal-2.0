import { notFound } from "next/navigation";

import { PERMISSION_CODES } from "@/modules/authorization/constants/permissions";
import { CustomerAiConversationDetailPanel } from "@/modules/customer-ai/components/customer-ai-conversation-detail-panel";
import { getCustomerConversationDetailAction } from "@/modules/customer-ai/actions/customer-ai-actions";
import { protectedPage } from "@/modules/platform-guards/guards/page.guards";

interface ConversationDetailPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function CustomerAiConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const { conversationId } = await params;
  const platform = await protectedPage({ permission: PERMISSION_CODES.AI_VIEW });

  let conversation;
  try {
    conversation = await getCustomerConversationDetailAction(conversationId);
  } catch {
    notFound();
  }

  const canManage =
    platform.isOwner || platform.permissions.includes(PERMISSION_CODES.AI_AGENT_EDIT);

  return (
    <CustomerAiConversationDetailPanel conversation={conversation} canManage={canManage} />
  );
}
