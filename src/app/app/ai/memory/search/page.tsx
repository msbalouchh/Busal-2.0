import type { Metadata } from "next";
import { Brain } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { MemorySearchPanel } from "@/modules/ai-memory-management/components/memory-search-panel";
import { getMemorySearchContext } from "@/modules/ai-memory-management/lib/get-ai-memory-context";
import type { MemorySearchQuery } from "@/modules/ai-memory-management/types/ai-memory-types";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    semanticQuery?: string;
    contextScope?: MemorySearchQuery["contextScope"];
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Memory Search" };
}

export default async function AiMemorySearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query: MemorySearchQuery = {
    search: params.search,
    semanticQuery: params.semanticQuery,
    contextScope: params.contextScope,
    pageSize: 24,
  };
  const context = await getMemorySearchContext(query);

  return (
    <ApplicationPageTemplate
      title="Memory Search"
      description="Keyword, semantic, context, and entity memory search."
      icon={Brain}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "AI", href: "/app/ai" },
        { label: "Memory", href: "/app/ai/memory" },
        { label: "Search" },
      ]}
    >
      <MemorySearchPanel context={context} results={context.results} query={context.query} />
    </ApplicationPageTemplate>
  );
}
