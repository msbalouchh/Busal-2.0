import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CreateBranchForm } from "@/modules/branch-management/components/create-branch-form";
import { getBranchManagementContext } from "@/modules/branch-management/lib/get-branch-management-context";
import { BRANCH_MANAGEMENT_ROUTES } from "@/modules/branch-management/constants/routes";

export const metadata: Metadata = {
  title: "Create Branch",
};

export default async function CreateBranchPage() {
  const context = await getBranchManagementContext();

  if (!context.permissionsFlags.canCreate) {
    redirect(BRANCH_MANAGEMENT_ROUTES.list);
  }

  return (
    <ApplicationPageTemplate
      title="Create Branch"
      description="Add a new branch location for your business."
      icon={Building2}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Branches", href: BRANCH_MANAGEMENT_ROUTES.list },
        { label: "Create" },
      ]}
    >
      <CreateBranchForm
        defaultCountry={context.business.country}
        defaultTimezone={context.business.timezone}
        defaultCurrency={context.business.currency}
      />
    </ApplicationPageTemplate>
  );
}
