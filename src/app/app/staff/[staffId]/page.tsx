import type { Metadata } from "next";
import { Users } from "lucide-react";

import { ApplicationPageTemplate } from "@/components/layout/application-page-template";
import { APPLICATION_SHELL_ROUTES } from "@/components/layout/application-shell-config";
import { StaffDetailsPanel } from "@/modules/staff-management/components/staff-details-panel";
import { STAFF_MANAGEMENT_ROUTES } from "@/modules/staff-management/constants/routes";
import { getStaffDetailContext } from "@/modules/staff-management/lib/get-staff-management-context";

export const metadata: Metadata = {
  title: "Staff Profile",
};

interface StaffDetailPageProps {
  params: Promise<{ staffId: string }>;
}

export default async function StaffDetailPage({ params }: StaffDetailPageProps) {
  const { staffId } = await params;
  const context = await getStaffDetailContext(staffId);

  return (
    <ApplicationPageTemplate
      title={context.member.fullName || `${context.member.firstName} ${context.member.lastName}`}
      description="Staff profile, role assignment, and branch access."
      icon={Users}
      breadcrumbs={[
        { label: "Busal OS", href: APPLICATION_SHELL_ROUTES.dashboard },
        { label: "Staff", href: STAFF_MANAGEMENT_ROUTES.list },
        { label: context.member.fullName || "Profile" },
      ]}
    >
      <StaffDetailsPanel context={context} member={context.member} />
    </ApplicationPageTemplate>
  );
}
