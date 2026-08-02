import type { Metadata } from "next";

import { AiToolsPanel } from "@/modules/ai-platform/components/ai-tools-panel";
import { getAiPlatformToolsContext } from "@/modules/ai-platform/lib/get-ai-platform-context";

export const metadata: Metadata = {
  title: "AI Tools",
};

export default async function AiPlatformToolsPage() {
  const { permissions, dashboard, tools, executions, discovered } =
    await getAiPlatformToolsContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Tools</h1>
        <p className="text-muted-foreground text-sm">
          Available tools, permissions, usage, connected services, and execution history.
        </p>
      </div>
      <AiToolsPanel
        permissions={permissions}
        dashboard={dashboard}
        tools={tools}
        executions={executions}
        discovered={discovered}
      />
    </div>
  );
}
