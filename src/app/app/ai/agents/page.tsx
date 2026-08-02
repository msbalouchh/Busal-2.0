import type { Metadata } from "next";
import { Bot } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { AgentPlatformDashboardPanel } from "@/modules/ai-agent-platform-management/components/agent-platform-dashboard-panel";
import { getAgentPlatformDashboardContext } from "@/modules/ai-agent-platform-management/lib/get-ai-agent-platform-context";
import type { AgentCategory, AgentStatus } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; category?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "AI Agents" };
}

export default async function AgentPlatformPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getAgentPlatformDashboardContext(
    params.search,
    (params.status as AgentStatus | "ALL") ?? "ALL",
    (params.category as AgentCategory | "ALL") ?? "ALL",
  );

  return (
    <ApplicationPageTemplate
      title="AI Agent Platform"
      description="Register, configure, and manage AI agents for your business."
      icon={Bot}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Agents" },
      ]}
    >
      <AgentPlatformDashboardPanel
        context={context}
        list={context.list}
        stats={context.stats}
        discovery={context.discovery}
      />
    </ApplicationPageTemplate>
  );
}
