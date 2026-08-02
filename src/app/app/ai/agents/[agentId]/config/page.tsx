import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bot } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AgentConfigPanel } from "@/modules/ai-agent-platform-management/components/agent-config-panel";
import { AI_AGENT_PLATFORM_ROUTES } from "@/modules/ai-agent-platform-management/constants/routes";
import { getAgentDetailsContext } from "@/modules/ai-agent-platform-management/lib/get-ai-agent-platform-context";

interface PageProps {
  params: Promise<{ agentId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Agent Configuration" };
}

export default async function AgentConfigPage({ params }: PageProps) {
  const { agentId } = await params;
  const context = await getAgentDetailsContext(agentId);

  if (!context.permissionsFlags.canUpdate) {
    redirect(AI_AGENT_PLATFORM_ROUTES.agent(agentId));
  }

  return (
    <ApplicationPageTemplate
      title={`Configure ${context.agent.name}`}
      description="Update agent settings and configuration."
      icon={Bot}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Agents", href: AI_AGENT_PLATFORM_ROUTES.dashboard() },
        { label: context.agent.name, href: AI_AGENT_PLATFORM_ROUTES.agent(agentId) },
        { label: "Config" },
      ]}
    >
      <AgentConfigPanel context={context} agent={context.agent} />
    </ApplicationPageTemplate>
  );
}
