import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { VoiceAnalyticsPanel } from "@/modules/ai-voice-agent-management/components/voice-analytics-panel";
import { getVoiceAnalyticsContext } from "@/modules/ai-voice-agent-management/lib/get-ai-voice-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Voice Analytics | AI Voice Agent" };
}

export default async function AiVoiceAnalyticsPage() {
  const context = await getVoiceAnalyticsContext();

  return (
    <ApplicationPageTemplate
      title="Voice Analytics"
      description="Session activity, intent usage, and command success metrics."
      icon={BarChart3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Voice Agent", href: "/app/ai/voice" },
        { label: "Analytics" },
      ]}
    >
      <VoiceAnalyticsPanel analytics={context.analytics} intents={context.intents} />
    </ApplicationPageTemplate>
  );
}
