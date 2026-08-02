import type { Metadata } from "next";
import { Shield } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { RbacManagementPanel } from "@/modules/rbac/components/rbac-management-panel";
import { RBAC_ROUTES } from "@/modules/rbac/constants/rbac-routes";
import { getRbacManagementContext } from "@/modules/rbac/lib/get-rbac-context";

export const metadata: Metadata = {
  title: "Roles & Permissions",
};

export default async function ApplicationRolesSettingsPage() {
  const context = await getRbacManagementContext();

  return (
    <ApplicationPageTemplate
      title="Roles & Permissions"
      description="Manage default system roles, custom roles, and permission assignments for your business."
      icon={Shield}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Settings", href: RBAC_ROUTES.settings },
        { label: "Roles & Permissions" },
      ]}
    >
      <RbacManagementPanel context={context} />
    </ApplicationPageTemplate>
  );
}
