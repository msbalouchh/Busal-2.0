import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ObservabilityMetricsPanel } from "@/modules/observability-platform-management/components/observability-metrics-panel";
import { getObservabilityMetricsContext } from "@/modules/observability-platform-management/lib/get-observability-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Metrics" };
}

export default async function ObservabilityMetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const context = await getObservabilityMetricsContext(params.service);

  return (
    <ApplicationPageTemplate
      title="Metrics"
      description="Explore platform metrics across all services."
      icon={BarChart3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Observability", href: APPLICATION_SHELL_ROUTES.observability },
        { label: "Metrics" },
      ]}
    >
      <ObservabilityMetricsPanel metrics={context.metrics} serviceFilter={context.serviceFilter} />
    </ApplicationPageTemplate>
  );
}
