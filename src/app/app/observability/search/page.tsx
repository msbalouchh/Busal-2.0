import type { Metadata } from "next";
import { Search } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ObservabilitySearchPanel } from "@/modules/observability-platform-management/components/observability-search-panel";
import { getObservabilitySearchContext } from "@/modules/observability-platform-management/lib/get-observability-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Search" };
}

export default async function ObservabilitySearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const context = await getObservabilitySearchContext(params.q);

  return (
    <ApplicationPageTemplate
      title="Search"
      description="Search logs and metrics across the observability platform."
      icon={Search}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Observability", href: APPLICATION_SHELL_ROUTES.observability },
        { label: "Search" },
      ]}
    >
      <ObservabilitySearchPanel
        search={context.search}
        logs={context.logs}
        metrics={context.metrics}
      />
    </ApplicationPageTemplate>
  );
}
