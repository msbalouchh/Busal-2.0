import type { Metadata } from "next";

import { StaffOverview } from "@/modules/staff/components/staff-overview";
import { StaffPageHeader } from "@/modules/staff/components/staff-page-header";
import { getStaffManagementContext } from "@/modules/staff/lib/get-staff-context";

export const metadata: Metadata = {
  title: "Staff Overview",
};

export default async function StaffOverviewPage() {
  const { directory, roles, invitations, auditLogs } = await getStaffManagementContext();

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Staff Management"
        description="Manage your team, roles, permissions, invitations, and security."
      />
      <StaffOverview
        members={directory.items}
        roles={roles}
        invitationCount={invitations.filter((entry) => entry.status === "PENDING").length}
        recentActivity={auditLogs}
      />
    </div>
  );
}
