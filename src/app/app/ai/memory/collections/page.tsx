import type { Metadata } from "next";
import { Brain } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MemoryCollectionsPanel } from "@/modules/ai-memory-management/components/memory-collections-panel";
import { getMemoryCollectionsContext } from "@/modules/ai-memory-management/lib/get-ai-memory-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Memory Collections" };
}

export default async function AiMemoryCollectionsPage() {
  const context = await getMemoryCollectionsContext();

  return (
    <ApplicationPageTemplate
      title="Memory Collections"
      description="Organize shared and long-term memories into collections."
      icon={Brain}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Memory", href: "/app/ai/memory" },
        { label: "Collections" },
      ]}
    >
      <MemoryCollectionsPanel context={context} collections={context.collections} />
    </ApplicationPageTemplate>
  );
}
