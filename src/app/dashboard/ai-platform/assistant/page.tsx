import type { Metadata } from "next";

import { AiAssistantPanel } from "@/modules/ai-platform/components/ai-assistant-panel";
import { getAiPlatformAssistantContext } from "@/modules/ai-platform/lib/get-ai-platform-context";

export const metadata: Metadata = {
  title: "AI Assistant",
};

export default async function AiPlatformAssistantPage() {
  const { collections, recentSearches, permissions } = await getAiPlatformAssistantContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground text-sm">
          Context-aware chat powered by your business knowledge base.
        </p>
      </div>
      <AiAssistantPanel
        collections={collections}
        recentSearches={recentSearches}
        canManageKnowledge={permissions.canManageKnowledge}
      />
    </div>
  );
}
