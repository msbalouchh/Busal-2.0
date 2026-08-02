import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CloudSettingsPanel } from "@/modules/cloud-platform-management/components/cloud-settings-panel";
import { getCloudSettingsContext } from "@/modules/cloud-platform-management/lib/get-cloud-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Cloud Settings" };
}

export default async function CloudSettingsPage() {
  const context = await getCloudSettingsContext();
  return (
    <ApplicationPageTemplate
      title="Platform Settings"
      description="Cloud platform and region settings."
      icon={Settings}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Cloud", href: APPLICATION_SHELL_ROUTES.cloud },
        { label: "Settings" },
      ]}
    >
      <CloudSettingsPanel context={context} settings={context.settings} />
    </ApplicationPageTemplate>
  );
}
