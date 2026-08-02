import type { Metadata } from "next";
import { Mic } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { VoiceAgentDashboardPanel } from "@/modules/ai-voice-agent-management/components/voice-agent-dashboard-panel";
import { getVoiceAgentDashboardContext } from "@/modules/ai-voice-agent-management/lib/get-ai-voice-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "AI Voice Agent" };
}

export default async function AiVoiceAgentDashboardPage() {
  const context = await getVoiceAgentDashboardContext();

  return (
    <ApplicationPageTemplate
      title="AI Voice Agent"
      description="Voice sessions, command processing, and provider-agnostic speech abstraction."
      icon={Mic}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Voice Agent" },
      ]}
    >
      <VoiceAgentDashboardPanel
        context={context}
        stats={context.stats}
        sessions={context.sessions}
        commands={context.commands}
        intents={context.intents}
      />
    </ApplicationPageTemplate>
  );
}
