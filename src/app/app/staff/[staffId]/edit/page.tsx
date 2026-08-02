import type { Metadata } from "next";
import { Users } from "lucide-react";
import { redirect } from "next/navigation";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { EditStaffForm } from "@/modules/staff-management/components/edit-staff-form";
import { STAFF_MANAGEMENT_ROUTES } from "@/modules/staff-management/constants/routes";
import { getStaffDetailContext } from "@/modules/staff-management/lib/get-staff-management-context";

export const metadata: Metadata = {
  title: "Edit Staff",
};

interface EditStaffPageProps {
  params: Promise<{ staffId: string }>;
}

export default async function EditStaffPage({ params }: EditStaffPageProps) {
  const { staffId } = await params;
  const context = await getStaffDetailContext(staffId);

  if (!context.permissionsFlags.canUpdate) {
    redirect(STAFF_MANAGEMENT_ROUTES.details(staffId));
  }

  return (
    <ApplicationPageTemplate
      title="Edit staff member"
      description="Update staff profile, employment details, roles, and branches."
      icon={Users}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Staff", href: STAFF_MANAGEMENT_ROUTES.list },
        {
          label: context.member.fullName || "Profile",
          href: STAFF_MANAGEMENT_ROUTES.details(staffId),
        },
        { label: "Edit" },
      ]}
    >
      <EditStaffForm member={context.member} branches={context.branches} roles={context.roles} />
    </ApplicationPageTemplate>
  );
}
