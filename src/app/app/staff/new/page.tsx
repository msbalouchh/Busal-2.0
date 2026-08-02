import type { Metadata } from "next";
import { Users } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { CreateStaffForm } from "@/modules/staff-management/components/create-staff-form";
import { STAFF_MANAGEMENT_ROUTES } from "@/modules/staff-management/constants/routes";
import { getStaffManagementContext } from "@/modules/staff-management/lib/get-staff-management-context";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create Staff",
};

export default async function CreateStaffPage() {
  const context = await getStaffManagementContext();

  if (!context.permissionsFlags.canCreate) {
    redirect(STAFF_MANAGEMENT_ROUTES.list);
  }

  return (
    <ApplicationPageTemplate
      title="Create staff member"
      description="Add a new staff member to your business."
      icon={Users}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Staff", href: STAFF_MANAGEMENT_ROUTES.list },
        { label: "Create" },
      ]}
    >
      <CreateStaffForm branches={context.branches} roles={context.roles} />
    </ApplicationPageTemplate>
  );
}
