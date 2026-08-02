import type { Metadata } from "next";
import { Settings } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EnterpriseSettingsPanel } from "@/modules/enterprise-platform-management/components/enterprise-settings-panel";
import { getEnterpriseSettingsContext } from "@/modules/enterprise-platform-management/lib/get-enterprise-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Organization Settings" };
}

export default async function EnterpriseSettingsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const context = await getEnterpriseSettingsContext(organizationId);

  return (
    <ApplicationPageTemplate
      title="Organization Settings"
      description="Enterprise organization configuration and settings."
      icon={Settings}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Enterprise", href: APPLICATION_SHELL_ROUTES.enterprise },
        { label: "Settings" },
      ]}
    >
      <EnterpriseSettingsPanel context={context} settings={context.settings} />
    </ApplicationPageTemplate>
  );
}
