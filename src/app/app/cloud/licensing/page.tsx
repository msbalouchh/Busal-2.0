import type { Metadata } from "next";
import { Key } from "lucide-react";
import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CloudLicensingPanel } from "@/modules/cloud-platform-management/components/cloud-licensing-panel";
import { getCloudLicensingContext } from "@/modules/cloud-platform-management/lib/get-cloud-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Licensing" };
}

export default async function CloudLicensingPage() {
  const context = await getCloudLicensingContext();
  return (
    <ApplicationPageTemplate
      title="Licensing"
      description="Tenant license validation framework."
      icon={Key}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Cloud", href: APPLICATION_SHELL_ROUTES.cloud },
        { label: "Licensing" },
      ]}
    >
      <CloudLicensingPanel license={context.license} tenant={context.tenant} />
    </ApplicationPageTemplate>
  );
}
