import type { Metadata } from "next";
import { Bot } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AssistantChatPanel } from "@/modules/ai-restaurant-assistant-management/components/assistant-chat-panel";
import { AI_RESTAURANT_ASSISTANT_ROUTES } from "@/modules/ai-restaurant-assistant-management/constants/routes";
import { getAssistantChatContext } from "@/modules/ai-restaurant-assistant-management/lib/get-ai-restaurant-assistant-context";
import { RESTAURANT_MANAGEMENT_ROUTES } from "@/modules/restaurant-management/constants/routes";

interface PageProps {
  searchParams: Promise<{ branchId?: string; conversationId?: string; search?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "AI Chat" };
}

export default async function AssistantChatPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getAssistantChatContext(
    params.branchId,
    params.conversationId,
    params.search,
  );

  return (
    <ApplicationPageTemplate
      title="AI Chat"
      description="Chat with your restaurant assistant using live operational data."
      icon={Bot}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Restaurant", href: RESTAURANT_MANAGEMENT_ROUTES.dashboard },
        { label: "AI Assistant", href: AI_RESTAURANT_ASSISTANT_ROUTES.dashboard() },
        { label: "Chat" },
      ]}
    >
      <AssistantChatPanel
        context={context}
        conversations={context.conversations}
        initialMessages={context.activeConversation?.messages ?? []}
        activeConversationId={params.conversationId ?? null}
      />
    </ApplicationPageTemplate>
  );
}
