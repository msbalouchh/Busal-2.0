import type { Metadata } from "next";
import { Headphones } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SupportConversationsPanel } from "@/modules/ai-support-agent-management/components/support-conversations-panel";
import { getSupportConversationsContext } from "@/modules/ai-support-agent-management/lib/get-ai-support-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Conversations" };
}

interface PageProps {
  searchParams: Promise<{ ticket?: string }>;
}

export default async function AiSupportConversationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getSupportConversationsContext(params.ticket);

  return (
    <ApplicationPageTemplate
      title="Conversation Viewer"
      description="Summaries and message timelines for open support tickets."
      icon={Headphones}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Support Agent", href: "/app/ai/support" },
        { label: "Conversations" },
      ]}
    >
      <SupportConversationsPanel
        summaries={context.summaries}
        tickets={context.tickets}
        messages={context.messages}
        selectedTicketId={context.selectedTicketId}
      />
    </ApplicationPageTemplate>
  );
}
