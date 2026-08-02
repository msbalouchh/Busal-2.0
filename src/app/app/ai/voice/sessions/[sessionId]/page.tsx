import type { Metadata } from "next";
import { Radio } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { VoiceSessionDetailPanel } from "@/modules/ai-voice-agent-management/components/voice-session-detail-panel";
import { getVoiceSessionDetailContext } from "@/modules/ai-voice-agent-management/lib/get-ai-voice-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Voice Session | AI Voice Agent" };
}

interface AiVoiceSessionDetailPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function AiVoiceSessionDetailPage({ params }: AiVoiceSessionDetailPageProps) {
  const { sessionId } = await params;
  const context = await getVoiceSessionDetailContext(sessionId);

  return (
    <ApplicationPageTemplate
      title="Voice Session"
      description="Session details, command history, and voice command processing."
      icon={Radio}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Voice Agent", href: "/app/ai/voice" },
        { label: "Sessions", href: "/app/ai/voice/sessions" },
        { label: "Details" },
      ]}
    >
      <VoiceSessionDetailPanel
        context={context}
        session={context.session}
        commands={context.commands}
      />
    </ApplicationPageTemplate>
  );
}
