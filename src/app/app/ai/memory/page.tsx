import type { Metadata } from "next";
import { Brain } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MemoryDashboardPanel } from "@/modules/ai-memory-management/components/memory-dashboard-panel";
import { getMemoryDashboardContext } from "@/modules/ai-memory-management/lib/get-ai-memory-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "AI Memory" };
}

export default async function AiMemoryDashboardPage() {
  const context = await getMemoryDashboardContext();

  return (
    <ApplicationPageTemplate
      title="AI Memory Engine"
      description="Centralized memory for every AI agent in Busal OS."
      icon={Brain}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Memory" },
      ]}
    >
      <MemoryDashboardPanel
        context={context}
        stats={context.stats}
        recent={context.recent}
        timeline={context.timeline}
        collections={context.collections}
      />
    </ApplicationPageTemplate>
  );
}
