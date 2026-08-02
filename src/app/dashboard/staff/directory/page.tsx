import type { Metadata } from "next";

import { StaffDirectory } from "@/modules/staff/components/staff-directory";
import { StaffPageHeader } from "@/modules/staff/components/staff-page-header";
import { getStaffManagementContext } from "@/modules/staff/lib/get-staff-context";

export const metadata: Metadata = {
  title: "Staff Directory",
};

export default async function StaffDirectoryPage() {
  const { directory, branches, roles, permissionsFlags } = await getStaffManagementContext();

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Staff Directory"
        description="Search, filter, and manage your team with bulk actions."
      />
      <StaffDirectory
        initialDirectory={directory}
        branches={branches}
        roles={roles}
        permissions={permissionsFlags}
      />
    </div>
  );
}
