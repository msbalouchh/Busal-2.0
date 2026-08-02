import type { Metadata } from "next";
import { GitBranch } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ObservabilityTracesPanel } from "@/modules/observability-platform-management/components/observability-traces-panel";
import { getObservabilityTracesContext } from "@/modules/observability-platform-management/lib/get-observability-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Traces" };
}

export default async function ObservabilityTracesPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const context = await getObservabilityTracesContext(params.service);

  return (
    <ApplicationPageTemplate
      title="Traces"
      description="Distributed trace explorer for platform services."
      icon={GitBranch}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Observability", href: APPLICATION_SHELL_ROUTES.observability },
        { label: "Traces" },
      ]}
    >
      <ObservabilityTracesPanel traces={context.traces} serviceFilter={context.serviceFilter} />
    </ApplicationPageTemplate>
  );
}
