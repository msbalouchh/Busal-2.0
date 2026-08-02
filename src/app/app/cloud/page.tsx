import type { Metadata } from "next";
import { Cloud } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CloudDashboardPanel } from "@/modules/cloud-platform-management/components/cloud-dashboard-panel";
import { getCloudDashboardContext } from "@/modules/cloud-platform-management/lib/get-cloud-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Cloud" };
}

export default async function CloudDashboardPage() {
  const context = await getCloudDashboardContext();
  return (
    <ApplicationPageTemplate
      title="Cloud"
      description="SaaS tenant, subscription, and usage management."
      icon={Cloud}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Cloud" },
      ]}
    >
      <CloudDashboardPanel context={context} summary={context.summary} usage={context.usage} />
    </ApplicationPageTemplate>
  );
}
