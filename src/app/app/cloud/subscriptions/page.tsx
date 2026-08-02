import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CloudSubscriptionsPanel } from "@/modules/cloud-platform-management/components/cloud-subscriptions-panel";
import { getCloudSubscriptionsContext } from "@/modules/cloud-platform-management/lib/get-cloud-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Subscriptions" };
}

export default async function CloudSubscriptionsPage() {
  const context = await getCloudSubscriptionsContext();
  return (
    <ApplicationPageTemplate
      title="Subscriptions"
      description="Manage tenant subscriptions and trials."
      icon={CreditCard}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Cloud", href: APPLICATION_SHELL_ROUTES.cloud },
        { label: "Subscriptions" },
      ]}
    >
      <CloudSubscriptionsPanel context={context} subscriptions={context.subscriptions} />
    </ApplicationPageTemplate>
  );
}
