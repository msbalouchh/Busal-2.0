import type { Metadata } from "next";
import { Flag } from "lucide-react";
import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CloudFeatureFlagsPanel } from "@/modules/cloud-platform-management/components/cloud-feature-flags-panel";
import { getCloudFeatureFlagsContext } from "@/modules/cloud-platform-management/lib/get-cloud-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Feature Flags" };
}

export default async function CloudFeatureFlagsPage() {
  const context = await getCloudFeatureFlagsContext();
  return (
    <ApplicationPageTemplate
      title="Feature Flags"
      description="Tenant-scoped SaaS feature flags."
      icon={Flag}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Cloud", href: APPLICATION_SHELL_ROUTES.cloud },
        { label: "Feature Flags" },
      ]}
    >
      <CloudFeatureFlagsPanel context={context} flags={context.flags} />
    </ApplicationPageTemplate>
  );
}
