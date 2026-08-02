import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { VoiceSettingsPanel } from "@/modules/ai-voice-agent-management/components/voice-settings-panel";
import { getVoiceSettingsContext } from "@/modules/ai-voice-agent-management/lib/get-ai-voice-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Voice Settings | AI Voice Agent" };
}

export default async function AiVoiceSettingsPage() {
  const context = await getVoiceSettingsContext();

  return (
    <ApplicationPageTemplate
      title="Voice Settings"
      description="Language selection, provider configuration, and voice preferences."
      icon={Settings}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Voice Agent", href: "/app/ai/voice" },
        { label: "Settings" },
      ]}
    >
      <VoiceSettingsPanel
        context={context}
        settings={context.settings}
        sttProviderId={context.sttProvider.providerId}
        ttsProviderId={context.ttsProvider.providerId}
        sttAvailable={context.sttProvider.isAvailable()}
        ttsAvailable={context.ttsProvider.isAvailable()}
      />
    </ApplicationPageTemplate>
  );
}
