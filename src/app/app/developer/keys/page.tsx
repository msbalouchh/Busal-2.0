import type { Metadata } from "next";
import { Key } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { DeveloperKeysPanel } from "@/modules/developer-platform-management/components/developer-keys-panel";
import { getDeveloperKeysContext } from "@/modules/developer-platform-management/lib/get-developer-platform-context";
import { DEVELOPER_PLATFORM_ROUTES } from "@/modules/developer-platform-management/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "API Keys" };
}

export default async function DeveloperKeysPage() {
  const context = await getDeveloperKeysContext();

  return (
    <ApplicationPageTemplate
      title="API Keys"
      description="Create and manage scoped API keys."
      icon={Key}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Developer", href: DEVELOPER_PLATFORM_ROUTES.dashboard() },
        { label: "API Keys" },
      ]}
    >
      <DeveloperKeysPanel
        context={context}
        keys={context.keys}
        applications={context.applications}
      />
    </ApplicationPageTemplate>
  );
}
