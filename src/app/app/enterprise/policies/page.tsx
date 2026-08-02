import type { Metadata } from "next";
import { Shield } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EnterprisePoliciesPanel } from "@/modules/enterprise-platform-management/components/enterprise-policies-panel";
import { getEnterprisePoliciesContext } from "@/modules/enterprise-platform-management/lib/get-enterprise-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Policies" };
}

export default async function EnterprisePoliciesPage() {
  const context = await getEnterprisePoliciesContext();

  return (
    <ApplicationPageTemplate
      title="Enterprise Policies"
      description="Session, password, device, and compliance policy enforcement."
      icon={Shield}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Enterprise", href: APPLICATION_SHELL_ROUTES.enterprise },
        { label: "Policies" },
      ]}
    >
      <EnterprisePoliciesPanel
        context={context}
        policies={context.policies}
        organizations={context.organizations}
      />
    </ApplicationPageTemplate>
  );
}
