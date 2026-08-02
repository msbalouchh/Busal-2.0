import type { Metadata } from "next";
import { Boxes } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { ModulesDashboardPanel } from "@/modules/business-modules/components/modules-dashboard-panel";
import { getBusinessModulesContext } from "@/modules/business-modules/lib/get-business-modules-context";

export const metadata: Metadata = {
  title: "Modules",
};

export default async function ApplicationModulesPage() {
  const context = await getBusinessModulesContext();

  return (
    <ApplicationPageTemplate
      title="Modules"
      description="Manage industry modules for your business. Enable the capabilities you need without changing your core Busal OS workspace."
      icon={Boxes}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Modules" },
      ]}
    >
      <ModulesDashboardPanel context={context} />
    </ApplicationPageTemplate>
  );
}
