import type { Metadata } from "next";

import { AiAutomationPanel } from "@/modules/ai-platform/components/ai-automation-panel";
import { getAiPlatformAutomationContext } from "@/modules/ai-platform/lib/get-ai-platform-context";

export const metadata: Metadata = {
  title: "AI Automation",
};

export default async function AiPlatformAutomationPage() {
  const { permissions, dashboard, workflows, executions } = await getAiPlatformAutomationContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Automation</h1>
        <p className="text-muted-foreground text-sm">
          Workflows, triggers, schedules, execution status, and history.
        </p>
      </div>
      <AiAutomationPanel
        permissions={permissions}
        dashboard={dashboard}
        workflows={workflows}
        executions={executions}
      />
    </div>
  );
}
