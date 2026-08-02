import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { VoiceCommandsPanel } from "@/modules/ai-voice-agent-management/components/voice-commands-panel";
import { getVoiceCommandsContext } from "@/modules/ai-voice-agent-management/lib/get-ai-voice-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Voice Commands | AI Voice Agent" };
}

export default async function AiVoiceCommandsPage() {
  const context = await getVoiceCommandsContext();

  return (
    <ApplicationPageTemplate
      title="Voice Commands"
      description="Command history and intent viewer."
      icon={MessageSquare}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Voice Agent", href: "/app/ai/voice" },
        { label: "Commands" },
      ]}
    >
      <VoiceCommandsPanel commands={context.commands} intents={context.intents} />
    </ApplicationPageTemplate>
  );
}
