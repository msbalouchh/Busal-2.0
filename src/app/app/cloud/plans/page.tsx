import type { Metadata } from "next";
import { Layers } from "lucide-react";
import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CloudPlansPanel } from "@/modules/cloud-platform-management/components/cloud-plans-panel";
import { getCloudPlansContext } from "@/modules/cloud-platform-management/lib/get-cloud-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Plans" };
}

export default async function CloudPlansPage() {
  const context = await getCloudPlansContext();
  return (
    <ApplicationPageTemplate
      title="Plans"
      description="Subscription plan catalog and tiers."
      icon={Layers}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Cloud", href: APPLICATION_SHELL_ROUTES.cloud },
        { label: "Plans" },
      ]}
    >
      <CloudPlansPanel plans={context.plans} />
    </ApplicationPageTemplate>
  );
}
