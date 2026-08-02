import type { Metadata } from "next";
import { Headphones } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { SupportKnowledgePanel } from "@/modules/ai-support-agent-management/components/support-knowledge-panel";
import { getSupportKnowledgeContext } from "@/modules/ai-support-agent-management/lib/get-ai-support-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Knowledge Suggestions" };
}

interface PageProps {
  searchParams: Promise<{ ticket?: string }>;
}

export default async function AiSupportKnowledgePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getSupportKnowledgeContext(params.ticket);

  return (
    <ApplicationPageTemplate
      title="Knowledge Suggestions"
      description="Recommended knowledge base articles for support tickets."
      icon={Headphones}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Support Agent", href: "/app/ai/support" },
        { label: "Knowledge" },
      ]}
    >
      <SupportKnowledgePanel
        suggestions={context.suggestions}
        tickets={context.tickets}
        selectedTicketId={context.selectedTicketId}
      />
    </ApplicationPageTemplate>
  );
}
