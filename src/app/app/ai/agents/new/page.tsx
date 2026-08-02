import type { Metadata } from "next";
import { Bot } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AgentConfigPanel } from "@/modules/ai-agent-platform-management/components/agent-config-panel";
import { getCreateAgentContext } from "@/modules/ai-agent-platform-management/lib/get-ai-agent-platform-context";
import { AI_AGENT_PLATFORM_ROUTES } from "@/modules/ai-agent-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "New AI Agent" };
}

export default async function NewAgentPage() {
  const context = await getCreateAgentContext();

  return (
    <ApplicationPageTemplate
      title="New AI Agent"
      description="Register a new agent on the Busal AI Agent Platform."
      icon={Bot}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Agents", href: AI_AGENT_PLATFORM_ROUTES.dashboard() },
        { label: "New" },
      ]}
    >
      <AgentConfigPanel context={context} />
    </ApplicationPageTemplate>
  );
}
