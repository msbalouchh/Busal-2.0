import type { Metadata } from "next";

import { AiAgentsPanel } from "@/modules/ai-platform/components/ai-agents-panel";
import { getAiPlatformAgentsContext } from "@/modules/ai-platform/lib/get-ai-platform-context";

export const metadata: Metadata = {
  title: "AI Agents",
};

export default async function AiPlatformAgentsPage() {
  const { permissions, dashboard, agents, executions } = await getAiPlatformAgentsContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Agents</h1>
        <p className="text-muted-foreground text-sm">
          Agent directory, status, permissions, and activity.
        </p>
      </div>
      <AiAgentsPanel
        permissions={permissions}
        dashboard={dashboard}
        agents={agents}
        executions={executions}
      />
    </div>
  );
}
