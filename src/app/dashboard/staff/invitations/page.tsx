import type { Metadata } from "next";

import { StaffInvitationsPanel } from "@/modules/staff/components/staff-invitations-panel";
import { StaffPageHeader } from "@/modules/staff/components/staff-page-header";
import { getStaffManagementContext } from "@/modules/staff/lib/get-staff-context";

export const metadata: Metadata = {
  title: "Staff Invitations",
};

export default async function StaffInvitationsPage() {
  const { invitations, roles, branches, permissionsFlags } = await getStaffManagementContext();

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Staff Invitations"
        description="Invite team members by email and manage pending invitations."
      />
      <StaffInvitationsPanel
        invitations={invitations}
        roles={roles}
        branches={branches}
        permissions={permissionsFlags}
      />
    </div>
  );
}
