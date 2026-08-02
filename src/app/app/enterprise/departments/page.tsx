import type { Metadata } from "next";
import { Users } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EnterpriseDepartmentsPanel } from "@/modules/enterprise-platform-management/components/enterprise-departments-panel";
import { getEnterpriseDepartmentsContext } from "@/modules/enterprise-platform-management/lib/get-enterprise-platform-context";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Departments" };
}

export default async function EnterpriseDepartmentsPage() {
  const context = await getEnterpriseDepartmentsContext();

  return (
    <ApplicationPageTemplate
      title="Departments"
      description="Departments, business units, and organization hierarchy."
      icon={Users}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Enterprise", href: APPLICATION_SHELL_ROUTES.enterprise },
        { label: "Departments" },
      ]}
    >
      <EnterpriseDepartmentsPanel
        context={context}
        departments={context.departments}
        organizations={context.organizations}
      />
    </ApplicationPageTemplate>
  );
}
