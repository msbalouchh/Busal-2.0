import type { Metadata } from "next";
import { Search } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { VoiceSearchPanel } from "@/modules/ai-voice-agent-management/components/voice-search-panel";
import { getVoiceSearchContext } from "@/modules/ai-voice-agent-management/lib/get-ai-voice-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search | AI Voice Agent" };
}

interface AiVoiceSearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AiVoiceSearchPage({ searchParams }: AiVoiceSearchPageProps) {
  const params = await searchParams;
  const context = await getVoiceSearchContext(params.q ?? "");

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search voice sessions and commands."
      icon={Search}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Voice Agent", href: "/app/ai/voice" },
        { label: "Search" },
      ]}
    >
      <VoiceSearchPanel search={context.search} results={context.results} />
    </ApplicationPageTemplate>
  );
}
