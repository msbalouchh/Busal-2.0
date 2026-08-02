import type { Metadata } from "next";
import { Gauge } from "lucide-react";
import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CloudQuotasPanel } from "@/modules/cloud-platform-management/components/cloud-quotas-panel";
import { getCloudQuotasContext } from "@/modules/cloud-platform-management/lib/get-cloud-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Quotas" };
}

export default async function CloudQuotasPage() {
  const context = await getCloudQuotasContext();
  return (
    <ApplicationPageTemplate
      title="Quotas"
      description="Quota enforcement and utilization dashboard."
      icon={Gauge}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Cloud", href: APPLICATION_SHELL_ROUTES.cloud },
        { label: "Quotas" },
      ]}
    >
      <CloudQuotasPanel quotas={context.quotas} />
    </ApplicationPageTemplate>
  );
}
