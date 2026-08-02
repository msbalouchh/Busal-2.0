import type { Metadata } from "next";
import { Brain } from "lucide-react";
import { notFound } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MemoryDetailPanel } from "@/modules/ai-memory-management/components/memory-detail-panel";
import { getMemoryDetailContext } from "@/modules/ai-memory-management/lib/get-ai-memory-context";

interface PageProps {
  params: Promise<{ memoryId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Memory Detail" };
}

export default async function AiMemoryDetailPage({ params }: PageProps) {
  const { memoryId } = await params;

  try {
    const context = await getMemoryDetailContext(memoryId);

    return (
      <ApplicationPageTemplate
        title={context.memory.title}
        description="Memory detail, references, and lifecycle actions."
        icon={Brain}
        breadcrumbs={[
          { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
          { label: "AI", href: "/app/ai" },
          { label: "Memory", href: "/app/ai/memory" },
          { label: context.memory.title },
        ]}
      >
        <MemoryDetailPanel
          context={context}
          memory={context.memory}
          references={context.references}
        />
      </ApplicationPageTemplate>
    );
  } catch {
    notFound();
  }
}
