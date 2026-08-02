import type { Metadata } from "next";
import { Server } from "lucide-react";
import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CloudTenantsPanel } from "@/modules/cloud-platform-management/components/cloud-tenants-panel";
import { getCloudTenantsContext } from "@/modules/cloud-platform-management/lib/get-cloud-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Tenants" };
}

export default async function CloudTenantsPage() {
  const context = await getCloudTenantsContext();
  return (
    <ApplicationPageTemplate
      title="Tenants"
      description="SaaS tenant provisioning and lifecycle."
      icon={Server}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Cloud", href: APPLICATION_SHELL_ROUTES.cloud },
        { label: "Tenants" },
      ]}
    >
      <CloudTenantsPanel context={context} tenants={context.tenants} />
    </ApplicationPageTemplate>
  );
}
