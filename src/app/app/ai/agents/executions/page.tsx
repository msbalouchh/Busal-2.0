import type { Metadata } from "next";
import Link from "next/link";
import { Bot } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentPlatformNav } from "@/modules/ai-agent-platform-management/components/agent-platform-nav";
import { AI_AGENT_PLATFORM_ROUTES } from "@/modules/ai-agent-platform-management/constants/routes";
import { getAgentExecutionsContext } from "@/modules/ai-agent-platform-management/lib/get-ai-agent-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Agent Executions" };
}

export default async function AgentExecutionsPage() {
  const context = await getAgentExecutionsContext();

  return (
    <ApplicationPageTemplate
      title="Execution History"
      description="Platform-wide AI agent execution history."
      icon={Bot}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Agents", href: AI_AGENT_PLATFORM_ROUTES.dashboard() },
        { label: "Executions" },
      ]}
    >
      <div className="space-y-6">
        <AgentPlatformNav />
        <Card>
          <CardHeader>
            <CardTitle>Recent executions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {context.executions.length === 0 ? (
              <p className="text-muted-foreground">No executions recorded yet.</p>
            ) : (
              context.executions.map((execution) => (
                <div key={execution.id} className="border-b pb-3 last:border-0">
                  <Link
                    href={AI_AGENT_PLATFORM_ROUTES.agent(execution.agentId)}
                    className="font-medium hover:underline"
                  >
                    {execution.agentName ?? execution.agentId}
                  </Link>
                  <p className="text-muted-foreground">
                    {execution.status} · {execution.duration ?? 0}ms ·{" "}
                    {new Date(execution.createdAt).toLocaleString("en-GB")}
                  </p>
                  {execution.error ? (
                    <p className="text-destructive text-xs">{execution.error}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </ApplicationPageTemplate>
  );
}
