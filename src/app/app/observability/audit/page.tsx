import type { Metadata } from "next";
import { History } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ObservabilityAuditPanel } from "@/modules/observability-platform-management/components/observability-audit-panel";
import { getObservabilityAuditContext } from "@/modules/observability-platform-management/lib/get-observability-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Audit" };
}

export default async function ObservabilityAuditPage() {
  const context = await getObservabilityAuditContext();

  return (
    <ApplicationPageTemplate
      title="Audit"
      description="Aggregated audit timeline across platform modules."
      icon={History}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Observability", href: APPLICATION_SHELL_ROUTES.observability },
        { label: "Audit" },
      ]}
    >
      <ObservabilityAuditPanel timeline={context.timeline} />
    </ApplicationPageTemplate>
  );
}
