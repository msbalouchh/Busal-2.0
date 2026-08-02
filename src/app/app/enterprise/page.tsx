import type { Metadata } from "next";
import { Building2 } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EnterpriseDashboardPanel } from "@/modules/enterprise-platform-management/components/enterprise-dashboard-panel";
import { getEnterpriseDashboardContext } from "@/modules/enterprise-platform-management/lib/get-enterprise-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Enterprise" };
}

export default async function EnterpriseDashboardPage() {
  const context = await getEnterpriseDashboardContext();

  return (
    <ApplicationPageTemplate
      title="Enterprise"
      description="Identity, organization, and compliance management for enterprise customers."
      icon={Building2}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Enterprise" },
      ]}
    >
      <EnterpriseDashboardPanel
        context={context}
        summary={context.summary}
        organizations={context.organizations}
        recentAudit={context.recentAudit}
      />
    </ApplicationPageTemplate>
  );
}
