import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ObservabilityLogsPanel } from "@/modules/observability-platform-management/components/observability-logs-panel";
import { getObservabilityLogsContext } from "@/modules/observability-platform-management/lib/get-observability-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Logs" };
}

export default async function ObservabilityLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; level?: string; search?: string }>;
}) {
  const params = await searchParams;
  const context = await getObservabilityLogsContext(params);

  return (
    <ApplicationPageTemplate
      title="Logs"
      description="Search and explore immutable platform logs."
      icon={FileText}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Observability", href: APPLICATION_SHELL_ROUTES.observability },
        { label: "Logs" },
      ]}
    >
      <ObservabilityLogsPanel logs={context.logs} filters={context.filters} />
    </ApplicationPageTemplate>
  );
}
