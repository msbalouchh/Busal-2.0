import type { Metadata } from "next";

import { AiPlatformOverview } from "@/modules/ai-platform/components/ai-platform-overview";
import { getAiPlatformContext } from "@/modules/ai-platform/lib/get-ai-platform-context";

export const metadata: Metadata = {
  title: "AI Platform",
};

export default async function AiPlatformPage() {
  const { widgets, permissions, recentConversations, recentActivity } =
    await getAiPlatformContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Platform</h1>
        <p className="text-muted-foreground text-sm">
          Unified AI overview, assistant, agents, knowledge, automation, tools, analytics, and
          settings.
        </p>
      </div>
      <AiPlatformOverview
        widgets={widgets}
        permissions={permissions}
        recentConversations={recentConversations}
        recentActivity={recentActivity}
      />
    </div>
  );
}
