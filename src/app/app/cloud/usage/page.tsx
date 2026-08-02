import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CloudUsagePanel } from "@/modules/cloud-platform-management/components/cloud-usage-panel";
import { getCloudUsageContext } from "@/modules/cloud-platform-management/lib/get-cloud-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Usage" };
}

export default async function CloudUsagePage() {
  const context = await getCloudUsageContext();
  return (
    <ApplicationPageTemplate
      title="Usage Analytics"
      description="Platform usage metering and analytics."
      icon={BarChart3}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Cloud", href: APPLICATION_SHELL_ROUTES.cloud },
        { label: "Usage" },
      ]}
    >
      <CloudUsagePanel usage={context.usage} />
    </ApplicationPageTemplate>
  );
}
