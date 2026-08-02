import type { Metadata } from "next";
import { HeartPulse } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ObservabilityHealthPanel } from "@/modules/observability-platform-management/components/observability-health-panel";
import { getObservabilityHealthContext } from "@/modules/observability-platform-management/lib/get-observability-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Health" };
}

export default async function ObservabilityHealthPage() {
  const context = await getObservabilityHealthContext();

  return (
    <ApplicationPageTemplate
      title="Health"
      description="System and service health status across Busal OS."
      icon={HeartPulse}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Observability", href: APPLICATION_SHELL_ROUTES.observability },
        { label: "Health" },
      ]}
    >
      <ObservabilityHealthPanel
        systemHealth={context.systemHealth}
        serviceHealth={context.serviceHealth}
      />
    </ApplicationPageTemplate>
  );
}
