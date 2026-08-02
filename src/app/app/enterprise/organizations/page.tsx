import type { Metadata } from "next";
import { Building2 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EnterpriseOrganizationsPanel } from "@/modules/enterprise-platform-management/components/enterprise-organizations-panel";
import { getEnterpriseOrganizationsContext } from "@/modules/enterprise-platform-management/lib/get-enterprise-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Organizations" };
}

export default async function EnterpriseOrganizationsPage() {
  const context = await getEnterpriseOrganizationsContext();

  return (
    <ApplicationPageTemplate
      title="Organizations"
      description="Manage enterprise organizations under your tenant."
      icon={Building2}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Enterprise", href: APPLICATION_SHELL_ROUTES.enterprise },
        { label: "Organizations" },
      ]}
    >
      <EnterpriseOrganizationsPanel context={context} organizations={context.organizations} />
    </ApplicationPageTemplate>
  );
}
