import type { Metadata } from "next";
import { Brain } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MemoryAnalyticsPanel } from "@/modules/ai-memory-management/components/memory-analytics-panel";
import { getMemoryAnalyticsContext } from "@/modules/ai-memory-management/lib/get-ai-memory-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Memory Analytics" };
}

export default async function AiMemoryAnalyticsPage() {
  const context = await getMemoryAnalyticsContext();

  return (
    <ApplicationPageTemplate
      title="Memory Analytics"
      description="Retention, importance, and growth analytics for AI memory."
      icon={Brain}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Memory", href: "/app/ai/memory" },
        { label: "Analytics" },
      ]}
    >
      <MemoryAnalyticsPanel context={context} analytics={context.analytics} />
    </ApplicationPageTemplate>
  );
}
