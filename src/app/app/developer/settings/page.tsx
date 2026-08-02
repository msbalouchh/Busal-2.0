import type { Metadata } from "next";
import { Settings2 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DeveloperSettingsPanel } from "@/modules/developer-platform-management/components/developer-settings-panel";
import { getDeveloperSettingsContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";
import { DEVELOPER_PLATFORM_ROUTES } from "@/modules/developer-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Developer Settings" };
}

export default async function DeveloperSettingsPage() {
  const context = await getDeveloperSettingsContext();

  return (
    <ApplicationPageTemplate
      title="Developer Settings"
      description="Configure rate limits and IP allow lists."
      icon={Settings2}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Developer", href: DEVELOPER_PLATFORM_ROUTES.dashboard() },
        { label: "Settings" },
      ]}
    >
      <DeveloperSettingsPanel
        context={context}
        settings={context.settings}
        sdkLanguages={context.sdkLanguages}
      />
    </ApplicationPageTemplate>
  );
}
