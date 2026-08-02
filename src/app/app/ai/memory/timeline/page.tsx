import type { Metadata } from "next";
import { Brain } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MemoryTimelinePanel } from "@/modules/ai-memory-management/components/memory-timeline-panel";
import { getMemoryTimelineContext } from "@/modules/ai-memory-management/lib/get-ai-memory-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Memory Timeline" };
}

export default async function AiMemoryTimelinePage() {
  const context = await getMemoryTimelineContext();

  return (
    <ApplicationPageTemplate
      title="Memory Timeline"
      description="Chronological view of stored AI memories."
      icon={Brain}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Memory", href: "/app/ai/memory" },
        { label: "Timeline" },
      ]}
    >
      <MemoryTimelinePanel context={context} timeline={context.timeline} />
    </ApplicationPageTemplate>
  );
}
