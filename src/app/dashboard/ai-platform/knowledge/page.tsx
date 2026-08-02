import type { Metadata } from "next";

import { AiKnowledgePanel } from "@/modules/ai-platform/components/ai-knowledge-panel";
import { getAiPlatformKnowledgeContext } from "@/modules/ai-platform/lib/get-ai-platform-context";

export const metadata: Metadata = {
  title: "AI Knowledge Base",
};

export default async function AiPlatformKnowledgePage() {
  const { permissions, dashboard, documents, collections, recentSearches } =
    await getAiPlatformKnowledgeContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Knowledge Base</h1>
        <p className="text-muted-foreground text-sm">
          Knowledge sources, documents, search, categories, and RAG status.
        </p>
      </div>
      <AiKnowledgePanel
        permissions={permissions}
        dashboard={dashboard}
        documents={documents}
        collections={collections}
        recentSearches={recentSearches}
      />
    </div>
  );
}
