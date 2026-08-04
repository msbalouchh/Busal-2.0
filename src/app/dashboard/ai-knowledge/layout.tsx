import type { Metadata } from "next";

import { DashboardSectionLayout } from "@/components/layout/dashboard-section-layout";
import { AiKnowledgeNav } from "@/modules/ai-knowledge/components/ai-knowledge-nav";

export const metadata: Metadata = {
  title: "AI Knowledge Engine",
};

export default function AiKnowledgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSectionLayout
      description="Retrieval-augmented generation with collections, document processing, vector search, and audit trails."
      nav={<AiKnowledgeNav />}
    >
      {children}
    </DashboardSectionLayout>
  );
}
