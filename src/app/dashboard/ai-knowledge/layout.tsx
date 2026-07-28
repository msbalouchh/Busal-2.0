import type { Metadata } from "next";

import { AiKnowledgeNav } from "@/modules/ai-knowledge/components/ai-knowledge-nav";

export const metadata: Metadata = {
  title: "AI Knowledge Engine",
};

export default function AiKnowledgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">AI Knowledge Engine</h1>
        <p className="text-muted-foreground text-sm">
          Retrieval-augmented generation with collections, document processing, vector search, and
          audit trails.
        </p>
      </div>
      <AiKnowledgeNav />
      {children}
    </div>
  );
}
