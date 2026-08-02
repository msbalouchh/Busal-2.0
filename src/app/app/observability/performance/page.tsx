import type { Metadata } from "next";
import { Gauge } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ObservabilityPerformancePanel } from "@/modules/observability-platform-management/components/observability-performance-panel";
import { getObservabilityPerformanceContext } from "@/modules/observability-platform-management/lib/get-observability-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Performance" };
}

export default async function ObservabilityPerformancePage() {
  const context = await getObservabilityPerformanceContext();

  return (
    <ApplicationPageTemplate
      title="Performance"
      description="Latency, throughput, and usage performance metrics."
      icon={Gauge}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Observability", href: APPLICATION_SHELL_ROUTES.observability },
        { label: "Performance" },
      ]}
    >
      <ObservabilityPerformancePanel
        performance={context.performance}
        latencySeries={context.latencySeries}
        throughputSeries={context.throughputSeries}
      />
    </ApplicationPageTemplate>
  );
}
