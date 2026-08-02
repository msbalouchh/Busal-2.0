import type { Metadata } from "next";
import { Bot } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AgentDetailsPanel } from "@/modules/ai-agent-platform-management/components/agent-details-panel";
import { AI_AGENT_PLATFORM_ROUTES } from "@/modules/ai-agent-platform-management/constants/routes";
import { getAgentDetailsContext } from "@/modules/ai-agent-platform-management/lib/get-ai-agent-platform-context";

interface PageProps {
  params: Promise<{ agentId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Agent Details" };
}

export default async function AgentDetailsPage({ params }: PageProps) {
  const { agentId } = await params;
  const context = await getAgentDetailsContext(agentId);

  return (
    <ApplicationPageTemplate
      title={context.agent.name}
      description="Agent details, capabilities, tools, and execution history."
      icon={Bot}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Agents", href: AI_AGENT_PLATFORM_ROUTES.dashboard() },
        { label: context.agent.name },
      ]}
    >
      <AgentDetailsPanel
        context={context}
        agent={context.agent}
        tools={context.tools}
        capabilities={context.capabilities}
        executions={context.executions}
      />
    </ApplicationPageTemplate>
  );
}
