import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EnterpriseCompliancePanel } from "@/modules/enterprise-platform-management/components/enterprise-compliance-panel";
import { getEnterpriseComplianceContext } from "@/modules/enterprise-platform-management/lib/get-enterprise-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Compliance" };
}

export default async function EnterpriseCompliancePage() {
  const context = await getEnterpriseComplianceContext();

  return (
    <ApplicationPageTemplate
      title="Compliance"
      description="Enterprise compliance dashboard and audit trail."
      icon={ShieldCheck}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Enterprise", href: APPLICATION_SHELL_ROUTES.enterprise },
        { label: "Compliance" },
      ]}
    >
      <EnterpriseCompliancePanel compliance={context.compliance} audit={context.audit} />
    </ApplicationPageTemplate>
  );
}
