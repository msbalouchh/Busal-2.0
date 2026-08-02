import type { Metadata } from "next";
import { Megaphone } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MarketingSearchPanel } from "@/modules/ai-marketing-agent-management/components/marketing-search-panel";
import { getMarketingSearchContext } from "@/modules/ai-marketing-agent-management/lib/get-ai-marketing-agent-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search Marketing" };
}

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AiMarketingSearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const context = await getMarketingSearchContext(params.q ?? "");

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search marketing insights and recommendations."
      icon={Megaphone}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Marketing Agent", href: "/app/ai/marketing" },
        { label: "Search" },
      ]}
    >
      <MarketingSearchPanel search={context.search} results={context.results} />
    </ApplicationPageTemplate>
  );
}
