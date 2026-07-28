import type { Metadata } from "next";

import { StaffMembersManager } from "@/modules/staff/components/staff-members-manager";
import { StaffPageHeader } from "@/modules/staff/components/staff-page-header";
import { getStaffModuleContext } from "@/modules/staff/lib/get-staff-context";

export const metadata: Metadata = {
  title: "Staff Members",
};

export default async function StaffMembersPage() {
  const { members, branches, roles } = await getStaffModuleContext();

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Staff Members"
        description="Manage team members, assign branches and roles, and control active status."
      />
      <StaffMembersManager members={members} branches={branches} roles={roles} />
    </div>
  );
}
