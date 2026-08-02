import type { Metadata } from "next";
import { Radio } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { VoiceSessionsPanel } from "@/modules/ai-voice-agent-management/components/voice-sessions-panel";
import { getVoiceSessionsContext } from "@/modules/ai-voice-agent-management/lib/get-ai-voice-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Voice Sessions | AI Voice Agent" };
}

export default async function AiVoiceSessionsPage() {
  const context = await getVoiceSessionsContext();

  return (
    <ApplicationPageTemplate
      title="Voice Sessions"
      description="Active and historical voice interaction sessions."
      icon={Radio}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Voice Agent", href: "/app/ai/voice" },
        { label: "Sessions" },
      ]}
    >
      <VoiceSessionsPanel sessions={context.sessions} />
    </ApplicationPageTemplate>
  );
}
